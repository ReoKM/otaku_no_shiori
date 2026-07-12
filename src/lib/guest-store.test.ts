import { describe, expect, it } from "vitest";
import {
  createPackingItem,
  createShiori,
  createTodo,
  deletePackingItem,
  deleteShiori,
  deleteTodo,
  getShiori,
  listPackingItemsByShiori,
  listShiori,
  listTodosByShiori,
  reorderPackingItems,
  reorderTodos,
  updatePackingItem,
  updateShiori,
  updateTodo,
} from "./guest-store";

/** created_at の順序をテストで確実に分けるための小さな待機。 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("guest-store: shiori", () => {
  it("createShiori はデフォルト値付きで保存し、getShiori で取得できる", async () => {
    const created = await createShiori({ title: "夏フェス遠征", trip_type: "live" });

    expect(created.id).toBeTruthy();
    expect(created.title).toBe("夏フェス遠征");
    expect(created.trip_type).toBe("live");
    expect(created.start_date).toBeNull();
    expect(created.end_date).toBeNull();
    expect(created.purpose).toBeNull();
    expect(created.cover).toBeNull();
    expect(created.created_at).toBe(created.updated_at);

    const fetched = await getShiori(created.id);
    expect(fetched).toEqual(created);
  });

  it("listShiori は作成日時の新しい順で返す", async () => {
    const first = await createShiori({ title: "先に作成", trip_type: "seichi" });
    await sleep(5);
    const second = await createShiori({ title: "後に作成", trip_type: "stage" });

    const all = await listShiori();
    const ids = all.map((s) => s.id);
    const firstIndex = ids.indexOf(first.id);
    const secondIndex = ids.indexOf(second.id);

    expect(firstIndex).toBeGreaterThan(-1);
    expect(secondIndex).toBeGreaterThan(-1);
    // 新しい順なので後に作成したものが先に来る
    expect(secondIndex).toBeLessThan(firstIndex);
  });

  it("updateShiori は指定フィールドのみ更新し updated_at を進める", async () => {
    const created = await createShiori({ title: "更新前タイトル", trip_type: "other" });
    await sleep(5);
    const updated = await updateShiori(created.id, { title: "更新後タイトル" });

    expect(updated.title).toBe("更新後タイトル");
    expect(updated.trip_type).toBe("other");
    expect(updated.created_at).toBe(created.created_at);
    expect(updated.updated_at).not.toBe(created.updated_at);
  });

  it("存在しないIDのupdateShioriはエラーになる", async () => {
    await expect(updateShiori("no-such-id", { title: "x" })).rejects.toThrow();
  });

  it("deleteShiori は本体と紐づく持ち物・TODOをカスケード削除する", async () => {
    const shiori = await createShiori({ title: "削除対象", trip_type: "live" });
    await createPackingItem({ shiori_id: shiori.id, label: "うちわ" });
    await createPackingItem({ shiori_id: shiori.id, label: "ペンライト" });
    await createTodo({ shiori_id: shiori.id, label: "チケット確認" });

    await deleteShiori(shiori.id);

    expect(await getShiori(shiori.id)).toBeUndefined();
    expect(await listPackingItemsByShiori(shiori.id)).toEqual([]);
    expect(await listTodosByShiori(shiori.id)).toEqual([]);
  });
});

describe("guest-store: packing_items", () => {
  it("CRUD一通りと並び順(sort_order昇順)を確認する", async () => {
    const shiori = await createShiori({ title: "持ち物テスト用", trip_type: "live" });

    const item1 = await createPackingItem({ shiori_id: shiori.id, label: "うちわ" });
    const item2 = await createPackingItem({ shiori_id: shiori.id, label: "ペンライト" });
    const item3 = await createPackingItem({ shiori_id: shiori.id, label: "タオル" });

    expect(item1.sort_order).toBe(0);
    expect(item2.sort_order).toBe(1);
    expect(item3.sort_order).toBe(2);
    expect(item1.is_checked).toBe(false);

    const listed = await listPackingItemsByShiori(shiori.id);
    expect(listed.map((i) => i.label)).toEqual(["うちわ", "ペンライト", "タオル"]);

    const checked = await updatePackingItem(item1.id, { is_checked: true });
    expect(checked.is_checked).toBe(true);
    expect(checked.label).toBe("うちわ");

    await deletePackingItem(item2.id);
    const afterDelete = await listPackingItemsByShiori(shiori.id);
    expect(afterDelete.map((i) => i.label)).toEqual(["うちわ", "タオル"]);
  });

  it("reorderPackingItems は指定順にsort_orderを0始まりで振り直す", async () => {
    const shiori = await createShiori({ title: "並べ替えテスト", trip_type: "seichi" });
    const a = await createPackingItem({ shiori_id: shiori.id, label: "A" });
    const b = await createPackingItem({ shiori_id: shiori.id, label: "B" });
    const c = await createPackingItem({ shiori_id: shiori.id, label: "C" });

    await reorderPackingItems(shiori.id, [c.id, a.id, b.id]);

    const reordered = await listPackingItemsByShiori(shiori.id);
    expect(reordered.map((i) => i.label)).toEqual(["C", "A", "B"]);
    expect(reordered.map((i) => i.sort_order)).toEqual([0, 1, 2]);
  });

  it("他のしおりに属するIDを含むreorderPackingItemsはエラーになる", async () => {
    const shioriA = await createShiori({ title: "A", trip_type: "live" });
    const shioriB = await createShiori({ title: "B", trip_type: "live" });
    const itemA = await createPackingItem({ shiori_id: shioriA.id, label: "A項目" });
    const itemB = await createPackingItem({ shiori_id: shioriB.id, label: "B項目" });

    await expect(reorderPackingItems(shioriA.id, [itemA.id, itemB.id])).rejects.toThrow();
  });
});

describe("guest-store: todos", () => {
  it("CRUD一通りと並び順(sort_order昇順)を確認する", async () => {
    const shiori = await createShiori({ title: "TODOテスト用", trip_type: "stage" });

    const todo1 = await createTodo({ shiori_id: shiori.id, label: "チケット確認" });
    const todo2 = await createTodo({ shiori_id: shiori.id, label: "宿泊予約", due_date: "2026-08-01" });

    expect(todo1.sort_order).toBe(0);
    expect(todo2.sort_order).toBe(1);
    expect(todo1.is_done).toBe(false);
    expect(todo2.due_date).toBe("2026-08-01");

    const listed = await listTodosByShiori(shiori.id);
    expect(listed.map((t) => t.label)).toEqual(["チケット確認", "宿泊予約"]);

    const done = await updateTodo(todo1.id, { is_done: true });
    expect(done.is_done).toBe(true);

    await deleteTodo(todo2.id);
    const afterDelete = await listTodosByShiori(shiori.id);
    expect(afterDelete.map((t) => t.label)).toEqual(["チケット確認"]);
  });

  it("reorderTodos は指定順にsort_orderを0始まりで振り直す", async () => {
    const shiori = await createShiori({ title: "TODO並べ替え", trip_type: "other" });
    const a = await createTodo({ shiori_id: shiori.id, label: "A" });
    const b = await createTodo({ shiori_id: shiori.id, label: "B" });
    const c = await createTodo({ shiori_id: shiori.id, label: "C" });

    await reorderTodos(shiori.id, [c.id, a.id, b.id]);

    const reordered = await listTodosByShiori(shiori.id);
    expect(reordered.map((t) => t.label)).toEqual(["C", "A", "B"]);
    expect(reordered.map((t) => t.sort_order)).toEqual([0, 1, 2]);
  });
});
