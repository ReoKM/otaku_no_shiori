import { describe, expect, it } from "vitest";
import {
  canMoveDownInDay,
  canMoveUpInDay,
  computeDayChangePlan,
  moveEntryInDay,
  sameDayIdsExcluding,
} from "./itinerary-sort";
import type { ItineraryEntry } from "@/types/shiori";

function entry(overrides: Partial<ItineraryEntry> & Pick<ItineraryEntry, "id" | "day_date">): ItineraryEntry {
  return {
    shiori_id: "shiori-1",
    time: null,
    title: `title-${overrides.id}`,
    place_name: null,
    memo: null,
    sort_order: 0,
    ...overrides,
  };
}

describe("canMoveUpInDay / canMoveDownInDay", () => {
  const dayEntries = [
    entry({ id: "a", day_date: "2026-08-01", sort_order: 0 }),
    entry({ id: "b", day_date: "2026-08-01", sort_order: 1 }),
    entry({ id: "c", day_date: "2026-08-01", sort_order: 2 }),
  ];

  it("先頭は上へ移動できない", () => {
    expect(canMoveUpInDay(dayEntries, 0)).toBe(false);
  });

  it("先頭以外は上へ移動できる", () => {
    expect(canMoveUpInDay(dayEntries, 1)).toBe(true);
    expect(canMoveUpInDay(dayEntries, 2)).toBe(true);
  });

  it("末尾は下へ移動できない", () => {
    expect(canMoveDownInDay(dayEntries, 2)).toBe(false);
  });

  it("末尾以外は下へ移動できる", () => {
    expect(canMoveDownInDay(dayEntries, 0)).toBe(true);
    expect(canMoveDownInDay(dayEntries, 1)).toBe(true);
  });

  it("範囲外indexはfalseを返す", () => {
    expect(canMoveUpInDay(dayEntries, -1)).toBe(false);
    expect(canMoveDownInDay(dayEntries, dayEntries.length)).toBe(false);
  });

  it("1件のみの場合は上下どちらも移動できない", () => {
    const single = [entry({ id: "a", day_date: "2026-08-01" })];
    expect(canMoveUpInDay(single, 0)).toBe(false);
    expect(canMoveDownInDay(single, 0)).toBe(false);
  });
});

describe("moveEntryInDay", () => {
  const dayEntries = [
    entry({ id: "a", day_date: "2026-08-01", sort_order: 0 }),
    entry({ id: "b", day_date: "2026-08-01", sort_order: 1 }),
    entry({ id: "c", day_date: "2026-08-01", sort_order: 2 }),
  ];

  it("上へ移動すると隣接する項目と入れ替わる", () => {
    const moved = moveEntryInDay(dayEntries, 1, "up");
    expect(moved?.map((e) => e.id)).toEqual(["b", "a", "c"]);
  });

  it("下へ移動すると隣接する項目と入れ替わる", () => {
    const moved = moveEntryInDay(dayEntries, 0, "down");
    expect(moved?.map((e) => e.id)).toEqual(["b", "a", "c"]);
  });

  it("先頭の上移動はnullを返す(何も起きない)", () => {
    expect(moveEntryInDay(dayEntries, 0, "up")).toBeNull();
  });

  it("末尾の下移動はnullを返す(何も起きない)", () => {
    expect(moveEntryInDay(dayEntries, 2, "down")).toBeNull();
  });

  it("元の配列を変更しない", () => {
    const original = [...dayEntries];
    moveEntryInDay(dayEntries, 1, "up");
    expect(dayEntries).toEqual(original);
  });
});

describe("sameDayIdsExcluding", () => {
  it("指定日・指定id以外のidをsort_order昇順で返す", () => {
    const entries = [
      entry({ id: "b", day_date: "2026-08-01", sort_order: 1 }),
      entry({ id: "a", day_date: "2026-08-01", sort_order: 0 }),
      entry({ id: "other-day", day_date: "2026-08-02", sort_order: 0 }),
    ];
    expect(sameDayIdsExcluding(entries, "2026-08-01", "a")).toEqual(["b"]);
  });

  it("該当が無ければ空配列を返す", () => {
    const entries = [entry({ id: "a", day_date: "2026-08-01", sort_order: 0 })];
    expect(sameDayIdsExcluding(entries, "2026-08-01", "a")).toEqual([]);
  });
});

describe("computeDayChangePlan", () => {
  it("移動先の日の末尾sort_orderを計算する", () => {
    const entries = [
      entry({ id: "moving", day_date: "2026-08-01", sort_order: 0 }),
      entry({ id: "target-1", day_date: "2026-08-02", sort_order: 0 }),
      entry({ id: "target-2", day_date: "2026-08-02", sort_order: 1 }),
    ];
    const plan = computeDayChangePlan(entries, "moving", "2026-08-02");
    expect(plan.newSortOrder).toBe(2);
  });

  it("移動元の日に残る項目の詰め直しid配列を返す", () => {
    const entries = [
      entry({ id: "moving", day_date: "2026-08-01", sort_order: 0 }),
      entry({ id: "stay-1", day_date: "2026-08-01", sort_order: 1 }),
      entry({ id: "stay-2", day_date: "2026-08-01", sort_order: 2 }),
      entry({ id: "target-1", day_date: "2026-08-02", sort_order: 0 }),
    ];
    const plan = computeDayChangePlan(entries, "moving", "2026-08-02");
    expect(plan.oldDayOrderedIds).toEqual(["stay-1", "stay-2"]);
  });

  it("移動先が空の日ならsort_orderは0になる", () => {
    const entries = [entry({ id: "moving", day_date: "2026-08-01", sort_order: 0 })];
    const plan = computeDayChangePlan(entries, "moving", "2026-08-03");
    expect(plan.newSortOrder).toBe(0);
    expect(plan.oldDayOrderedIds).toEqual([]);
  });

  it("日付が変わらない場合はoldDayOrderedIdsが空配列になる", () => {
    const entries = [
      entry({ id: "moving", day_date: "2026-08-01", sort_order: 0 }),
      entry({ id: "sibling", day_date: "2026-08-01", sort_order: 1 }),
    ];
    const plan = computeDayChangePlan(entries, "moving", "2026-08-01");
    expect(plan.oldDayOrderedIds).toEqual([]);
  });
});
