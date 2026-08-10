/**
 * ゲスト(未ログイン)保存基盤。IndexedDBラッパー(idb使用)。
 *
 * ルール:
 * - このファイル以外から生のindexedDB APIを直接操作しない。
 * - 保存形状はSupabaseの列名(snake_case)に合わせる(移行時にそのまま送信できるように)。
 *   参照: docs/03_tech_stack.md「ゲスト→ログインのデータ移行」/ supabase/migrations/0001_initial_schema.sql
 *
 * DB接続はモジュールトップレベルで開かず、シングルトンPromiseで遅延初期化する
 * (Next.jsのSSR環境ではindexedDBが存在しないため、import時点でopenDBを呼ぶと壊れる)。
 */
import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  BudgetItem,
  ItineraryEntry,
  PackingItem,
  Photo,
  Shiori,
  ShioriSpot,
  Spot,
  Todo,
} from "@/types/shiori";

const DB_NAME = "otaku-no-shiori-guest";
const DB_VERSION = 4;

/** `migration_state` ストアの単一行のキー(常にこの1件のみ存在する)。 */
const MIGRATION_STATE_KEY = "guest";

/**
 * ゲスト→クラウド移行(F8・Issue #99)の完了フラグ。
 * 参照: docs/03_tech_stack.md「ゲスト→ログインのデータ移行」手順4・6
 * (「テキスト+写真の全件成功後にIndexedDB側へ『移行済み』フラグを付け、以後はクラウドを正とする」)
 *
 * `migrated: true` になった後も、このIssueのスコープでは端末内データ(shiori等)自体は
 * 削除しない(Issue #99の指示どおり。削除は将来の別タスクの判断に委ねる)。
 * フラグは「同じゲストデータをログインのたびに何度も再送しない」ための冪等ガードとして使う。
 */
export interface GuestMigrationState {
  migrated: boolean;
  /** 移行完了時刻(ISO8601)。未移行なら`null`。 */
  migrated_at: string | null;
}

interface GuestStoreSchema extends DBSchema {
  shiori: {
    key: string;
    value: Shiori;
  };
  packing_items: {
    key: string;
    value: PackingItem;
    indexes: { "by-shiori_id": string };
  };
  todos: {
    key: string;
    value: Todo;
    indexes: { "by-shiori_id": string };
  };
  itinerary_entries: {
    key: string;
    value: ItineraryEntry;
    indexes: { "by-shiori_id": string };
  };
  spots: {
    key: string;
    value: Spot;
  };
  shiori_spots: {
    key: [string, string];
    value: ShioriSpot;
    indexes: { "by-shiori_id": string };
  };
  photos: {
    key: string;
    value: Photo;
    indexes: { "by-shiori_id": string };
  };
  budget_items: {
    key: string;
    value: BudgetItem;
    indexes: { "by-shiori_id": string };
  };
  migration_state: {
    key: string;
    value: GuestMigrationState & { key: string };
  };
}

let dbPromise: Promise<IDBPDatabase<GuestStoreSchema>> | null = null;

