/**
 * ゲスト→クラウド移行API(POST /api/migration/guest、仮置きのエンドポイント名)の入力検証。
 *
 * 対象はテキストデータのみ(しおり・持ち物・TODO・旅程・行きたいスポット)。
 * 写真の移行は別タスク(#98)の対象で、このモジュールでは扱わない。
 * 参照: docs/03_tech_stack.md「ゲスト→ログインのデータ移行」
 *
 * 文字数上限は既存の各フォームのバリデーション定数(S2/S3a/S3b/S3c)にそのまま合わせる。
 * `user_id` / `created_by` / `spots.source` / `spots.status` はここでは検証しない
 * (クライアントからの値は信用せず、呼び出し側=Route Handlerがサーバー側で強制的に上書きする)。
 */
import { getSeedSpotById } from "@/lib/seed-spots";
import { SHIORI_PURPOSE_MAX_LENGTH, SHIORI_TITLE_MAX_LENGTH } from "@/lib/shiori-validation";
import { PACKING_LABEL_MAX_LENGTH } from "@/lib/packing-validation";
import { TODO_LABEL_MAX_LENGTH } from "@/lib/todo-validation";
import {
  ITINERARY_MEMO_MAX_LENGTH,
  ITINERARY_PLACE_NAME_MAX_LENGTH,
  ITINERARY_TITLE_MAX_LENGTH,
} from "@/lib/itinerary-validation";
import { SPOT_MEMO_MAX_LENGTH, SPOT_NAME_MAX_LENGTH } from "@/lib/spot-validation";
import type { SeedSpot } from "@/lib/seed-spots";
import type { TripType } from "@/types/shiori";

// 仕様に数値記載が無いため、既存フィールドの上限(30〜100文字)の並びに揃えて仮置き。
// UIからは現状セットされない項目(spots.description/category/area)だが、
// 直接APIを叩く経路の防御として上限を設ける。
export const SPOT_DESCRIPTION_MAX_LENGTH = 200;
export const SPOT_CATEGORY_MAX_LENGTH = 30;
export const SPOT_AREA_MAX_LENGTH = 30;

// 1回の移行リクエストで受け付ける件数の上限(仮置き)。
// 仕様に明記は無いが、無料枠ガードレール(N+1・無限ループ的な過大リクエストを書かない)に沿い、
// ゲスト1台分のデータとして現実的にありえない件数のリクエストを弾く目的で設定する。
export const MAX_SHIORI_COUNT = 50;
export const MAX_PACKING_ITEMS_COUNT = 500;
export const MAX_TODOS_COUNT = 500;
export const MAX_ITINERARY_ENTRIES_COUNT = 500;
export const MAX_SPOTS_COUNT = 200;
export const MAX_SHIORI_SPOTS_COUNT = 500;

