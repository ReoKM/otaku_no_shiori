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
import type { PackingItem, Shiori, Todo } from "@/types/shiori";

const DB_NAME = "otaku-no-shiori-guest";
const DB_VERSION = 1;

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
}

let dbPromise: Promise<IDBPDatabase<GuestStoreSchema>> | null = null;

function getDb(): Promise<IDBPDatabase<GuestStoreSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<GuestStoreSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // version 1: 初期3ストアのみ(F1/F2/F3のスコープ)。
        // 将来ストアを追加する場合(旅程/スポット/写真など)はDB_VERSIONを上げて
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
  Pick<Shiori, "title" | "start_date" | "end_date" | "trip_type" | "purpose" | "cover">
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

/** しおりを削除する。子データ(持ち物・TODO)も同一トランザクションでカスケード削除する。 */
export async function deleteShiori(id: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(["shiori", "packing_items", "todos"], "readwrite");

  await tx.objectStore("shiori").delete(id);

  const packingIndex = tx.objectStore("packing_items").index("by-shiori_id");
  for await (const cursor of packingIndex.iterate(id)) {
    await cursor.delete();
  }

  const todoIndex = tx.objectStore("todos").index("by-shiori_id");
  for await (const cursor of todoIndex.iterate(id)) {
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
