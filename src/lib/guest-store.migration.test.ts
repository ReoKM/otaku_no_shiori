import { describe, expect, it } from "vitest";

/**
 * DB_VERSION 1→3のアップグレードで既存データ(shiori/packing_items/todos)が
 * 壊れないことを確認する回帰テスト。
 *
 * guest-store.ts を経由せず生のindexedDB APIでversion 1相当のDBを直接構築してから
 * guest-store.ts をimportし、getDb() が version 3へアップグレードする流れを再現する。
 * (このファイル専用にモジュールを新規importするため、他テストファイルの
 *  dbPromiseシングルトンとは独立して検証できる。vitestはデフォルトでテストファイルごとに
 *  モジュール・グローバルを分離するため、fake-indexeddb/autoが注入するindexedDBも
 *  このファイル内でのみ有効になる)
 */
const DB_NAME = "otaku-no-shiori-guest";

function seedVersion1Database(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore("shiori", { keyPath: "id" });
      const packing = db.createObjectStore("packing_items", { keyPath: "id" });
      packing.createIndex("by-shiori_id", "shiori_id");
      const todos = db.createObjectStore("todos", { keyPath: "id" });
      todos.createIndex("by-shiori_id", "shiori_id");
    };

    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(["shiori", "packing_items", "todos"], "readwrite");

      tx.objectStore("shiori").add({
        id: "legacy-shiori-1",
        title: "移行前しおり",
        start_date: null,
        end_date: null,
        trip_type: "live",
        purpose: null,
        cover: null,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      });
      tx.objectStore("packing_items").add({
        id: "legacy-packing-1",
        shiori_id: "legacy-shiori-1",
        label: "うちわ",
        is_checked: false,
        sort_order: 0,
      });
      tx.objectStore("todos").add({
        id: "legacy-todo-1",
        shiori_id: "legacy-shiori-1",
        label: "チケット確認",
        due_date: null,
        is_done: false,
        sort_order: 0,
      });

      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    };

    request.onerror = () => reject(request.error);
  });
}

describe("guest-store: DB_VERSION 1→3 マイグレーション", () => {
  // 1つのitブロックにまとめる理由: guest-store.tsのDB接続はモジュール内シングルトンで
  // 一度version 3にアップグレードすると接続が開いたままになる。同一テストファイル内で
  // 複数のitに分けてそれぞれ`seedVersion1Database`(version 1で再オープン)を呼ぶと、
  // 既にversion 3へ上がった接続が残っている状態にversion 1で開こうとしてVersionErrorになる。
  it("version 1のDBをversion 3にアップグレードしても既存データが残り、新規ストアも使える", async () => {
    await seedVersion1Database();

    const {
      createBudgetItem,
      createItineraryEntry,
      createPhoto,
      createShioriSpot,
      createSpot,
      getShiori,
      listBudgetItemsByShiori,
      listItineraryEntriesByShiori,
      listPackingItemsByShiori,
      listPhotosByShiori,
      listShioriSpotsByShiori,
      listTodosByShiori,
    } = await import("./guest-store");

    // 既存3ストア(shiori/packing_items/todos)のデータが壊れていないこと
    const shiori = await getShiori("legacy-shiori-1");
    expect(shiori?.title).toBe("移行前しおり");
    expect(shiori?.trip_type).toBe("live");

    const packingItems = await listPackingItemsByShiori("legacy-shiori-1");
    expect(packingItems.map((p) => p.label)).toEqual(["うちわ"]);

    const todos = await listTodosByShiori("legacy-shiori-1");
    expect(todos.map((t) => t.label)).toEqual(["チケット確認"]);

    // 新規4ストア(itinerary_entries/spots/shiori_spots/photos)が既存しおりに対して使えること
    const entry = await createItineraryEntry({
      shiori_id: "legacy-shiori-1",
      day_date: "2026-08-01",
      title: "集合",
    });
    expect((await listItineraryEntriesByShiori("legacy-shiori-1")).map((e) => e.id)).toEqual([entry.id]);

    const spot = await createSpot({ name: "新規スポット" });
    const shioriSpot = await createShioriSpot({ shiori_id: "legacy-shiori-1", spot_id: spot.id });
    expect((await listShioriSpotsByShiori("legacy-shiori-1"))[0]).toEqual(shioriSpot);

    const photo = await createPhoto({
      shiori_id: "legacy-shiori-1",
      blob: new Blob(["dummy"], { type: "image/webp" }),
    });
    expect((await listPhotosByShiori("legacy-shiori-1")).map((p) => p.id)).toEqual([photo.id]);

    const budgetItem = await createBudgetItem({
      shiori_id: "legacy-shiori-1",
      label: "交通費",
      amount: 12800,
    });
    expect((await listBudgetItemsByShiori("legacy-shiori-1")).map((b) => b.id)).toEqual([budgetItem.id]);
  });
});