function getDb(): Promise<IDBPDatabase<GuestStoreSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<GuestStoreSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // version 1: 初期3ストア(F1/F2/F3のスコープ)。
        // 将来ストアを追加する場合はDB_VERSIONを上げて
        // このupgradeコールバックに `if (!db.objectStoreNames.contains(...))` で追記する。
        // 既存ストアのデータは維持される。
        if (!db.objectStoreNames.contains("shiori")) {
          db.createObjectStore("shiori", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("packing_items")) {
          const store = db.createObjectStore("packing_items", { keyPath: "id" });
          store.createIndex("by-shiori_id", "shiori_id");
        }
        if (!db.objectStoreNames.contains("todos")) {
          const store = db.createObjectStore("todos", { keyPath: "id" });
          store.createIndex("by-shiori_id", "shiori_id");
        }
        // version 2: 旅程(F4)・行きたいスポット(F5)・写真とログ(F6)用ストアを追加。
        if (!db.objectStoreNames.contains("itinerary_entries")) {
          const store = db.createObjectStore("itinerary_entries", { keyPath: "id" });
          store.createIndex("by-shiori_id", "shiori_id");
        }
        if (!db.objectStoreNames.contains("spots")) {
          // ユーザー自由入力スポットのみ保存する(シードスポットは同梱JSON参照でこのストアには入れない)。
          db.createObjectStore("spots", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("shiori_spots")) {
          // クラウド側(public.shiori_spots)の複合主キー (shiori_id, spot_id) に合わせ、
          // 単一idを持たず配列keyPathで複合キーにする。
          const store = db.createObjectStore("shiori_spots", {
            keyPath: ["shiori_id", "spot_id"],
          });
          store.createIndex("by-shiori_id", "shiori_id");
        }
        if (!db.objectStoreNames.contains("photos")) {
          const store = db.createObjectStore("photos", { keyPath: "id" });
          store.createIndex("by-shiori_id", "shiori_id");
        }
        // version 3: 予算(budget_items)用ストアを追加。
        if (!db.objectStoreNames.contains("budget_items")) {
          const store = db.createObjectStore("budget_items", { keyPath: "id" });
          store.createIndex("by-shiori_id", "shiori_id");
        }
        // version 4: ゲスト→クラウド移行(F8)の完了フラグ用ストアを追加。
        if (!db.objectStoreNames.contains("migration_state")) {
          db.createObjectStore("migration_state", { keyPath: "key" });
        }
      },
    });
  }
  return dbPromise;
}

// =========================================================
// shiori (F1)
// =========================================================

export type CreateShioriInput = Pick<Shiori, "title" | "trip_type"> &
  Partial<Pick<Shiori, "start_date" | "end_date" | "purpose" | "cover">>;

export type UpdateShioriInput = Partial<
  Pick<
    Shiori,
    "title" | "start_date" | "end_date" | "trip_type" | "purpose" | "cover" | "budget_total" | "budget_memo"
  >
>;

export async function createShiori(input: CreateShioriInput): Promise<Shiori> {
  const db = await getDb();
  const now = new Date().toISOString();
  const shiori: Shiori = {
    id: crypto.randomUUID(),
    title: input.title,
    start_date: input.start_date ?? null,
    end_date: input.end_date ?? null,
    trip_type: input.trip_type,
    purpose: input.purpose ?? null,
    cover: input.cover ?? null,
    budget_total: null,
    budget_memo: null,
    created_at: now,
    updated_at: now,
  };
  await db.add("shiori", shiori);
  return shiori;
}

/**
 * しおり一覧。作成日時の新しい順(降順)で返す。
 * (画面仕様に一覧の並び順の明記が無いため、新しい順をデフォルトとして仮置き)
 */
