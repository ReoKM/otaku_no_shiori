import { describe, expect, it } from "vitest";
import {
  canMoveDown,
  canMoveUp,
  formatDueDate,
  isDueToday,
  moveTodoInGroup,
  sortTodos,
  todayYmd,
  todoGroupKey,
} from "./todo-sort";
import type { Todo } from "@/types/shiori";

function todo(overrides: Partial<Todo> & Pick<Todo, "id">): Todo {
  return {
    shiori_id: "shiori-1",
    label: `label-${overrides.id}`,
    due_date: null,
    is_done: false,
    sort_order: 0,
    ...overrides,
  };
}

describe("todayYmd", () => {
  it("Dateをローカルの YYYY-MM-DD 形式に整形する", () => {
    expect(todayYmd(new Date(2026, 7, 5))).toBe("2026-08-05"); // 月は0始まりなので7=8月
  });

  it("1桁の月日は0埋めする", () => {
    expect(todayYmd(new Date(2026, 0, 9))).toBe("2026-01-09");
  });
});

describe("isDueToday", () => {
  it("due_dateが本日と一致すればtrue", () => {
    expect(isDueToday("2026-07-11", "2026-07-11")).toBe(true);
  });

  it("due_dateが本日と異なればfalse", () => {
    expect(isDueToday("2026-07-12", "2026-07-11")).toBe(false);
  });

  it("due_dateがnullならfalse", () => {
    expect(isDueToday(null, "2026-07-11")).toBe(false);
  });
});

describe("formatDueDate", () => {
  it("月/日+曜日(かっこ付き)の形式に整形する(年は表示しない)", () => {
    // 2026-08-15は土曜日
    expect(formatDueDate("2026-08-15")).toBe("8/15(土)");
  });

  it("1桁の月日でも0埋めせずそのまま表示する", () => {
    // 2026-01-04は日曜日
    expect(formatDueDate("2026-01-04")).toBe("1/4(日)");
  });
});

