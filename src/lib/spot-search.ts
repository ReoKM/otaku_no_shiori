/**
 * S4(スポット検索)の検索・絞り込み・並べ替えロジック。
 * 参照: docs/design/screens/S4_スポット検索.md「並び順(仮置き)」「タップ時の挙動」
 *
 * UIから独立した純粋関数として切り出し、ユニットテスト(spot-search.test.ts)で担保する。
 */
import { getSpotCategoryRank } from "./spot-category";
import type { SeedSpot } from "./seed-spots";

/** カテゴリフィルターチップの値。「すべて」は"all"。 */
export type SpotCategoryFilter = "all" | SeedSpot["category"];

/**
 * キーワードが名前・エリア・説明文のいずれかに部分一致するか判定する(大文字小文字を区別しない)。
 * キーワードが空(trim後)の場合は常にtrueを返す(絞り込みなし)。
 * 参照: S4仕様「検索バーへの入力…名前・エリア・説明文に部分一致」
 */
export function matchesSpotKeyword(spot: SeedSpot, keyword: string): boolean {
  const trimmed = keyword.trim().toLowerCase();
  if (trimmed.length === 0) {
    return true;
  }
  return (
    spot.name.toLowerCase().includes(trimmed) ||
    spot.area.toLowerCase().includes(trimmed) ||
    spot.description.toLowerCase().includes(trimmed)
  );
}

/**
 * カテゴリ順(venue→seichi→food→goods→other)→名前順(`localeCompare('ja')`)で並べ替える。
 * 参照: S4仕様「並び順(仮置き)」
 */
export function sortSeedSpots(spots: SeedSpot[]): SeedSpot[] {
  return [...spots].sort((a, b) => {
    const rankDiff = getSpotCategoryRank(a.category) - getSpotCategoryRank(b.category);
    if (rankDiff !== 0) {
      return rankDiff;
    }
    return a.name.localeCompare(b.name, "ja");
  });
}

/**
 * キーワード・カテゴリで絞り込み、並び順を適用した結果を返す。
 * S4の一覧画面(初期表示・入力の都度のリアルタイム絞り込み)で使う。
 */
export function searchSeedSpots(
  spots: SeedSpot[],
  keyword: string,
  category: SpotCategoryFilter,
): SeedSpot[] {
  const filtered = spots.filter(
    (spot) => (category === "all" || spot.category === category) && matchesSpotKeyword(spot, keyword),
  );
  return sortSeedSpots(filtered);
}