export async function listShiori(): Promise<Shiori[]> {
  const db = await getDb();
  const all = await db.getAll("shiori");
  return all.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getShiori(id: string): Promise<Shiori | undefined> {
  const db = await getDb();
  return db.get("shiori", id);
}

export async function updateShiori(id: string, patch: UpdateShioriInput): Promise<Shiori> {
  const db = await getDb();
  const tx = db.transaction("shiori", "readwrite");
  const current = await tx.store.get(id);
  if (!current) {
    throw new Error(`shiori not found: ${id}`);
  }
  const updated: Shiori = {
    ...current,
    ...patch,
    id: current.id,
    created_at: current.created_at,
    updated_at: new Date().toISOString(),
  };
  await tx.store.put(updated);
  await tx.done;
  return updated;
}

/**
 * しおりを削除する。子データ(持ち物・TODO・旅程・行きたいスポット紐付け・写真)も
 * 同一トランザクションでカスケード削除する(写真Blobのストレージリーク防止)。
 *
 * `shiori_spots` に紐づく自由入力スポット本体(`spots`、source='ugc')も、
 * このしおり以外から参照されない前提であわせて削除する。
 * シードスポットは`spots`ストアに存在しない(同梱JSON参照のみ)ため、
 * 該当spot_idが無い場合の削除はno-opになる。
 */
export async function deleteShiori(id: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(
    [
      "shiori",
      "packing_items",
      "todos",
      "itinerary_entries",
      "spots",
      "shiori_spots",
      "photos",
      "budget_items",
    ],
    "readwrite",
  );

  await tx.objectStore("shiori").delete(id);

  const packingIndex = tx.objectStore("packing_items").index("by-shiori_id");
  for await (const cursor of packingIndex.iterate(id)) {
    await cursor.delete();
  }

  const todoIndex = tx.objectStore("todos").index("by-shiori_id");
  for await (const cursor of todoIndex.iterate(id)) {
    await cursor.delete();
  }

  const itineraryIndex = tx.objectStore("itinerary_entries").index("by-shiori_id");
  for await (const cursor of itineraryIndex.iterate(id)) {
    await cursor.delete();
  }

  const spotsStore = tx.objectStore("spots");
  const shioriSpotIndex = tx.objectStore("shiori_spots").index("by-shiori_id");
  for await (const cursor of shioriSpotIndex.iterate(id)) {
    await spotsStore.delete(cursor.value.spot_id);
    await cursor.delete();
  }

  const photoIndex = tx.objectStore("photos").index("by-shiori_id");
  for await (const cursor of photoIndex.iterate(id)) {
    await cursor.delete();
  }

  const budgetItemIndex = tx.objectStore("budget_items").index("by-shiori_id");
  for await (const cursor of budgetItemIndex.iterate(id)) {
    await cursor.delete();
  }

  await tx.done;
}

// =========================================================
// packing_items (F2)
// =========================================================

export type CreatePackingItemInput = Pick<PackingItem, "shiori_id" | "label"> &
  Partial<Pick<PackingItem, "is_checked" | "sort_order">>;

export type UpdatePackingItemInput = Partial<Pick<PackingItem, "label" | "is_checked" | "sort_order">>;

export async function createPackingItem(input: CreatePackingItemInput): Promise<PackingItem> {
  const db = await getDb();
  const sortOrder = input.sort_order ?? (await listPackingItemsByShiori(input.shiori_id)).length;
  const item: PackingItem = {
    id: crypto.randomUUID(),
    shiori_id: input.shiori_id,
    label: input.label,
    is_checked: input.is_checked ?? false,
    sort_order: sortOrder,
  };
  await db.add("packing_items", item);
  return item;
}

/** 指定しおりの持ち物一覧を sort_order 昇順で返す。 */
export async function listPackingItemsByShiori(shioriId: string): Promise<PackingItem[]> {
  const db = await getDb();
  const items = await db.getAllFromIndex("packing_items", "by-shiori_id", shioriId);
  return items.sort((a, b) => a.sort_order - b.sort_order);
}

export async function updatePackingItem(id: string, patch: UpdatePackingItemInput): Promise<PackingItem> {
  const db = await getDb();
  const tx = db.transaction("packing_items", "readwrite");
  const current = await tx.store.get(id);
  if (!current) {
    throw new Error(`packing_item not found: ${id}`);
  }
  const updated: PackingItem = { ...current, ...patch };
  await tx.store.put(updated);
  await tx.done;
  return updated;
}

export async function deletePackingItem(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("packing_items", id);
}

/** orderedIdsの並び順どおりに sort_order を 0始まり連番で一括更新する。 */
export async function reorderPackingItems(shioriId: string, orderedIds: string[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction("packing_items", "readwrite");
  for (let i = 0; i < orderedIds.length; i += 1) {
    const id = orderedIds[i];
    const current = await tx.store.get(id);
    if (!current || current.shiori_id !== shioriId) {
      throw new Error(`packing_item not found in shiori ${shioriId}: ${id}`);
    }
    await tx.store.put({ ...current, sort_order: i });
  }
  await tx.done;
}

// =========================================================
// todos (F3)
// =========================================================

export type CreateTodoInput = Pick<Todo, "shiori_id" | "label"> &
  Partial<Pick<Todo, "due_date" | "is_done" | "sort_order">>;

export type UpdateTodoInput = Partial<Pick<Todo, "label" | "due_date" | "is_done" | "sort_order">>;

export async function createTodo(input: CreateTodoInput): Promise<Todo> {
  const db = await getDb();
  const sortOrder = input.sort_order ?? (await listTodosByShiori(input.shiori_id)).length;
  const todo: Todo = {
    id: crypto.randomUUID(),
    shiori_id: input.shiori_id,
    label: input.label,
    due_date: input.due_date ?? null,
    is_done: input.is_done ?? false,
    sort_order: sortOrder,
  };
  await db.add("todos", todo);
  return todo;
}

/** 指定しおりのTODO一覧を sort_order 昇順で返す。 */
export async function listTodosByShiori(shioriId: string): Promise<Todo[]> {
  const db = await getDb();
  const items = await db.getAllFromIndex("todos", "by-shiori_id", shioriId);
  return items.sort((a, b) => a.sort_order - b.sort_order);
}

export async function updateTodo(id: string, patch: UpdateTodoInput): Promise<Todo> {
  const db = await getDb();
  const tx = db.transaction("todos", "readwrite");
  const current = await tx.store.get(id);
  if (!current) {
    throw new Error(`todo not found: ${id}`);
  }
  const updated: Todo = { ...current, ...patch };
  await tx.store.put(updated);
  await tx.done;
  return updated;
}

export async function deleteTodo(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("todos", id);
}

/** orderedIdsの並び順どおりに sort_order を 0始まり連番で一括更新する。 */
export async function reorderTodos(shioriId: string, orderedIds: string[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction("todos", "readwrite");
  for (let i = 0; i < orderedIds.length; i += 1) {
    const id = orderedIds[i];
    const current = await tx.store.get(id);
    if (!current || current.shiori_id !== shioriId) {
      throw new Error(`todo not found in shiori ${shioriId}: ${id}`);
    }
    await tx.store.put({ ...current, sort_order: i });
  }
  await tx.done;
}

// =========================================================
// itinerary_entries (F4)
// =========================================================

export type CreateItineraryEntryInput = Pick<ItineraryEntry, "shiori_id" | "day_date" | "title"> &
  Partial<Pick<ItineraryEntry, "time" | "place_name" | "memo" | "sort_order">>;

export type UpdateItineraryEntryInput = Partial<
  Pick<ItineraryEntry, "day_date" | "time" | "title" | "place_name" | "memo" | "sort_order">
>;

export async function createItineraryEntry(input: CreateItineraryEntryInput): Promise<ItineraryEntry> {
  const db = await getDb();
  // sort_orderは同じday_date内での連番にする(一覧はday_date→sort_orderの順で表示するため)。
  const sortOrder =
    input.sort_order ??
    (await listItineraryEntriesByShiori(input.shiori_id)).filter((e) => e.day_date === input.day_date)
      .length;
  const entry: ItineraryEntry = {
    id: crypto.randomUUID(),
    shiori_id: input.shiori_id,
    day_date: input.day_date,
    time: input.time ?? null,
    title: input.title,
    place_name: input.place_name ?? null,
    memo: input.memo ?? null,
    sort_order: sortOrder,
  };
  await db.add("itinerary_entries", entry);
  return entry;
}

/** 指定しおりの旅程一覧。day_date昇順、同日内はsort_order昇順で返す。 */
export async function listItineraryEntriesByShiori(shioriId: string): Promise<ItineraryEntry[]> {
  const db = await getDb();
  const items = await db.getAllFromIndex("itinerary_entries", "by-shiori_id", shioriId);
  return items.sort((a, b) => {
    if (a.day_date !== b.day_date) {
      return a.day_date.localeCompare(b.day_date);
    }
    return a.sort_order - b.sort_order;
  });
}

export async function updateItineraryEntry(
  id: string,
  patch: UpdateItineraryEntryInput,
): Promise<ItineraryEntry> {
  const db = await getDb();
  const tx = db.transaction("itinerary_entries", "readwrite");
  const current = await tx.store.get(id);
  if (!current) {
    throw new Error(`itinerary_entry not found: ${id}`);
  }
  const updated: ItineraryEntry = { ...current, ...patch };
  await tx.store.put(updated);
  await tx.done;
  return updated;
}

export async function deleteItineraryEntry(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("itinerary_entries", id);
}

/**
 * orderedIdsの並び順どおりに sort_order を 0始まり連番で一括更新する。
 * 日ごとの並べ替えを想定し、呼び出し側は同一day_date内のidのみを渡す。
 */
export async function reorderItineraryEntries(shioriId: string, orderedIds: string[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction("itinerary_entries", "readwrite");
  for (let i = 0; i < orderedIds.length; i += 1) {
    const id = orderedIds[i];
    const current = await tx.store.get(id);
    if (!current || current.shiori_id !== shioriId) {
      throw new Error(`itinerary_entry not found in shiori ${shioriId}: ${id}`);
    }
    await tx.store.put({ ...current, sort_order: i });
  }
  await tx.done;
}

// =========================================================
// spots (F5: ユーザー自由入力スポット本体)
// =========================================================

export type CreateSpotInput = Pick<Spot, "name"> &
  Partial<Pick<Spot, "description" | "category" | "area">>;

export type UpdateSpotInput = Partial<Pick<Spot, "name" | "description" | "category" | "area">>;

/** 自由入力スポットを作成する。クラウド側スキーマに合わせ source='ugc' / status='private' 固定。 */
export async function createSpot(input: CreateSpotInput): Promise<Spot> {
  const db = await getDb();
  const spot: Spot = {
    id: crypto.randomUUID(),
    name: input.name,
    description: input.description ?? null,
    category: input.category ?? null,
    area: input.area ?? null,
    source: "ugc",
    status: "private",
    created_at: new Date().toISOString(),
  };
  await db.add("spots", spot);
  return spot;
}

export async function getSpot(id: string): Promise<Spot | undefined> {
  const db = await getDb();
  return db.get("spots", id);
}

/** 自由入力スポット一覧。作成日時の新しい順(画面仕様に一覧の並び順の明記が無いため仮置き)。 */
export async function listSpots(): Promise<Spot[]> {
  const db = await getDb();
  const all = await db.getAll("spots");
  return all.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function updateSpot(id: string, patch: UpdateSpotInput): Promise<Spot> {
  const db = await getDb();
  const tx = db.transaction("spots", "readwrite");
  const current = await tx.store.get(id);
  if (!current) {
    throw new Error(`spot not found: ${id}`);
  }
  const updated: Spot = { ...current, ...patch };
  await tx.store.put(updated);
  await tx.done;
  return updated;
}

export async function deleteSpot(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("spots", id);
}

// =========================================================
// shiori_spots (F5: しおり内の行きたいスポット紐付け)
// =========================================================

export type CreateShioriSpotInput = Pick<ShioriSpot, "shiori_id" | "spot_id"> &
  Partial<Pick<ShioriSpot, "memo" | "is_visited">>;

export type UpdateShioriSpotInput = Partial<Pick<ShioriSpot, "memo" | "is_visited">>;

/** しおりにスポット(UGC or シード)を紐付ける。 */
export async function createShioriSpot(input: CreateShioriSpotInput): Promise<ShioriSpot> {
  const db = await getDb();
  const shioriSpot: ShioriSpot = {
    shiori_id: input.shiori_id,
    spot_id: input.spot_id,
    memo: input.memo ?? null,
    is_visited: input.is_visited ?? false,
  };
  await db.add("shiori_spots", shioriSpot);
  return shioriSpot;
}

/** 指定しおりに紐づくスポット紐付け一覧を返す。 */
export async function listShioriSpotsByShiori(shioriId: string): Promise<ShioriSpot[]> {
  const db = await getDb();
  return db.getAllFromIndex("shiori_spots", "by-shiori_id", shioriId);
}

export async function updateShioriSpot(
  shioriId: string,
  spotId: string,
  patch: UpdateShioriSpotInput,
): Promise<ShioriSpot> {
  const db = await getDb();
  const tx = db.transaction("shiori_spots", "readwrite");
  const current = await tx.store.get([shioriId, spotId]);
  if (!current) {
    throw new Error(`shiori_spot not found: ${shioriId}/${spotId}`);
  }
  const updated: ShioriSpot = { ...current, ...patch };
  await tx.store.put(updated);
  await tx.done;
  return updated;
}

export async function deleteShioriSpot(shioriId: string, spotId: string): Promise<void> {
  const db = await getDb();
  await db.delete("shiori_spots", [shioriId, spotId]);
}

// =========================================================
// photos (F6)
// =========================================================

export type CreatePhotoInput = Pick<Photo, "shiori_id" | "blob"> &
  Partial<Pick<Photo, "day_date" | "caption">>;

export type UpdatePhotoInput = Partial<Pick<Photo, "day_date" | "caption">>;

/**
 * 写真を保存する。呼び出し側で長辺1600pxへのリサイズを済ませた `blob` を渡すこと
 * (クライアント側リサイズ自体はこのファイルの責務外。docs/03_tech_stack.mdの無料枠ガードレール参照)。
 */
export async function createPhoto(input: CreatePhotoInput): Promise<Photo> {
  const db = await getDb();
  const photo: Photo = {
    id: crypto.randomUUID(),
    shiori_id: input.shiori_id,
    day_date: input.day_date ?? null,
    caption: input.caption ?? null,
    blob: input.blob,
    created_at: new Date().toISOString(),
  };
  await db.add("photos", photo);
  return photo;
}

/** 指定しおりの写真一覧。作成日時の新しい順(画面仕様に一覧の並び順の明記が無いため仮置き)。 */
export async function listPhotosByShiori(shioriId: string): Promise<Photo[]> {
  const db = await getDb();
  const all = await db.getAllFromIndex("photos", "by-shiori_id", shioriId);
  return all.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** 指定しおりの写真枚数。上限判定(1しおり20枚、環境変数管理)に使う。 */
export async function countPhotosByShiori(shioriId: string): Promise<number> {
  const db = await getDb();
  return db.countFromIndex("photos", "by-shiori_id", shioriId);
}

export async function updatePhoto(id: string, patch: UpdatePhotoInput): Promise<Photo> {
  const db = await getDb();
  const tx = db.transaction("photos", "readwrite");
  const current = await tx.store.get(id);
  if (!current) {
    throw new Error(`photo not found: ${id}`);
  }
  const updated: Photo = { ...current, ...patch };
  await tx.store.put(updated);
  await tx.done;
  return updated;
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("photos", id);
}

// =========================================================
// budget_items (予算。F番号未採番・オーナー草案)
// =========================================================

export type CreateBudgetItemInput = Pick<BudgetItem, "shiori_id" | "label" | "amount"> &
  Partial<Pick<BudgetItem, "sort_order">>;

export type UpdateBudgetItemInput = Partial<Pick<BudgetItem, "label" | "amount" | "sort_order">>;

export async function createBudgetItem(input: CreateBudgetItemInput): Promise<BudgetItem> {
  const db = await getDb();
  const sortOrder = input.sort_order ?? (await listBudgetItemsByShiori(input.shiori_id)).length;
  const item: BudgetItem = {
    id: crypto.randomUUID(),
    shiori_id: input.shiori_id,
    label: input.label,
    amount: input.amount,
    sort_order: sortOrder,
  };
  await db.add("budget_items", item);
  return item;
}

/** 指定しおりの費目一覧を sort_order 昇順で返す。 */
export async function listBudgetItemsByShiori(shioriId: string): Promise<BudgetItem[]> {
  const db = await getDb();
  const items = await db.getAllFromIndex("budget_items", "by-shiori_id", shioriId);
  return items.sort((a, b) => a.sort_order - b.sort_order);
}

export async function updateBudgetItem(id: string, patch: UpdateBudgetItemInput): Promise<BudgetItem> {
  const db = await getDb();
  const tx = db.transaction("budget_items", "readwrite");
  const current = await tx.store.get(id);
  if (!current) {
    throw new Error(`budget_item not found: ${id}`);
  }
  const updated: BudgetItem = { ...current, ...patch };
  await tx.store.put(updated);
  await tx.done;
  return updated;
}

export async function deleteBudgetItem(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("budget_items", id);
}

/** orderedIdsの並び順どおりに sort_order を 0始まり連番で一括更新する。 */
export async function reorderBudgetItems(shioriId: string, orderedIds: string[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction("budget_items", "readwrite");
  for (let i = 0; i < orderedIds.length; i += 1) {
    const id = orderedIds[i];
    const current = await tx.store.get(id);
    if (!current || current.shiori_id !== shioriId) {
      throw new Error(`budget_item not found in shiori ${shioriId}: ${id}`);
    }
    await tx.store.put({ ...current, sort_order: i });
  }
  await tx.done;
}

// =========================================================
// ゲスト→クラウド移行(F8・Issue #99「移行フロー結線」)
// =========================================================

/**
 * 移行状態を取得する。まだ一度も移行していない(行が無い)場合は
 * `{ migrated: false, migrated_at: null }` を返す。
 */
export async function getGuestMigrationState(): Promise<GuestMigrationState> {
  const db = await getDb();
  const row = await db.get("migration_state", MIGRATION_STATE_KEY);
  if (!row) {
    return { migrated: false, migrated_at: null };
  }
  return { migrated: row.migrated, migrated_at: row.migrated_at };
}

/**
 * 移行完了フラグを立てる。呼び出し側(`src/lib/guest-migration-orchestrator.ts`)は
 * テキスト・写真の全件成功後にのみこれを呼ぶこと。
 *
 * 端末内データ(shiori等)自体はこの関数では削除しない
 * (Issue #99のスコープ。削除するかどうかは別タスクの判断に委ねる)。
 */
export async function markGuestDataMigrated(): Promise<void> {
  const db = await getDb();
  const state: GuestMigrationState & { key: string } = {
    key: MIGRATION_STATE_KEY,
    migrated: true,
    migrated_at: new Date().toISOString(),
  };
  await db.put("migration_state", state);
}

/** 移行対象のテキストデータ一式(全しおり分をまとめて返す)。 */
export interface GuestMigrationTextData {
  shiori: Shiori[];
  packing_items: PackingItem[];
  todos: Todo[];
  itinerary_entries: ItineraryEntry[];
  /** UGC(自由入力)スポットのみ(このストアにはシードスポットを保存していないため)。 */
  spots: Spot[];
  shiori_spots: ShioriSpot[];
}

/**
 * 全しおり分のテキストデータ(しおり本体・持ち物・TODO・旅程・自由入力スポット・
 * 行きたいスポット紐付け)を一括で取得する。`POST /api/migration/guest`(#97)へ
 * そのまま送るペイロードの元データとして使う(整形は`guest-migration-orchestrator.ts`の責務)。
 */
export async function collectAllGuestTextData(): Promise<GuestMigrationTextData> {
  const db = await getDb();
  const [shiori, packing_items, todos, itinerary_entries, spots, shiori_spots] = await Promise.all([
    db.getAll("shiori"),
    db.getAll("packing_items"),
    db.getAll("todos"),
    db.getAll("itinerary_entries"),
    db.getAll("spots"),
    db.getAll("shiori_spots"),
  ]);
  return { shiori, packing_items, todos, itinerary_entries, spots, shiori_spots };
}

/** 全しおり分の写真一覧を返す(`POST /api/migration/photos`(#98)へ1枚ずつ送る対象)。 */
export async function listAllGuestPhotos(): Promise<Photo[]> {
  const db = await getDb();
  return db.getAll("photos");
}