describe("sortTodos", () => {
  it("未完了を上部、完了済みを末尾にまとめる", () => {
    const items = [
      todo({ id: "done-1", is_done: true, sort_order: 0 }),
      todo({ id: "open-1", is_done: false, sort_order: 1 }),
    ];
    const sorted = sortTodos(items);
    expect(sorted.map((t) => t.id)).toEqual(["open-1", "done-1"]);
  });

  it("各グループ内はdue_dateが近い順(昇順)", () => {
    const items = [
      todo({ id: "late", due_date: "2026-08-20", sort_order: 0 }),
      todo({ id: "early", due_date: "2026-08-01", sort_order: 1 }),
      todo({ id: "mid", due_date: "2026-08-10", sort_order: 2 }),
    ];
    const sorted = sortTodos(items);
    expect(sorted.map((t) => t.id)).toEqual(["early", "mid", "late"]);
  });

  it("due_date未設定は各グループの末尾にまとめる", () => {
    const items = [
      todo({ id: "no-date", due_date: null, sort_order: 0 }),
      todo({ id: "with-date", due_date: "2026-08-01", sort_order: 1 }),
    ];
    const sorted = sortTodos(items);
    expect(sorted.map((t) => t.id)).toEqual(["with-date", "no-date"]);
  });

  it("同じ期限日同士・未設定同士はsort_order昇順でタイブレークする", () => {
    const items = [
      todo({ id: "b", due_date: "2026-08-01", sort_order: 1 }),
      todo({ id: "a", due_date: "2026-08-01", sort_order: 0 }),
      todo({ id: "d", due_date: null, sort_order: 3 }),
      todo({ id: "c", due_date: null, sort_order: 2 }),
    ];
    const sorted = sortTodos(items);
    expect(sorted.map((t) => t.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("未完了グループの期限なし・完了済みグループの期限ありが混在しても各グループ内規則が優先される", () => {
    const items = [
      todo({ id: "done-with-date", is_done: true, due_date: "2026-08-01", sort_order: 0 }),
      todo({ id: "open-no-date", is_done: false, due_date: null, sort_order: 1 }),
      todo({ id: "open-with-date", is_done: false, due_date: "2026-08-05", sort_order: 2 }),
      todo({ id: "done-no-date", is_done: true, due_date: null, sort_order: 3 }),
    ];
    const sorted = sortTodos(items);
    expect(sorted.map((t) => t.id)).toEqual([
      "open-with-date",
      "open-no-date",
      "done-with-date",
      "done-no-date",
    ]);
  });

  it("元の配列を変更しない", () => {
    const items = [todo({ id: "a", sort_order: 1 }), todo({ id: "b", sort_order: 0 })];
    const original = [...items];
    sortTodos(items);
    expect(items).toEqual(original);
  });
});

describe("todoGroupKey", () => {
  it("is_doneとdue_dateの組み合わせが同じなら同じキーになる", () => {
    const a = todo({ id: "a", is_done: false, due_date: "2026-08-01" });
    const b = todo({ id: "b", is_done: false, due_date: "2026-08-01" });
    expect(todoGroupKey(a)).toBe(todoGroupKey(b));
  });

  it("is_doneが異なれば別キーになる", () => {
    const a = todo({ id: "a", is_done: false, due_date: "2026-08-01" });
    const b = todo({ id: "b", is_done: true, due_date: "2026-08-01" });
    expect(todoGroupKey(a)).not.toBe(todoGroupKey(b));
  });

  it("due_dateが異なれば別キーになる", () => {
    const a = todo({ id: "a", due_date: "2026-08-01" });
    const b = todo({ id: "b", due_date: "2026-08-02" });
    expect(todoGroupKey(a)).not.toBe(todoGroupKey(b));
  });

  it("due_date未設定同士は同じキーになる", () => {
    const a = todo({ id: "a", due_date: null });
    const b = todo({ id: "b", due_date: null });
    expect(todoGroupKey(a)).toBe(todoGroupKey(b));
  });
});

describe("canMoveUp / canMoveDown(並べ替えモードのグループ境界)", () => {
  // 3件: 期限日グループ[2026-08-01]が2件(index 0,1)、期限なしグループが1件(index 2)
  const sorted = [
    todo({ id: "a", due_date: "2026-08-01", sort_order: 0 }),
    todo({ id: "b", due_date: "2026-08-01", sort_order: 1 }),
    todo({ id: "c", due_date: null, sort_order: 2 }),
  ];

  it("グループ先頭は上へ移動できない", () => {
    expect(canMoveUp(sorted, 0)).toBe(false);
  });

  it("同じグループ内なら上へ移動できる", () => {
    expect(canMoveUp(sorted, 1)).toBe(true);
  });

  it("グループ境界を越える移動はできない(下のグループへの移動不可)", () => {
    expect(canMoveDown(sorted, 1)).toBe(false);
  });

  it("末尾グループの末尾は下へ移動できない", () => {
    expect(canMoveDown(sorted, 2)).toBe(false);
  });

  it("配列の範囲外indexはfalseを返す", () => {
    expect(canMoveUp(sorted, -1)).toBe(false);
    expect(canMoveDown(sorted, sorted.length)).toBe(false);
  });
});

describe("moveTodoInGroup", () => {
  const sorted = [
    todo({ id: "a", due_date: "2026-08-01", sort_order: 0 }),
    todo({ id: "b", due_date: "2026-08-01", sort_order: 1 }),
    todo({ id: "c", due_date: null, sort_order: 2 }),
  ];

  it("同じグループ内での上移動は入れ替えた配列を返す", () => {
    const moved = moveTodoInGroup(sorted, 1, "up");
    expect(moved?.map((t) => t.id)).toEqual(["b", "a", "c"]);
  });

  it("同じグループ内での下移動は入れ替えた配列を返す", () => {
    const moved = moveTodoInGroup(sorted, 0, "down");
    expect(moved?.map((t) => t.id)).toEqual(["b", "a", "c"]);
  });

  it("グループ境界を越える移動はnullを返す(何も起きない)", () => {
    expect(moveTodoInGroup(sorted, 1, "down")).toBeNull();
  });

  it("先頭項目の上移動はnullを返す", () => {
    expect(moveTodoInGroup(sorted, 0, "up")).toBeNull();
  });

  it("末尾項目の下移動はnullを返す", () => {
    expect(moveTodoInGroup(sorted, 2, "down")).toBeNull();
  });

  it("元の配列を変更しない", () => {
    const original = [...sorted];
    moveTodoInGroup(sorted, 1, "up");
    expect(sorted).toEqual(original);
  });
});
