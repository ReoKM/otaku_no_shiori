/**
 * S3c「行きたい場所」セクションの一覧表示用データ解決ロジック。
 * 参照: docs/design/screens/S3c_旅程スポット.md「SpotSection」「SpotRow(1行)」
 *
 * `shiori_spots`(紐付け、guest-store.ts)は名前・カテゴリ等の実体を持たないため、
 * シードスポット(同梱JSON、`seed-spots.ts`)またはUGCスポット(`spots`ストア)から
 * 実体情報を解決して1行分の表示データ(`ResolvedSpotRow`)を組み立てる。
 *
 * UIから独立した純粋関数として切り出し、ユニットテスト(spot-list.test.ts)で担保する。
 */
import { getSeedSpotById } from "./seed-spots";
import type { ShioriSpot, Spot } from "@/types/shiori";

export interface ResolvedSpotRow {
  spotId: string;
  name: string;
  description: string | null;
  category: string | null;
  area: string | null;
  /** シードスポットのみ設定されうる(UGCスポットは`caution`列を持たない)。 */
  caution: string | null;
  /** しおり内メモ(`shiori_spots.memo`)。 */
  memo: string | null;
  isVisited: boolean;
  /**
   * true: 自由入力(UGC)スポット。削除時は`spots`ストア本体も削除する対象。
   * false: シードスポット(同梱JSON参照。`spots`ストアに実体を持たない)。
   */
  isUgc: boolean;
}

/** `listSpots()`の結果からid引きのMapを作る(呼び出し側で1回だけ構築して使い回す想定)。 */
export function buildUgcSpotMap(spots: Spot[]): Map<string, Spot> {
  return new Map(spots.map((spot) => [spot.id, spot]));
}

const UNKNOWN_SPOT_NAME = "(不明なスポット)";

/**
 * `shiori_spots`の紐付け一覧を、表示用の`ResolvedSpotRow`一覧に変換する。
 * 各紐付けのspot_idについて、まずシードスポットを検索し、無ければ`ugcSpotsById`から解決する。
 * どちらにも存在しない場合(削除済み等の不整合データ)は名前不明の行として扱う
 * (ランタイムエラーで一覧全体が壊れるのを防ぐ)。
 */
export function resolveSpotRows(
  shioriSpots: ShioriSpot[],
  ugcSpotsById: Map<string, Spot>,
): ResolvedSpotRow[] {
  return shioriSpots.map((shioriSpot) => {
    const seed = getSeedSpotById(shioriSpot.spot_id);
    if (seed) {
      return {
        spotId: shioriSpot.spot_id,
        name: seed.name,
        description: seed.description,
        category: seed.category,
        area: seed.area,
        caution: seed.caution ?? null,
        memo: shioriSpot.memo,
        isVisited: shioriSpot.is_visited,
        isUgc: false,
      };
    }

    const ugc = ugcSpotsById.get(shioriSpot.spot_id);
    return {
      spotId: shioriSpot.spot_id,
      name: ugc?.name ?? UNKNOWN_SPOT_NAME,
      description: ugc?.description ?? null,
      category: ugc?.category ?? null,
      area: ugc?.area ?? null,
      caution: null,
      memo: shioriSpot.memo,
      isVisited: shioriSpot.is_visited,
      isUgc: true,
    };
  });
}
