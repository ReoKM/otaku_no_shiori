/**
 * ゲスト→クラウド移行(F8)のテキストデータ一括INSERT本体。
 * 参照: docs/03_tech_stack.md「ゲスト→ログインのデータ移行」手順2
 *
 * `service_role`クライアント(`src/lib/supabase/admin.ts`)でRLSを越えて書き込む。
 * このモジュール自身は認証を行わない。呼び出し側(Route Handler)が
 * Cookieセッションから確定させた`userId`を渡すこと。
 *
 * 冪等性: 各テーブルへの書き込みは主キーで`upsert`(`ignoreDuplicates: true`)する。
 * 部分失敗後にクライアントが同じペイロードを再送しても、
 * 既に入った行は無視され、未挿入の行だけが実際にINSERTされる(安全にリトライできる)。
 * 参照: docs/03_tech_stack.md「ゲスト→ログインのデータ移行」手順6
 *
 * シードスポット参照(`shiori_spots.spot_id`が`seed-`ID)の扱いは
 * `src/lib/seed-spot-db-id.ts`のコメント、および
 * docs/design/screens/S4_スポット検索.md「参照整合性の注記」を参照。
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { seedSpotDbId } from "@/lib/seed-spot-db-id";
import type { ValidatedGuestMigrationPayload } from "@/lib/guest-migration-validation";

export type GuestMigrationStage =
  | "shiori"
  | "spots"
  | "packing_items"
  | "todos"
  | "itinerary_entries"
  | "shiori_spots";

/** どのテーブルへのINSERTで失敗したかを保持するエラー。 */
export class GuestMigrationStageError extends Error {
  readonly stage: GuestMigrationStage;
  readonly code: string | null;

  constructor(stage: GuestMigrationStage, cause: { code?: string | null; message: string }) {
    super(`ゲストデータ移行に失敗しました(${stage}): ${cause.message}`);
    this.name = "GuestMigrationStageError";
    this.stage = stage;
    this.code = cause.code ?? null;
  }
}

export interface GuestMigrationCounts {
  shiori: number;
  spots: number;
  packing_items: number;
  todos: number;
  itinerary_entries: number;
  shiori_spots: number;
}

export interface GuestMigrationResult {
  inserted: GuestMigrationCounts;
  skipped: {
    /** 同梱シードデータに存在しない`seed-`IDを参照していたため移行しなかった件数。 */
    unknown_seed_spot: number;
    /**
     * 参照している`shiori_id`が「このユーザーが所有するしおり」ではなかったため
     * 移行しなかった件数(packing_items/todos/itinerary_entries/shiori_spots合算)。
     * 通常は発生しない。攻撃者が他人の実UUIDを`shiori[]`に紛れ込ませてIDOR
     * (他人のしおりへ子データを注入)を試みた場合の防御としてのみ働く。
     */
    unauthorized_shiori_id: number;
  };
}

/**
 * 検証済みペイロードを一括INSERTする。
 *
 * 使用例:
 * ```ts
 * const admin = getSupabaseAdminClient();
 * const result = await migrateGuestData(admin, userId, validatedPayload);
 * // result.inserted.shiori === 2 など
 * ```
 */
