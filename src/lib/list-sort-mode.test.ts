import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyListSortMode,
  DEFAULT_LIST_SORT_MODE,
  loadListSortMode,
  saveListSortMode,
} from "./list-sort-mode";

interface Row {
  id: string;
  done: boolean;
}

const rows: Row[] = [
  { id: "a", done: false },
  { id: "b", done: true },
  { id: "c", done: false },
  { id: "d", done: true },
];

const isDone = (r: Row) => r.done;
const ids = (list: Row[]) => list.map((r) => r.id);

describe("applyListSortMode", () => {
  it("登録順は渡された順序をそのまま返す", () => {
    expect(ids(applyListSortMode(rows, "registered", isDone))).toEqual(["a", "b", "c", "d"]);
  });

  it("手動で並べ替えも渡された順序をそのまま返す", () => {
    expect(ids(applyListSortMode(rows, "manual", isDone))).toEqual(["a", "b", "c", "d"]);
  });

  it("未完了を上には未完了を先頭へ寄せ、同じ状態の中では元の順序を保つ", () => {
    expect(ids(applyListSortMode(rows, "undone-first", isDone))).toEqual(["a", "c", "b", "d"]);
  });

  it("完了済みを上には完了済みを先頭へ寄せ、同じ状態の中では元の順序を保つ", () => {
    expect(ids(applyListSortMode(rows, "done-first", isDone))).toEqual(["b", "d", "a", "c"]);
  });

  it("元の配列を変更しない", () => {
    const original = [...rows];
    applyListSortMode(rows, "undone-first", isDone);
    expect(rows).toEqual(original);
  });

  it("空配列でも落ちない", () => {
    expect(applyListSortMode([], "undone-first", isDone)).toEqual([]);
  });
});

/** テスト環境(node)にはwindowが無いため、localStorageだけを持つ最小のwindowを注入する。 */
function stubWindow(store: Map<string, string>, throwOnAccess = false) {
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => {
        if (throwOnAccess) {
          throw new Error("localStorage is disabled");
        }
        return store.get(key) ?? null;
      },
      setItem: (key: string, value: string) => {
        if (throwOnAccess) {
          throw new Error("localStorage is disabled");
        }
        store.set(key, value);
      },
    },
  });
}

describe("loadListSortMode / saveListSortMode", () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = new Map();
    stubWindow(store);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("未保存なら既定値を返す", () => {
    expect(loadListSortMode("s1", "packing")).toBe(DEFAULT_LIST_SORT_MODE);
  });

  it("保存した値を読み出せる", () => {
    saveListSortMode("s1", "packing", "undone-first");
    expect(loadListSortMode("s1", "packing")).toBe("undone-first");
  });

  it("しおりidとタブの組み合わせごとに別々に保存される", () => {
    saveListSortMode("s1", "packing", "undone-first");
    saveListSortMode("s1", "todo", "done-first");
    saveListSortMode("s2", "packing", "manual");

    expect(loadListSortMode("s1", "packing")).toBe("undone-first");
    expect(loadListSortMode("s1", "todo")).toBe("done-first");
    expect(loadListSortMode("s2", "packing")).toBe("manual");
    expect(loadListSortMode("s2", "todo")).toBe(DEFAULT_LIST_SORT_MODE);
  });

  it("不正な値が保存されていたら既定値を返す", () => {
    store.set("shiori-sort:packing:s1", "not-a-mode");
    expect(loadListSortMode("s1", "packing")).toBe(DEFAULT_LIST_SORT_MODE);
  });

  it("localStorageが使えない環境でも例外を投げず既定値を返す", () => {
    stubWindow(store, true);
    expect(() => saveListSortMode("s1", "packing", "manual")).not.toThrow();
    expect(loadListSortMode("s1", "packing")).toBe(DEFAULT_LIST_SORT_MODE);
  });

  it("windowが無い環境(SSR)では既定値を返し保存もしない", () => {
    vi.unstubAllGlobals();
    expect(() => saveListSortMode("s1", "packing", "manual")).not.toThrow();
    expect(loadListSortMode("s1", "packing")).toBe(DEFAULT_LIST_SORT_MODE);
  });
});