const TRIP_TYPES: readonly TripType[] = ["live", "seichi", "stage", "other"];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;
const COVER_RE = /^(color:#[0-9a-fA-F]{6}|emoji:.+)$/;
const SEED_SPOT_ID_PREFIX = "seed-";

export interface ShioriMigrationInput {
  id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  trip_type: TripType;
  purpose: string | null;
  cover: string | null;
  created_at: string;
  updated_at: string;
}

export interface PackingItemMigrationInput {
  id: string;
  shiori_id: string;
  label: string;
  is_checked: boolean;
  sort_order: number;
}

export interface TodoMigrationInput {
  id: string;
  shiori_id: string;
  label: string;
  due_date: string | null;
  is_done: boolean;
  sort_order: number;
}

export interface ItineraryEntryMigrationInput {
  id: string;
  shiori_id: string;
  day_date: string;
  time: string | null;
  title: string;
  place_name: string | null;
  memo: string | null;
  sort_order: number;
}

/** UGC(自由入力)スポットのみを対象とする。シードスポットはクライアントから送らない。 */
export interface SpotMigrationInput {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  area: string | null;
  created_at: string;
}

export interface ShioriSpotMigrationInput {
  shiori_id: string;
  spot_id: string;
  memo: string | null;
  is_visited: boolean;
}

export interface ValidatedGuestMigrationPayload {
  shiori: ShioriMigrationInput[];
  packing_items: PackingItemMigrationInput[];
  todos: TodoMigrationInput[];
  itinerary_entries: ItineraryEntryMigrationInput[];
  spots: SpotMigrationInput[];
  shiori_spots: ShioriSpotMigrationInput[];
  /** shiori_spotsが参照する、DBへ未登録の可能性があるシードスポット(重複除去済み)。 */
  referenced_seed_spots: SeedSpot[];
  /** 同梱シードデータに存在しない`seed-`IDを参照していたため移行から除外した件数。 */
  skipped_unknown_seed_spot_count: number;
}

export type GuestMigrationValidationResult =
  | { ok: true; data: ValidatedGuestMigrationPayload }
  | { ok: false; errors: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

/**
 * ゲストデータ移行リクエストのボディを検証する。
 *
 * 入出力例:
 * ```ts
 * const result = validateGuestMigrationPayload({
 *   shiori: [{ id: "…", title: "夏フェス遠征", start_date: null, end_date: null,
 *              trip_type: "live", purpose: null, cover: null,
 *              created_at: "2026-08-01T00:00:00.000Z", updated_at: "2026-08-01T00:00:00.000Z" }],
 *   packing_items: [], todos: [], itinerary_entries: [], spots: [], shiori_spots: [],
 * });
 * // result.ok === true なら result.data を移行処理に渡せる
 * ```
 */
export function validateGuestMigrationPayload(body: unknown): GuestMigrationValidationResult {
  const errors: string[] = [];

  if (!isRecord(body)) {
    return { ok: false, errors: ["リクエストボディはJSONオブジェクトである必要があります"] };
  }

  const shioriRaw = body.shiori;
  const packingRaw = body.packing_items;
  const todosRaw = body.todos;
  const itineraryRaw = body.itinerary_entries;
  const spotsRaw = body.spots;
  const shioriSpotsRaw = body.shiori_spots;

  if (!Array.isArray(shioriRaw)) errors.push("shioriは配列である必要があります");
  if (!Array.isArray(packingRaw)) errors.push("packing_itemsは配列である必要があります");
  if (!Array.isArray(todosRaw)) errors.push("todosは配列である必要があります");
  if (!Array.isArray(itineraryRaw)) errors.push("itinerary_entriesは配列である必要があります");
  if (!Array.isArray(spotsRaw)) errors.push("spotsは配列である必要があります");
  if (!Array.isArray(shioriSpotsRaw)) errors.push("shiori_spotsは配列である必要があります");

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const shioriArr = shioriRaw as unknown[];
  const packingArr = packingRaw as unknown[];
  const todosArr = todosRaw as unknown[];
  const itineraryArr = itineraryRaw as unknown[];
  const spotsArr = spotsRaw as unknown[];
  const shioriSpotsArr = shioriSpotsRaw as unknown[];

  if (shioriArr.length > MAX_SHIORI_COUNT) {
    errors.push(`shioriは${MAX_SHIORI_COUNT}件以内にしてください(${shioriArr.length}件)`);
  }
  if (packingArr.length > MAX_PACKING_ITEMS_COUNT) {
    errors.push(`packing_itemsは${MAX_PACKING_ITEMS_COUNT}件以内にしてください(${packingArr.length}件)`);
  }
  if (todosArr.length > MAX_TODOS_COUNT) {
    errors.push(`todosは${MAX_TODOS_COUNT}件以内にしてください(${todosArr.length}件)`);
  }
  if (itineraryArr.length > MAX_ITINERARY_ENTRIES_COUNT) {
    errors.push(
      `itinerary_entriesは${MAX_ITINERARY_ENTRIES_COUNT}件以内にしてください(${itineraryArr.length}件)`,
    );
  }
  if (spotsArr.length > MAX_SPOTS_COUNT) {
    errors.push(`spotsは${MAX_SPOTS_COUNT}件以内にしてください(${spotsArr.length}件)`);
  }
  if (shioriSpotsArr.length > MAX_SHIORI_SPOTS_COUNT) {
    errors.push(`shiori_spotsは${MAX_SHIORI_SPOTS_COUNT}件以内にしてください(${shioriSpotsArr.length}件)`);
  }

  const shioriIds = new Set<string>();
  const shiori: ShioriMigrationInput[] = [];
  shioriArr.forEach((raw, index) => {
    const prefix = `shiori[${index}]`;
    if (!isRecord(raw)) {
      errors.push(`${prefix}はオブジェクトである必要があります`);
      return;
    }
    if (!isNonEmptyString(raw.id) || !UUID_RE.test(raw.id)) {
      errors.push(`${prefix}.idはUUID文字列である必要があります`);
      return;
    }
    if (shioriIds.has(raw.id)) {
      errors.push(`${prefix}.idが重複しています: ${raw.id}`);
      return;
    }
    const title = raw.title;
    if (!isNonEmptyString(title)) {
      errors.push(`${prefix}.titleは必須です`);
      return;
    }
    if (title.trim().length > SHIORI_TITLE_MAX_LENGTH) {
      errors.push(`${prefix}.titleは${SHIORI_TITLE_MAX_LENGTH}文字以内にしてください`);
      return;
    }
    if (!isNullableString(raw.start_date) || (raw.start_date !== null && !DATE_RE.test(raw.start_date))) {
      errors.push(`${prefix}.start_dateはYYYY-MM-DDまたはnullである必要があります`);
      return;
    }
    if (!isNullableString(raw.end_date) || (raw.end_date !== null && !DATE_RE.test(raw.end_date))) {
      errors.push(`${prefix}.end_dateはYYYY-MM-DDまたはnullである必要があります`);
      return;
    }
    if (typeof raw.trip_type !== "string" || !TRIP_TYPES.includes(raw.trip_type as TripType)) {
      errors.push(`${prefix}.trip_typeは${TRIP_TYPES.join("/")}のいずれかである必要があります`);
      return;
    }
    if (!isNullableString(raw.purpose) || (raw.purpose !== null && raw.purpose.length > SHIORI_PURPOSE_MAX_LENGTH)) {
      errors.push(`${prefix}.purposeは${SHIORI_PURPOSE_MAX_LENGTH}文字以内またはnullである必要があります`);
      return;
    }
    if (!isNullableString(raw.cover) || (raw.cover !== null && !COVER_RE.test(raw.cover))) {
      errors.push(`${prefix}.coverの形式が不正です`);
      return;
    }
    if (!isNonEmptyString(raw.created_at) || Number.isNaN(Date.parse(raw.created_at))) {
      errors.push(`${prefix}.created_atは日時文字列である必要があります`);
      return;
    }
    if (!isNonEmptyString(raw.updated_at) || Number.isNaN(Date.parse(raw.updated_at))) {
      errors.push(`${prefix}.updated_atは日時文字列である必要があります`);
      return;
    }
    shioriIds.add(raw.id);
    shiori.push({
      id: raw.id,
      title: title.trim(),
      start_date: raw.start_date,
      end_date: raw.end_date,
      trip_type: raw.trip_type as TripType,
      purpose: raw.purpose === null ? null : raw.purpose.trim() || null,
      cover: raw.cover,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
    });
  });

  const packingIds = new Set<string>();
  const packing_items: PackingItemMigrationInput[] = [];
  packingArr.forEach((raw, index) => {
    const prefix = `packing_items[${index}]`;
    if (!isRecord(raw)) {
      errors.push(`${prefix}はオブジェクトである必要があります`);
      return;
    }
    if (!isNonEmptyString(raw.id) || !UUID_RE.test(raw.id)) {
      errors.push(`${prefix}.idはUUID文字列である必要があります`);
      return;
    }
    if (packingIds.has(raw.id)) {
      errors.push(`${prefix}.idが重複しています: ${raw.id}`);
      return;
    }
    if (!isNonEmptyString(raw.shiori_id) || !shioriIds.has(raw.shiori_id)) {
      errors.push(`${prefix}.shiori_idはshioriに含まれるidを指す必要があります`);
      return;
    }
    if (!isNonEmptyString(raw.label) || raw.label.trim().length > PACKING_LABEL_MAX_LENGTH) {
      errors.push(`${prefix}.labelは1〜${PACKING_LABEL_MAX_LENGTH}文字である必要があります`);
      return;
    }
    if (typeof raw.is_checked !== "boolean") {
      errors.push(`${prefix}.is_checkedはbooleanである必要があります`);
      return;
    }
    if (typeof raw.sort_order !== "number" || !Number.isInteger(raw.sort_order) || raw.sort_order < 0) {
      errors.push(`${prefix}.sort_orderは0以上の整数である必要があります`);
      return;
    }
    packingIds.add(raw.id);
    packing_items.push({
      id: raw.id,
      shiori_id: raw.shiori_id,
      label: raw.label.trim(),
      is_checked: raw.is_checked,
      sort_order: raw.sort_order,
    });
  });

  const todoIds = new Set<string>();
  const todos: TodoMigrationInput[] = [];
  todosArr.forEach((raw, index) => {
    const prefix = `todos[${index}]`;
    if (!isRecord(raw)) {
      errors.push(`${prefix}はオブジェクトである必要があります`);
      return;
    }
    if (!isNonEmptyString(raw.id) || !UUID_RE.test(raw.id)) {
      errors.push(`${prefix}.idはUUID文字列である必要があります`);
      return;
    }
    if (todoIds.has(raw.id)) {
      errors.push(`${prefix}.idが重複しています: ${raw.id}`);
      return;
    }
    if (!isNonEmptyString(raw.shiori_id) || !shioriIds.has(raw.shiori_id)) {
      errors.push(`${prefix}.shiori_idはshioriに含まれるidを指す必要があります`);
      return;
    }
    if (!isNonEmptyString(raw.label) || raw.label.trim().length > TODO_LABEL_MAX_LENGTH) {
      errors.push(`${prefix}.labelは1〜${TODO_LABEL_MAX_LENGTH}文字である必要があります`);
      return;
    }
    if (!isNullableString(raw.due_date) || (raw.due_date !== null && !DATE_RE.test(raw.due_date))) {
      errors.push(`${prefix}.due_dateはYYYY-MM-DDまたはnullである必要があります`);
      return;
    }
    if (typeof raw.is_done !== "boolean") {
      errors.push(`${prefix}.is_doneはbooleanである必要があります`);
      return;
    }
    if (typeof raw.sort_order !== "number" || !Number.isInteger(raw.sort_order) || raw.sort_order < 0) {
      errors.push(`${prefix}.sort_orderは0以上の整数である必要があります`);
      return;
    }
    todoIds.add(raw.id);
    todos.push({
      id: raw.id,
      shiori_id: raw.shiori_id,
      label: raw.label.trim(),
      due_date: raw.due_date,
      is_done: raw.is_done,
      sort_order: raw.sort_order,
    });
  });

  const itineraryIds = new Set<string>();
  const itinerary_entries: ItineraryEntryMigrationInput[] = [];
  itineraryArr.forEach((raw, index) => {
    const prefix = `itinerary_entries[${index}]`;
    if (!isRecord(raw)) {
      errors.push(`${prefix}はオブジェクトである必要があります`);
      return;
    }
    if (!isNonEmptyString(raw.id) || !UUID_RE.test(raw.id)) {
      errors.push(`${prefix}.idはUUID文字列である必要があります`);
      return;
    }
    if (itineraryIds.has(raw.id)) {
      errors.push(`${prefix}.idが重複しています: ${raw.id}`);
      return;
    }
    if (!isNonEmptyString(raw.shiori_id) || !shioriIds.has(raw.shiori_id)) {
      errors.push(`${prefix}.shiori_idはshioriに含まれるidを指す必要があります`);
      return;
    }
    if (!isNonEmptyString(raw.day_date) || !DATE_RE.test(raw.day_date)) {
      errors.push(`${prefix}.day_dateはYYYY-MM-DDである必要があります`);
      return;
    }
    if (!isNullableString(raw.time) || (raw.time !== null && !TIME_RE.test(raw.time))) {
      errors.push(`${prefix}.timeはHH:MM形式またはnullである必要があります`);
      return;
    }
    if (!isNonEmptyString(raw.title) || raw.title.trim().length > ITINERARY_TITLE_MAX_LENGTH) {
      errors.push(`${prefix}.titleは1〜${ITINERARY_TITLE_MAX_LENGTH}文字である必要があります`);
      return;
    }
    if (
      !isNullableString(raw.place_name) ||
      (raw.place_name !== null && raw.place_name.length > ITINERARY_PLACE_NAME_MAX_LENGTH)
    ) {
      errors.push(`${prefix}.place_nameは${ITINERARY_PLACE_NAME_MAX_LENGTH}文字以内またはnullである必要があります`);
      return;
    }
    if (!isNullableString(raw.memo) || (raw.memo !== null && raw.memo.length > ITINERARY_MEMO_MAX_LENGTH)) {
      errors.push(`${prefix}.memoは${ITINERARY_MEMO_MAX_LENGTH}文字以内またはnullである必要があります`);
      return;
    }
    if (typeof raw.sort_order !== "number" || !Number.isInteger(raw.sort_order) || raw.sort_order < 0) {
      errors.push(`${prefix}.sort_orderは0以上の整数である必要があります`);
      return;
    }
    itineraryIds.add(raw.id);
    itinerary_entries.push({
      id: raw.id,
      shiori_id: raw.shiori_id,
      day_date: raw.day_date,
      time: raw.time,
      title: raw.title.trim(),
      place_name: raw.place_name,
      memo: raw.memo,
      sort_order: raw.sort_order,
    });
  });

  const spotIds = new Set<string>();
  const spots: SpotMigrationInput[] = [];
  spotsArr.forEach((raw, index) => {
    const prefix = `spots[${index}]`;
    if (!isRecord(raw)) {
      errors.push(`${prefix}はオブジェクトである必要があります`);
      return;
    }
    if (!isNonEmptyString(raw.id) || !UUID_RE.test(raw.id)) {
      errors.push(`${prefix}.idはUUID文字列である必要があります`);
      return;
    }
    if (spotIds.has(raw.id)) {
      errors.push(`${prefix}.idが重複しています: ${raw.id}`);
      return;
    }
    if (!isNonEmptyString(raw.name) || raw.name.trim().length > SPOT_NAME_MAX_LENGTH) {
      errors.push(`${prefix}.nameは1〜${SPOT_NAME_MAX_LENGTH}文字である必要があります`);
      return;
    }
    if (
      !isNullableString(raw.description) ||
      (raw.description !== null && raw.description.length > SPOT_DESCRIPTION_MAX_LENGTH)
    ) {
      errors.push(`${prefix}.descriptionは${SPOT_DESCRIPTION_MAX_LENGTH}文字以内またはnullである必要があります`);
      return;
    }
    if (
      !isNullableString(raw.category) ||
      (raw.category !== null && raw.category.length > SPOT_CATEGORY_MAX_LENGTH)
    ) {
      errors.push(`${prefix}.categoryは${SPOT_CATEGORY_MAX_LENGTH}文字以内またはnullである必要があります`);
      return;
    }
    if (!isNullableString(raw.area) || (raw.area !== null && raw.area.length > SPOT_AREA_MAX_LENGTH)) {
      errors.push(`${prefix}.areaは${SPOT_AREA_MAX_LENGTH}文字以内またはnullである必要があります`);
      return;
    }
    if (!isNonEmptyString(raw.created_at) || Number.isNaN(Date.parse(raw.created_at))) {
      errors.push(`${prefix}.created_atは日時文字列である必要があります`);
      return;
    }
    spotIds.add(raw.id);
    spots.push({
      id: raw.id,
      name: raw.name.trim(),
      description: raw.description === null ? null : raw.description.trim() || null,
      category: raw.category,
      area: raw.area,
      created_at: raw.created_at,
    });
  });

  const shioriSpotKeys = new Set<string>();
  const shiori_spots: ShioriSpotMigrationInput[] = [];
  const referencedSeedSpotsById = new Map<string, SeedSpot>();
  let skipped_unknown_seed_spot_count = 0;
  shioriSpotsArr.forEach((raw, index) => {
    const prefix = `shiori_spots[${index}]`;
    if (!isRecord(raw)) {
      errors.push(`${prefix}はオブジェクトである必要があります`);
      return;
    }
    if (!isNonEmptyString(raw.shiori_id) || !shioriIds.has(raw.shiori_id)) {
      errors.push(`${prefix}.shiori_idはshioriに含まれるidを指す必要があります`);
      return;
    }
    if (!isNonEmptyString(raw.spot_id)) {
      errors.push(`${prefix}.spot_idは必須です`);
      return;
    }
    const key = `${raw.shiori_id}:${raw.spot_id}`;
    if (shioriSpotKeys.has(key)) {
      errors.push(`${prefix}が重複しています: ${key}`);
      return;
    }
    if (!isNullableString(raw.memo) || (raw.memo !== null && raw.memo.length > SPOT_MEMO_MAX_LENGTH)) {
      errors.push(`${prefix}.memoは${SPOT_MEMO_MAX_LENGTH}文字以内またはnullである必要があります`);
      return;
    }
    if (typeof raw.is_visited !== "boolean") {
      errors.push(`${prefix}.is_visitedはbooleanである必要があります`);
      return;
    }

    if (raw.spot_id.startsWith(SEED_SPOT_ID_PREFIX)) {
      const seedSpot = getSeedSpotById(raw.spot_id);
      if (!seedSpot) {
        // 同梱シードデータに存在しない(旧バージョンで削除された等)。
        // この1件だけ移行対象から除外し、他のデータの移行は継続する。
        skipped_unknown_seed_spot_count += 1;
        return;
      }
      referencedSeedSpotsById.set(seedSpot.id, seedSpot);
    } else {
      if (!UUID_RE.test(raw.spot_id) || !spotIds.has(raw.spot_id)) {
        errors.push(`${prefix}.spot_idはspotsに含まれるidを指す必要があります`);
        return;
      }
    }

    shioriSpotKeys.add(key);
    shiori_spots.push({
      shiori_id: raw.shiori_id,
      spot_id: raw.spot_id,
      memo: raw.memo === null ? null : raw.memo.trim() || null,
      is_visited: raw.is_visited,
    });
  });

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      shiori,
      packing_items,
      todos,
      itinerary_entries,
      spots,
      shiori_spots,
      referenced_seed_spots: Array.from(referencedSeedSpotsById.values()),
      skipped_unknown_seed_spot_count,
    },
  };
}
