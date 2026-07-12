import { describe, expect, it } from "vitest";
import type { SeedSpot } from "./seed-spots";
import { matchesSpotKeyword, searchSeedSpots, sortSeedSpots } from "./spot-search";

function spot(overrides: Partial<SeedSpot> & Pick<SeedSpot, "id" | "name" | "category">): SeedSpot {
  return {
    description: "説明文",
    area: "東京都",
    map_query: overrides.name,
    source: "seed",
    refs: ["https://example.com"],
    ...overrides,
  };
}

const VENUE_B = spot({ id: "seed-b", name: "横浜アリーナ", category: "venue", area: "神奈川県横浜市" });
const VENUE_A = spot({ id: "seed-a", name: "東京ドーム", category: "venue", area: "東京都文京区" });
const SEICHI = spot({
  id: "seed-c",
  name: "日向坂",
  category: "seichi",
  area: "東京都港区",
  description: "推しグループの由来になった坂",
});
const GOODS = spot({ id: "seed-d", name: "タワレコ渋谷店", category: "goods", area: "東京都渋谷区" });

describe("matchesSpotKeyword", () => {
  it("空キーワードは常にtrue", () => {
    expect(matchesSpotKeyword(VENUE_A, "")).toBe(true);
    expect(matchesSpotKeyword(VENUE_A, "   ")).toBe(true);
  });

  it("名前の部分一致でtrue", () => {
    expect(matchesSpotKeyword(VENUE_A, "ドーム")).toBe(true);
  });

  it("エリアの部分一致でtrue", () => {
    expect(matchesSpotKeyword(SEICHI, "港区")).toBe(true);
  });

  it("説明文(description)の部分一致でtrue(作品名・キャラ名検索対応)", () => {
    expect(matchesSpotKeyword(SEICHI, "推しグループ")).toBe(true);
  });

  it("大文字小文字を区別しない", () => {
    const spotWithAlpha = spot({ id: "seed-e", name: "ABC Hall", category: "venue" });
    expect(matchesSpotKeyword(spotWithAlpha, "abc")).toBe(true);
  });

  it("どこにも一致しない場合はfalse", () => {
    expect(matchesSpotKeyword(VENUE_A, "存在しないキーワード")).toBe(false);
  });
});

describe("sortSeedSpots", () => {
  it("カテゴリ順(venue→seichi→food→goods→other)で並べる", () => {
    const sorted = sortSeedSpots([GOODS, SEICHI, VENUE_A]);
    expect(sorted.map((s) => s.category)).toEqual(["venue", "seichi", "goods"]);
  });

  it("同カテゴリ内は名前順(localeCompare ja)", () => {
    const sorted = sortSeedSpots([VENUE_A, VENUE_B]);
    // "東京ドーム".localeCompare("横浜アリーナ", "ja") > 0 のため「横浜アリーナ」が先になる
    expect(sorted.map((s) => s.id)).toEqual(["seed-b", "seed-a"]);
  });

  it("入力配列を破壊しない", () => {
    const input = [GOODS, VENUE_A];
    sortSeedSpots(input);
    expect(input).toEqual([GOODS, VENUE_A]);
  });
});

describe("searchSeedSpots", () => {
  const all = [VENUE_A, VENUE_B, SEICHI, GOODS];

  it("カテゴリ'all'かつ空キーワードは全件を並び順どおり返す", () => {
    const result = searchSeedSpots(all, "", "all");
    // venueカテゴリ内は名前順(localeCompare ja)で「横浜アリーナ」→「東京ドーム」
    expect(result.map((s) => s.id)).toEqual(["seed-b", "seed-a", "seed-c", "seed-d"]);
  });

  it("カテゴリで絞り込む", () => {
    const result = searchSeedSpots(all, "", "venue");
    expect(result.map((s) => s.category)).toEqual(["venue", "venue"]);
  });

  it("キーワードとカテゴリを両方適用する", () => {
    const result = searchSeedSpots(all, "横浜", "venue");
    expect(result.map((s) => s.id)).toEqual(["seed-b"]);
  });

  it("該当なしは空配列", () => {
    expect(searchSeedSpots(all, "存在しない", "all")).toEqual([]);
  });
});