export async function migrateGuestData(
  admin: SupabaseClient,
  userId: string,
  payload: ValidatedGuestMigrationPayload,
): Promise<GuestMigrationResult> {
  const counts: GuestMigrationCounts = {
    shiori: 0,
    spots: 0,
    packing_items: 0,
    todos: 0,
    itinerary_entries: 0,
    shiori_spots: 0,
  };

  if (payload.shiori.length > 0) {
    const rows = payload.shiori.map((s) => ({ ...s, user_id: userId }));
    await upsert(admin, "shiori", rows, "id");
    counts.shiori = rows.length;
  }

  // UGCスポット(本人所有)とシードスポット(全ユーザー共有、初回参照時に登録)を
  // 同じ`spots`テーブルへ1回のupsertでまとめて登録する。
  const ugcSpotRows = payload.spots.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    category: s.category,
    area: s.area,
    source: "ugc" as const,
    status: "private" as const,
    created_by: userId,
    created_at: s.created_at,
  }));
  const seedSpotRows = payload.referenced_seed_spots.map((seed) => ({
    id: seedSpotDbId(seed.id),
    name: seed.name,
    description: seed.description,
    category: seed.category,
    area: seed.area,
    source: "seed" as const,
    status: "public" as const,
    created_by: null,
  }));
  const spotRows = [...ugcSpotRows, ...seedSpotRows];
  if (spotRows.length > 0) {
    await upsert(admin, "spots", spotRows, "id");
    counts.spots = spotRows.length;
  }

  // --- IDOR対策: 子データが参照する`shiori_id`が、本当にこのユーザーが所有する
  // しおりかをDB上で確認する。
  //
  // 上の`shiori`upsertは`onConflict: "id", ignoreDuplicates: true`のため、
  // 攻撃者が他人の既存しおりの実UUIDを自分のリクエストの`shiori[]`に含めても、
  // そのshiori行自体は「既に存在する」として無視されるだけで上書きはされない。
  // しかしそれだけでは、同じ`shiori_id`を参照する子データ(持ち物・TODO・旅程・
  // shiori_spots)が所有権チェック無しでそのままINSERTされてしまう
  // (このAPIはservice_roleで書くためRLSのEXISTSポリシーも効かない)。
  //
  // ここでは子データが参照する`shiori_id`一覧をDBへ`user_id = userId`条件付きで
  // 問い合わせ、「新規にこのユーザーとして挿入した行」「既にこのユーザー所有として
  // 存在していた行(再送によるリトライを含む)」のいずれでもない`shiori_id`を参照する
  // 子データは書き込まずスキップする
  // (全体を失敗させるのではなく、不正/不整合な行だけを除外して残りの移行は継続する。
  // 参照: `skipped_unknown_seed_spot_count`と同じ「一部除外・継続」方針)。
  const referencedShioriIds = new Set<string>();
  for (const row of payload.packing_items) referencedShioriIds.add(row.shiori_id);
  for (const row of payload.todos) referencedShioriIds.add(row.shiori_id);
  for (const row of payload.itinerary_entries) referencedShioriIds.add(row.shiori_id);
  for (const row of payload.shiori_spots) referencedShioriIds.add(row.shiori_id);

  let ownedShioriIds = new Set<string>();
  if (referencedShioriIds.size > 0) {
    const { data, error } = await admin
      .from("shiori")
      .select("id")
      .in("id", Array.from(referencedShioriIds))
      .eq("user_id", userId);
    if (error) {
      throw new GuestMigrationStageError("shiori", { code: error.code ?? null, message: error.message });
    }
    ownedShioriIds = new Set((data ?? []).map((row) => (row as { id: string }).id));
  }

  const packingItems = filterOwnedByShiori(payload.packing_items, ownedShioriIds);
  const todos = filterOwnedByShiori(payload.todos, ownedShioriIds);
  const itineraryEntries = filterOwnedByShiori(payload.itinerary_entries, ownedShioriIds);
  const shioriSpots = filterOwnedByShiori(payload.shiori_spots, ownedShioriIds);

  if (packingItems.kept.length > 0) {
    await upsert(admin, "packing_items", packingItems.kept, "id");
    counts.packing_items = packingItems.kept.length;
  }

  if (todos.kept.length > 0) {
    await upsert(admin, "todos", todos.kept, "id");
    counts.todos = todos.kept.length;
  }

  if (itineraryEntries.kept.length > 0) {
    await upsert(admin, "itinerary_entries", itineraryEntries.kept, "id");
    counts.itinerary_entries = itineraryEntries.kept.length;
  }

  if (shioriSpots.kept.length > 0) {
    // シードスポット参照は、上でupsert済みの決定論的UUIDへ付け替えてから書き込む
    // (`spots.id`はuuid型のため`seed-`プレフィックス文字列のままでは書き込めない)。
    const rows = shioriSpots.kept.map((link) => ({
      shiori_id: link.shiori_id,
      spot_id: link.spot_id.startsWith("seed-") ? seedSpotDbId(link.spot_id) : link.spot_id,
      memo: link.memo,
      is_visited: link.is_visited,
    }));
    await upsert(admin, "shiori_spots", rows, "shiori_id,spot_id");
    counts.shiori_spots = rows.length;
  }

  const unauthorizedShioriIdCount =
    packingItems.skippedCount + todos.skippedCount + itineraryEntries.skippedCount + shioriSpots.skippedCount;

  return {
    inserted: counts,
    skipped: {
      unknown_seed_spot: payload.skipped_unknown_seed_spot_count,
      unauthorized_shiori_id: unauthorizedShioriIdCount,
    },
  };
}

/** `ownedShioriIds`に含まれない`shiori_id`を参照する行を除外する。 */
function filterOwnedByShiori<T extends { shiori_id: string }>(
  rows: T[],
  ownedShioriIds: Set<string>,
): { kept: T[]; skippedCount: number } {
  const kept: T[] = [];
  let skippedCount = 0;
  for (const row of rows) {
    if (ownedShioriIds.has(row.shiori_id)) {
      kept.push(row);
    } else {
      skippedCount += 1;
    }
  }
  return { kept, skippedCount };
}

async function upsert(
  client: SupabaseClient,
  table: GuestMigrationStage,
  rows: object[],
  onConflict: string,
): Promise<void> {
  const { error } = await client.from(table).upsert(rows, { onConflict, ignoreDuplicates: true });
  if (error) {
    throw new GuestMigrationStageError(table, { code: error.code ?? null, message: error.message });
  }
}
