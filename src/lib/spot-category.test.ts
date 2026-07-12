import { describe, expect, it } from "vitest";
import { getSpotCategoryLabel, getSpotCategoryRank, SPOT_CATEGORY_ORDER } from "./spot-category";

describe("getSpotCategoryLabel", () => {
  it.each([
    ["venue", "会場"],
    ["seichi", "聖地"],
    ["food", "グルメ"],
    ["goods", "グッズ"],
    ["other", "その他"],
  ])("%sは%sを返す", (category, label) => {
    expect(getSpotCategoryLabel(category)).toBe(label);
  });

  it("nullはundefinedを返す(バッジ非表示)", () => {
    expect(getSpotCategoryLabel(null)).toBeUndefined();
  });

  it("未知の値はundefinedを返す", () => {
    expect(getSpotCategoryLabel("unknown-category")).toBeUndefined();
  });
});

describe("getSpotCategoryRank", () => {
  it("SPOT_CATEGORY_ORDERの順にランクが振られる", () => {
    const ranks = SPOT_CATEGORY_ORDER.map((c) => getSpotCategoryRank(c));
    expect(ranks).toEqual([0, 1, 2, 3, 4]);
  });

  it("null・未知の値は最後尾ランク(配列長)を返す", () => {
    expect(getSpotCategoryRank(null)).toBe(SPOT_CATEGORY_ORDER.length);
    expect(getSpotCategoryRank("unknown")).toBe(SPOT_CATEGORY_ORDER.length);
  });
});
