import { describe, expect, it } from "vitest";

import {
  collectAllGuestTextData,
  createItineraryEntry,
  createPackingItem,
  createPhoto,
  createShiori,
  createShioriSpot,
  createSpot,
  createTodo,
  getGuestMigrationState,
  listAllGuestPhotos,
  markGuestDataMigrated,
} from "./guest-store";

/**
 * ゲスト→クラウド移行(Issue #99)向けに追加した関数のテスト。
 * `guest-store.test.ts`とは別ファイルにする理由は`guest-store.migration.test.ts`と同じ
 * (vitestはテストファイルごとにモジュール・fake-indexeddbのグローバルを分離するため、
 * 他のテストファイルが作成した大量のshiori等が`collectAllGuestTextData`/`listAllGuestPhotos`
 * (=全件取得)の結果に混ざらないようにする)。
 */
describe("guest-store: 移行済みフラグ", () => {
  it("一度も移行していない場合、getGuestMigrationStateはmigrated:falseを返す", async () => {
    const state = await getGuestMigrationState();
    expect(state).toEqual({ migrated: false, migrated_at: null });
  });

  it("markGuestDataMigrated後はmigrated:trueとmigrated_atが返る", async () => {
    await markGuestDataMigrated();
    const state = await getGuestMigrationState();
    expect(state.migrated).toBe(true);
    expect(state.migrated_at).not.toBeNull();
    expect(Number.isNaN(Date.parse(state.migrated_at as string))).toBe(false);
  });
});

describe("guest-store: collectAllGuestTextData / listAllGuestPhotos", () => {
  it("複数しおり分のテキストデータ・写真をまとめて取得できる", async () => {
    const shiori1 = await createShiori({ title: "夏フェス遠征", trip_type: "live" });
    const shiori2 = await createShiori({ title: "聖地巡礼", trip_type: "seichi" });

    const packing = await createPackingItem({ shiori_id: shiori1.id, label: "うちわ" });
    const todo = await createTodo({ shiori_id: shiori1.id, label: "チケット確認" });
    const entry = await createItineraryEntry({ shiori_id: shiori2.id, day_date: "2026-08-10", title: "集合" });
    const spot = await createSpot({ name: "◯◯会場前カフェ" });
    const shioriSpot = await createShioriSpot({ shiori_id: shiori1.id, spot_id: spot.id });
    const photo1 = await createPhoto({ shiori_id: shiori1.id, blob: new Blob(["a"], { type: "image/webp" }) });
    const photo2 = await createPhoto({ shiori_id: shiori2.id, blob: new Blob(["b"], { type: "image/webp" }) });

    const textData = await collectAllGuestTextData();
    expect(textData.shiori.map((s) => s.id)).toEqual(expect.arrayContaining([shiori1.id, shiori2.id]));
    expect(textData.packing_items.map((p) => p.id)).toContain(packing.id);
    expect(textData.todos.map((t) => t.id)).toContain(todo.id);
    expect(textData.itinerary_entries.map((e) => e.id)).toContain(entry.id);
    expect(textData.spots.map((s) => s.id)).toContain(spot.id);
    expect(
      textData.shiori_spots.some((s) => s.shiori_id === shioriSpot.shiori_id && s.spot_id === shioriSpot.spot_id),
    ).toBe(true);

    const photos = await listAllGuestPhotos();
    expect(photos.map((p) => p.id)).toEqual(expect.arrayContaining([photo1.id, photo2.id]));
  });
});
