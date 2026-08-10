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

  if (payload.packing_items.length > 0) {
    await upsert(admin, "packing_items", payload.packing_items, "id");
    counts.packing_items = payload.packing_items.length;
  }

  if (payload.todos.length > 0) {
    await upsert(admin, "todos", payload.todos, "id");
    counts.todos = payload.todos.length;
  }

  if (payload.itinerary_entries.length > 0) {
    await upsert(admin, "itinerary_entries", payload.itinerary_entries, "id");
    counts.itinerary_entries = payload.itinerary_entries.length;
  }

  if (payload.shiori_spots.length > 0) {
    // シードスポット参照は、上でupsert済みの決定論的UUIDへ付け替えてから書き込む
    // (`spots.id`はuuid型のため`seed-`プレフィックス文字列のままでは書き込めない)。
    const rows = payload.shiori_spots.map((link) => ({
      shiori_id: link.shiori_id,
      spot_id: link.spot_id.startsWith("seed-") ? seedSpotDbId(link.spot_id) : link.spot_id,
      memo: link.memo,
      is_visited: link.is_visited,
    }));
    await upsert(admin, "shiori_spots", rows, "shiori_id,spot_id");
    counts.shiori_spots = rows.length;
  }

  return {
    inserted: counts,
    skipped: { unknown_seed_spot: payload.skipped_unknown_seed_spot_count },
  };
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
