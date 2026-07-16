import { describe, expect, it } from "vitest";
import { getSeedSpotById, isSeedSpotId, SEED_SPOTS } from "./seed-spots";

describe("SEED_SPOTS", () => {
  it("1件以上のシードスポットを読み込む", () => {
    expect(SEED_SPOTS.length).toBeGreaterThan(0);
  });

  it("全件が`seed-`プレフィックス付きidを持つ(自由入力UUIDと衝突させないため)", () => {
    for (const spot of SEED_SPOTS) {
      expect(spot.id.startsWith("seed-")).toBe(true);
    }
  });

  it("idが重複しない", () => {
    const ids = SEED_SPOTS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("必須フィールド(name/description/category/area/map_query/source/refs)が全件そろっている", () => {
    for (const spot of SEED_SPOTS) {
      expect(spot.name.length).toBeGreaterThan(0);
      expect(spot.description.length).toBeGreaterThan(0);
      expect(["venue", "seichi", "food", "goods", "other"]).toContain(spot.category);
      expect(spot.area.length).toBeGreaterThan(0);
      expect(spot.map_query.length).toBeGreaterThan(0);
      expect(spot.source).toBe("seed");
      expect(Array.isArray(spot.refs)).toBe(true);
      expect(spot.refs.length).toBeGreaterThan(0);
    }
  });
});

describe("getSeedSpotById", () => {
  it("存在するidはそのスポットを返す", () => {
    const first = SEED_SPOTS[0];
    expect(getSeedSpotById(first.id)).toEqual(first);
  });

  it("存在しないidはundefinedを返す", () => {
    expect(getSeedSpotById("seed-does-not-exist")).toBeUndefined();
  });
});

describe("isSeedSpotId", () => {
  it("シードスポットのidはtrue", () => {
    expect(isSeedSpotId(SEED_SPOTS[0].id)).toBe(true);
  });

  it("UGCスポットのUUID等はfalse", () => {
    expect(isSeedSpotId("11111111-2222-3333-4444-555555555555")).toBe(false);
  });
});
