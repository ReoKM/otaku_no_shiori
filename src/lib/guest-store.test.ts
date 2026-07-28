import { describe, expect, it } from "vitest";
import {
  countPhotosByShiori,
  createBudgetItem,
  createItineraryEntry,
  createPackingItem,
  createPhoto,
  createShiori,
  createShioriSpot,
  createSpot,
  createTodo,
  deleteBudgetItem,
  deleteItineraryEntry,
  deletePackingItem,
  deletePhoto,
  deleteShiori,
  deleteShioriSpot,
  deleteSpot,
  deleteTodo,
  getShiori,
  getSpot,
  listBudgetItemsByShiori,
  listItineraryEntriesByShiori,
  listPackingItemsByShiori,
  listPhotosByShiori,
  listShiori,
  listShioriSpotsByShiori,
  listSpots,
  listTodosByShiori,
  reorderBudgetItems,
  reorderItineraryEntries,
  reorderPackingItems,
  reorderTodos,
  updateBudgetItem,
  updateItineraryEntry,
  updatePackingItem,
  updatePhoto,
  updateShiori,
  updateShioriSpot,
  updateSpot,
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

  it("updateShioriでbudget_total・budget_memoを更新できる", async () => {
    const created = await createShiori({ title: "予算テスト用", trip_type: "live" });
    expect(created.budget_total).toBeNull();
    expect(created.budget_memo).toBeNull();

    const updated = await updateShiori(created.id, { budget_total: 50000, budget_memo: "早割で確保済み" });
    expect(updated.budget_total).toBe(50000);
    expect(updated.budget_memo).toBe("早割で確保済み");

    const cleared = await updateShiori(created.id, { budget_total: null });
    expect(cleared.budget_total).toBeNull();
    // 総額クリアはメモを残す(仕様どおり、他フィールドを巻き込まない)
    expect(cleared.budget_memo).toBe("早割で確保済み");
  });

  it("deleteShiori は本体と紐づく持ち物・TODO・旅程・スポット紐付け・写真・予算費目をカスケード削除する", async () => {
    const shiori = await createShiori({ title: "削除対象", trip_type: "live" });
    await createPackingItem({ shiori_id: shiori.id, label: "うちわ" });
    await createPackingItem({ shiori_id: shiori.id, label: "ペンライト" });
    await createTodo({ shiori_id: shiori.id, label: "チケット確認" });
    await createItineraryEntry({ shiori_id: shiori.id, day_date: "2026-08-01", title: "集合" });
    const spot = await createSpot({ name: "削除対象スポット" });
    await createShioriSpot({ shiori_id: shiori.id, spot_id: spot.id });
    await createPhoto({ shiori_id: shiori.id, blob: new Blob(["dummy"], { type: "image/webp" }) });
    await createBudgetItem({ shiori_id: shiori.id, label: "交通費", amount: 12800 });

    await deleteShiori(shiori.id);

    expect(await getShiori(shiori.id)).toBeUndefined();
    expect(await listPackingItemsByShiori(shiori.id)).toEqual([]);
    expect(await listTodosByShiori(shiori.id)).toEqual([]);
    expect(await listItineraryEntriesByShiori(shiori.id)).toEqual([]);
    expect(await listShioriSpotsByShiori(shiori.id)).toEqual([]);
    expect(await listPhotosByShiori(shiori.id)).toEqual([]);
    expect(await listBudgetItemsByShiori(shiori.id)).toEqual([]);
    // 紐づいていたUGCスポット本体も孤立データにならないよう削除される
    expect(await getSpot(spot.id)).toBeUndefined();
  });

  it("deleteShiori はシードスポット(spotsストアに存在しないid)への紐付けも安全に削除する", async () => {
    const shiori = await createShiori({ title: "シード紐付けテスト", trip_type: "seichi" });
    await createShioriSpot({ shiori_id: shiori.id, spot_id: "seed-example-spot" });

    await expect(deleteShiori(shiori.id)).resolves.not.toThrow();
    expect(await listShioriSpotsByShiori(shiori.id)).toEqual([]);
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

describe("guest-store: budget_items", () => {
  it("CRUD一通りと並び順(sort_order昇順)を確認する", async () => {
    const shiori = await createShiori({ title: "予算テスト用", trip_type: "live" });

    const item1 = await createBudgetItem({ shiori_id: shiori.id, label: "交通費", amount: 12800 });
    const item2 = await createBudgetItem({ shiori_id: shiori.id, label: "宿泊費", amount: 20000 });

    expect(item1.sort_order).toBe(0);
    expect(item2.sort_order).toBe(1);
    expect(item1.amount).toBe(12800);

    const listed = await listBudgetItemsByShiori(shiori.id);
    expect(listed.map((i) => i.label)).toEqual(["交通費", "宿泊費"]);

    const updated = await updateBudgetItem(item1.id, { amount: 15000 });
    expect(updated.amount).toBe(15000);
    expect(updated.label).toBe("交通費");

    await deleteBudgetItem(item2.id);
    const afterDelete = await listBudgetItemsByShiori(shiori.id);
    expect(afterDelete.map((i) => i.label)).toEqual(["交通費"]);
  });

  it("0円の費目も登録できる", async () => {
    const shiori = await createShiori({ title: "0円費目テスト", trip_type: "other" });
    const item = await createBudgetItem({ shiori_id: shiori.id, label: "無料グッズ", amount: 0 });
    expect(item.amount).toBe(0);
  });

  it("reorderBudgetItems は指定順にsort_orderを0始まりで振り直す", async () => {
    const shiori = await createShiori({ title: "予算並べ替え", trip_type: "seichi" });
    const a = await createBudgetItem({ shiori_id: shiori.id, label: "A", amount: 100 });
    const b = await createBudgetItem({ shiori_id: shiori.id, label: "B", amount: 200 });
    const c = await createBudgetItem({ shiori_id: shiori.id, label: "C", amount: 300 });

    await reorderBudgetItems(shiori.id, [c.id, a.id, b.id]);

    const reordered = await listBudgetItemsByShiori(shiori.id);
    expect(reordered.map((i) => i.label)).toEqual(["C", "A", "B"]);
    expect(reordered.map((i) => i.sort_order)).toEqual([0, 1, 2]);
  });

  it("他のしおりに属するIDを含むreorderBudgetItemsはエラーになる", async () => {
    const shioriA = await createShiori({ title: "A", trip_type: "live" });
    const shioriB = await createShiori({ title: "B", trip_type: "live" });
    const itemA = await createBudgetItem({ shiori_id: shioriA.id, label: "A費目", amount: 100 });
    const itemB = await createBudgetItem({ shiori_id: shioriB.id, label: "B費目", amount: 200 });

    await expect(reorderBudgetItems(shioriA.id, [itemA.id, itemB.id])).rejects.toThrow();
  });
});

describe("guest-store: itinerary_entries", () => {
  it("CRUD一通りとday_date昇順→sort_order昇順の並び順を確認する", async () => {
    const shiori = await createShiori({ title: "旅程テスト用", trip_type: "live" });

    const day2First = await createItineraryEntry({
      shiori_id: shiori.id,
      day_date: "2026-08-02",
      title: "2日目最初の予定",
    });
    const day1First = await createItineraryEntry({
      shiori_id: shiori.id,
      day_date: "2026-08-01",
      title: "1日目最初の予定",
      time: "09:00",
      place_name: "東京ドーム",
    });
    const day1Second = await createItineraryEntry({
      shiori_id: shiori.id,
      day_date: "2026-08-01",
      title: "1日目2番目の予定",
    });

    expect(day1First.sort_order).toBe(0);
    expect(day1First.place_name).toBe("東京ドーム");
    expect(day1First.time).toBe("09:00");
    expect(day1Second.sort_order).toBe(1);
    expect(day2First.sort_order).toBe(0);

    const listed = await listItineraryEntriesByShiori(shiori.id);
    expect(listed.map((e) => e.title)).toEqual([
      "1日目最初の予定",
      "1日目2番目の予定",
      "2日目最初の予定",
    ]);

    const updated = await updateItineraryEntry(day1First.id, { title: "更新後タイトル" });
    expect(updated.title).toBe("更新後タイトル");
    expect(updated.place_name).toBe("東京ドーム");

    await deleteItineraryEntry(day1Second.id);
    const afterDelete = await listItineraryEntriesByShiori(shiori.id);
    expect(afterDelete.map((e) => e.title)).toEqual(["更新後タイトル", "2日目最初の予定"]);
  });

  it("reorderItineraryEntries は指定順にsort_orderを0始まりで振り直す", async () => {
    const shiori = await createShiori({ title: "旅程並べ替え", trip_type: "live" });
    const a = await createItineraryEntry({ shiori_id: shiori.id, day_date: "2026-08-01", title: "A" });
    const b = await createItineraryEntry({ shiori_id: shiori.id, day_date: "2026-08-01", title: "B" });
    const c = await createItineraryEntry({ shiori_id: shiori.id, day_date: "2026-08-01", title: "C" });

    await reorderItineraryEntries(shiori.id, [c.id, a.id, b.id]);

    const reordered = await listItineraryEntriesByShiori(shiori.id);
    expect(reordered.map((e) => e.title)).toEqual(["C", "A", "B"]);
    expect(reordered.map((e) => e.sort_order)).toEqual([0, 1, 2]);
  });

  it("他のしおりに属するIDを含むreorderItineraryEntriesはエラーになる", async () => {
    const shioriA = await createShiori({ title: "A", trip_type: "live" });
    const shioriB = await createShiori({ title: "B", trip_type: "live" });
    const entryA = await createItineraryEntry({ shiori_id: shioriA.id, day_date: "2026-08-01", title: "A予定" });
    const entryB = await createItineraryEntry({ shiori_id: shioriB.id, day_date: "2026-08-01", title: "B予定" });

    await expect(reorderItineraryEntries(shioriA.id, [entryA.id, entryB.id])).rejects.toThrow();
  });
});

describe("guest-store: spots", () => {
  it("createSpot はsource='ugc'/status='private'固定で保存し、CRUDが一通り動く", async () => {
    const created = await createSpot({ name: "推しの聖地", description: "作中の舞台", category: "聖地" });

    expect(created.id).toBeTruthy();
    expect(created.name).toBe("推しの聖地");
    expect(created.description).toBe("作中の舞台");
    expect(created.area).toBeNull();
    expect(created.source).toBe("ugc");
    expect(created.status).toBe("private");

    const fetched = await getSpot(created.id);
    expect(fetched).toEqual(created);

    const updated = await updateSpot(created.id, { name: "更新後スポット名" });
    expect(updated.name).toBe("更新後スポット名");
    expect(updated.source).toBe("ugc");

    await deleteSpot(created.id);
    expect(await getSpot(created.id)).toBeUndefined();
  });

  it("listSpots は作成日時の新しい順で返す", async () => {
    const first = await createSpot({ name: "先に作成したスポット" });
    await sleep(5);
    const second = await createSpot({ name: "後に作成したスポット" });

    const all = await listSpots();
    const ids = all.map((s) => s.id);
    expect(ids.indexOf(second.id)).toBeLessThan(ids.indexOf(first.id));
  });

  it("存在しないIDのupdateSpotはエラーになる", async () => {
    await expect(updateSpot("no-such-spot-id", { name: "x" })).rejects.toThrow();
  });
});

describe("guest-store: shiori_spots", () => {
  it("複合キー(shiori_id, spot_id)でCRUDが一通り動く", async () => {
    const shiori = await createShiori({ title: "スポット紐付けテスト", trip_type: "seichi" });
    const spot = await createSpot({ name: "行きたいスポット" });

    const created = await createShioriSpot({ shiori_id: shiori.id, spot_id: spot.id, memo: "開演前に寄る" });
    expect(created.is_visited).toBe(false);
    expect(created.memo).toBe("開演前に寄る");

    const listed = await listShioriSpotsByShiori(shiori.id);
    expect(listed).toEqual([created]);

    const updated = await updateShioriSpot(shiori.id, spot.id, { is_visited: true });
    expect(updated.is_visited).toBe(true);
    expect(updated.memo).toBe("開演前に寄る");

    await deleteShioriSpot(shiori.id, spot.id);
    expect(await listShioriSpotsByShiori(shiori.id)).toEqual([]);
  });

  it("シードスポットのid(spotsストアに存在しないid)でも紐付けを作成できる", async () => {
    const shiori = await createShiori({ title: "シード紐付け", trip_type: "live" });

    const created = await createShioriSpot({ shiori_id: shiori.id, spot_id: "seed-tokyo-dome" });
    expect(created.spot_id).toBe("seed-tokyo-dome");

    const listed = await listShioriSpotsByShiori(shiori.id);
    expect(listed.map((s) => s.spot_id)).toEqual(["seed-tokyo-dome"]);
  });

  it("存在しない紐付けのupdateShioriSpotはエラーになる", async () => {
    await expect(updateShioriSpot("no-such-shiori", "no-such-spot", { is_visited: true })).rejects.toThrow();
  });
});

describe("guest-store: photos", () => {
  it("CRUD一通りとcountPhotosByShioriを確認する", async () => {
    const shiori = await createShiori({ title: "写真ログテスト", trip_type: "live" });
    const blob1 = new Blob(["dummy-image-1"], { type: "image/webp" });
    const blob2 = new Blob(["dummy-image-2"], { type: "image/webp" });

    const photo1 = await createPhoto({ shiori_id: shiori.id, blob: blob1, day_date: "2026-08-01" });
    const photo2 = await createPhoto({ shiori_id: shiori.id, blob: blob2, caption: "開演前の様子" });

    expect(photo1.day_date).toBe("2026-08-01");
    expect(photo1.caption).toBeNull();
    expect(photo2.caption).toBe("開演前の様子");
    expect(photo2.blob).toBeInstanceOf(Blob);

    expect(await countPhotosByShiori(shiori.id)).toBe(2);

    const updated = await updatePhoto(photo1.id, { caption: "後から追加したキャプション" });
    expect(updated.caption).toBe("後から追加したキャプション");
    expect(updated.blob).toBeInstanceOf(Blob);

    await deletePhoto(photo2.id);
    expect(await countPhotosByShiori(shiori.id)).toBe(1);

    const listed = await listPhotosByShiori(shiori.id);
    expect(listed.map((p) => p.id)).toEqual([photo1.id]);
  });

  it("存在しないIDのupdatePhotoはエラーになる", async () => {
    await expect(updatePhoto("no-such-photo-id", { caption: "x" })).rejects.toThrow();
  });
});
