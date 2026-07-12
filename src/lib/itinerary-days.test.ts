import { describe, expect, it } from "vitest";
import { buildItineraryDayList, formatDayLabel, groupEntriesByDay } from "./itinerary-days";
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

describe("formatDayLabel", () => {
  it("「{n}日目 {M/D}({曜日})」形式に整形する", () => {
    // 2026-08-01は土曜日
    expect(formatDayLabel(1, "2026-08-01")).toBe("1日目 8/1(土)");
  });

  it("2日目以降も同じ形式で整形する", () => {
    // 2026-08-02は日曜日
    expect(formatDayLabel(2, "2026-08-02")).toBe("2日目 8/2(日)");
  });
});

describe("buildItineraryDayList", () => {
  it("start_date〜end_dateを日付順に列挙する", () => {
    const days = buildItineraryDayList("2026-08-01", "2026-08-03");
    expect(days).not.toBeNull();
    expect(days?.map((d) => d.date)).toEqual(["2026-08-01", "2026-08-02", "2026-08-03"]);
    expect(days?.map((d) => d.dayIndex)).toEqual([1, 2, 3]);
    expect(days?.[0].label).toBe("1日目 8/1(土)");
  });

  it("start_date === end_date の場合は1日のみ", () => {
    const days = buildItineraryDayList("2026-08-01", "2026-08-01");
    expect(days?.map((d) => d.date)).toEqual(["2026-08-01"]);
  });

  it("月をまたぐ日程も正しく列挙する", () => {
    const days = buildItineraryDayList("2026-07-31", "2026-08-01");
    expect(days?.map((d) => d.date)).toEqual(["2026-07-31", "2026-08-01"]);
  });

  it("start_dateがnullの場合はnullを返す(フォールバック対象)", () => {
    expect(buildItineraryDayList(null, "2026-08-01")).toBeNull();
  });

  it("end_dateがnullの場合はnullを返す(フォールバック対象)", () => {
    expect(buildItineraryDayList("2026-08-01", null)).toBeNull();
  });

  it("両方nullの場合はnullを返す", () => {
    expect(buildItineraryDayList(null, null)).toBeNull();
  });

  it("end_dateがstart_dateより前の不正データはnullを返す(無限ループ防止)", () => {
    expect(buildItineraryDayList("2026-08-05", "2026-08-01")).toBeNull();
  });
});

describe("groupEntriesByDay", () => {
  it("各日にday_dateが一致するエントリーをsort_order昇順で割り当てる", () => {
    const days = buildItineraryDayList("2026-08-01", "2026-08-02");
    const entries = [
      entry({ id: "b", day_date: "2026-08-01", sort_order: 1 }),
      entry({ id: "a", day_date: "2026-08-01", sort_order: 0 }),
      entry({ id: "c", day_date: "2026-08-02", sort_order: 0 }),
    ];
    const groups = groupEntriesByDay(days ?? [], entries);
    expect(groups[0].entries.map((e) => e.id)).toEqual(["a", "b"]);
    expect(groups[1].entries.map((e) => e.id)).toEqual(["c"]);
  });

  it("該当エントリーが無い日はentries=[]になる", () => {
    const days = buildItineraryDayList("2026-08-01", "2026-08-02");
    const groups = groupEntriesByDay(days ?? [], []);
    expect(groups[0].entries).toEqual([]);
    expect(groups[1].entries).toEqual([]);
  });
});
