import { describe, expect, it } from "vitest";
import { clampIndexToGroupRange, computeDropIndex, moveIdToIndex } from "./drag-sort";
import type { RowRect } from "./drag-sort";

function rows(...items: Array<[string, number, number]>): RowRect[] {
  return items.map(([id, top, height]) => ({ id, top, height }));
}

describe("computeDropIndex", () => {
  const list = rows(["a", 0, 56], ["b", 56, 56], ["c", 112, 56]);

  it("先頭行より上ならインデックス0", () => {
    expect(computeDropIndex(list, -10)).toBe(0);
  });

  it("行の中央より上ならその行の位置", () => {
    // aの中央=28。それより上
    expect(computeDropIndex(list, 20)).toBe(0);
  });

  it("行の中央より下なら次の行の位置", () => {
    // aの中央=28。それより下、bの中央=84より上
    expect(computeDropIndex(list, 40)).toBe(1);
  });

  it("最後の行の中央より下なら末尾(rows.length)", () => {
    // cの中央=140
    expect(computeDropIndex(list, 200)).toBe(3);
  });

  it("行が0件なら常に0", () => {
    expect(computeDropIndex([], 100)).toBe(0);
  });
});

describe("moveIdToIndex", () => {
  it("先頭へ移動する", () => {
    expect(moveIdToIndex(["a", "b", "c"], "c", 0)).toEqual(["c", "a", "b"]);
  });

  it("末尾へ移動する", () => {
    expect(moveIdToIndex(["a", "b", "c"], "a", 2)).toEqual(["b", "c", "a"]);
  });

  it("中間へ移動する", () => {
    expect(moveIdToIndex(["a", "b", "c", "d"], "d", 1)).toEqual(["a", "d", "b", "c"]);
  });

  it("同じ位置への移動は元と同じ並びになる", () => {
    expect(moveIdToIndex(["a", "b", "c"], "b", 1)).toEqual(["a", "b", "c"]);
  });

  it("dropIndexが範囲外ならクランプする", () => {
    expect(moveIdToIndex(["a", "b", "c"], "a", 99)).toEqual(["b", "c", "a"]);
    expect(moveIdToIndex(["a", "b", "c"], "c", -5)).toEqual(["c", "a", "b"]);
  });

  it("draggedIdがorderに含まれない場合はorderをそのまま返す", () => {
    const order = ["a", "b", "c"];
    expect(moveIdToIndex(order, "z", 1)).toBe(order);
  });
});

describe("clampIndexToGroupRange", () => {
  // グループ: g1(0,1) / g2(2) / g3(3,4)
  const others = ["a1", "a2", "b1", "c1", "c2"];
  const groupKeyOf = (id: string) => id.slice(0, 1);

  it("グループ範囲内ならそのまま返す", () => {
    expect(clampIndexToGroupRange(others, groupKeyOf, "a", 1)).toBe(1);
  });

  it("グループより前を指していたら範囲の先頭にクランプする", () => {
    expect(clampIndexToGroupRange(others, groupKeyOf, "b", 0)).toBe(2);
  });

  it("グループより後ろを指していたら範囲の末尾にクランプする", () => {
    expect(clampIndexToGroupRange(others, groupKeyOf, "a", 5)).toBe(2);
  });

  it("単一要素グループでも範囲は1点になる", () => {
    expect(clampIndexToGroupRange(others, groupKeyOf, "b", 4)).toBe(3);
    expect(clampIndexToGroupRange(others, groupKeyOf, "b", 0)).toBe(2);
  });

  it("末尾グループは末尾(others.length)までクランプできる", () => {
    expect(clampIndexToGroupRange(others, groupKeyOf, "c", 99)).toBe(5);
  });

  it("該当グループがothersに存在しない場合はdropIndexをそのまま返す", () => {
    expect(clampIndexToGroupRange(others, groupKeyOf, "z", 2)).toBe(2);
  });
});
