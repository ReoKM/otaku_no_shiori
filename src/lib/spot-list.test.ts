import { describe, expect, it } from "vitest";
import { SEED_SPOTS } from "./seed-spots";
import { buildUgcSpotMap, resolveSpotRows } from "./spot-list";
import type { ShioriSpot, Spot } from "@/types/shiori";

function ugcSpot(overrides: Partial<Spot> & Pick<Spot, "id" | "name">): Spot {
  return {
    description: null,
    category: null,
    area: null,
    source: "ugc",
    status: "private",
    created_at: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

function shioriSpot(overrides: Partial<ShioriSpot> & Pick<ShioriSpot, "spot_id">): ShioriSpot {
  return {
    shiori_id: "shiori-1",
    memo: null,
    is_visited: false,
    ...overrides,
  };
}

describe("resolveSpotRows", () => {
  it("シードスポットのidはseed-spots.tsのデータから名前・カテゴリ等を解決する", () => {
    const seed = SEED_SPOTS[0];
    const rows = resolveSpotRows([shioriSpot({ spot_id: seed.id, memo: "開演前に寄る" })], new Map());

    expect(rows).toEqual([
      {
        spotId: seed.id,
        name: seed.name,
        description: seed.description,
        category: seed.category,
        area: seed.area,
        caution: seed.caution ?? null,
        memo: "開演前に寄る",
        isVisited: false,
        isUgc: false,
      },
    ]);
  });

  it("UGCスポットのidはugcSpotsByIdから解決し、isUgc=trueになる", () => {
    const spot = ugcSpot({ id: "ugc-1", name: "推しの聖地", description: "作中の舞台" });
    const map = buildUgcSpotMap([spot]);
    const rows = resolveSpotRows([shioriSpot({ spot_id: "ugc-1" })], map);

    expect(rows).toEqual([
      {
        spotId: "ugc-1",
        name: "推しの聖地",
        description: "作中の舞台",
        category: null,
        area: null,
        caution: null,
        memo: null,
        isVisited: false,
        isUgc: true,
      },
    ]);
  });

  it("UGCスポットは常にcaution=null(spots型にcaution列が無いため)", () => {
    const map = buildUgcSpotMap([ugcSpot({ id: "ugc-2", name: "テスト" })]);
    const rows = resolveSpotRows([shioriSpot({ spot_id: "ugc-2" })], map);
    expect(rows[0].caution).toBeNull();
  });

  it("どちらにも存在しないid(不整合データ)は名前不明として扱い、例外を投げない", () => {
    const rows = resolveSpotRows([shioriSpot({ spot_id: "missing-id" })], new Map());
    expect(rows[0].name).toBe("(不明なスポット)");
  });

  it("is_visited/memoはshiori_spots側の値をそのまま使う", () => {
    const map = buildUgcSpotMap([ugcSpot({ id: "ugc-3", name: "行った場所" })]);
    const rows = resolveSpotRows(
      [shioriSpot({ spot_id: "ugc-3", is_visited: true, memo: "楽しかった" })],
      map,
    );
    expect(rows[0].isVisited).toBe(true);
    expect(rows[0].memo).toBe("楽しかった");
  });

  it("複数件を渡した場合、順序を保ったまま解決する", () => {
    const seed = SEED_SPOTS[0];
    const map = buildUgcSpotMap([ugcSpot({ id: "ugc-4", name: "自由入力" })]);
    const rows = resolveSpotRows(
      [shioriSpot({ spot_id: "ugc-4" }), shioriSpot({ spot_id: seed.id })],
      map,
    );
    expect(rows.map((r) => r.spotId)).toEqual(["ugc-4", seed.id]);
  });
});

describe("buildUgcSpotMap", () => {
  it("idをキーにしたMapを作る", () => {
    const spot = ugcSpot({ id: "ugc-5", name: "テスト" });
    const map = buildUgcSpotMap([spot]);
    expect(map.get("ugc-5")).toEqual(spot);
    expect(map.size).toBe(1);
  });
});
