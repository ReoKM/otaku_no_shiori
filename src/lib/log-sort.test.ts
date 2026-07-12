import { describe, expect, it } from "vitest";
import { UNSET_DATE_LABEL, groupLogsByDay } from "./log-sort";

interface Item {
  id: string;
  day_date: string | null;
  sort_key: string;
}

function item(id: string, day_date: string | null, sort_key: string): Item {
  return { id, day_date, sort_key };
}

describe("groupLogsByDay", () => {
  it("day_date昇順(古い日付が先)でグループを並べる", () => {
    const items = [
      item("a", "2026-08-02", "2026-08-02T10:00:00.000Z"),
      item("b", "2026-08-01", "2026-08-01T10:00:00.000Z"),
    ];
    const groups = groupLogsByDay(items);
    expect(groups.map((g) => g.key)).toEqual(["2026-08-01", "2026-08-02"]);
  });

  it("日付見出しは「8/15(土)」形式で整形される", () => {
    // 2026-08-15は土曜日
    const groups = groupLogsByDay([item("a", "2026-08-15", "2026-08-15T00:00:00.000Z")]);
    expect(groups[0].label).toBe("8/15(土)");
  });

  it("day_date未設定は「日付未設定」グループとして最後にまとめる", () => {
    const items = [
      item("a", null, "2026-08-01T00:00:00.000Z"),
      item("b", "2026-08-05", "2026-08-05T00:00:00.000Z"),
      item("c", "2026-08-01", "2026-08-01T00:00:00.000Z"),
    ];
    const groups = groupLogsByDay(items);
    expect(groups.map((g) => g.key)).toEqual(["2026-08-01", "2026-08-05", "unset"]);
    expect(groups[groups.length - 1].label).toBe(UNSET_DATE_LABEL);
  });

  it("各グループ内はsort_key昇順(追加順)で並べる", () => {
    const items = [
      item("later", "2026-08-01", "2026-08-01T12:00:00.000Z"),
      item("earlier", "2026-08-01", "2026-08-01T01:00:00.000Z"),
    ];
    const groups = groupLogsByDay(items);
    expect(groups[0].items.map((i) => i.id)).toEqual(["earlier", "later"]);
  });

  it("空配列を渡すと空配列を返す", () => {
    expect(groupLogsByDay([])).toEqual([]);
  });

  it("全て日付未設定の場合は未設定グループのみを返す", () => {
    const items = [item("a", null, "2026-08-01T00:00:00.000Z"), item("b", null, "2026-08-02T00:00:00.000Z")];
    const groups = groupLogsByDay(items);
    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe("unset");
    expect(groups[0].items.map((i) => i.id)).toEqual(["a", "b"]);
  });
});
