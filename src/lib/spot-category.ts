/**
 * F5(行きたいスポット)のカテゴリ表示名・並び順。
 * 参照: docs/design/screens/S3c_旅程スポット.md「カテゴリ表示名」
 * 参照: docs/design/screens/S4_スポット検索.md「並び順(仮置き)」
 *
 * S3c(SpotRowのカテゴリバッジ)・S4(CategoryChips/SpotCard/一覧の並び順)の両方で使う。
 */
import type { SeedSpotCategory } from "./seed-spots";

/** S4一覧の並び順(仮置き): venue→seichi→food→goods→other。`seed-spot`スキルの列挙順のまま採用。 */
export const SPOT_CATEGORY_ORDER: SeedSpotCategory[] = ["venue", "seichi", "food", "goods", "other"];

export const SPOT_CATEGORY_LABELS: Record<SeedSpotCategory, string> = {
  venue: "会場",
  seichi: "聖地",
  food: "グルメ",
  goods: "グッズ",
  other: "その他",
};

function isSpotCategory(value: string): value is SeedSpotCategory {
  return (SPOT_CATEGORY_ORDER as string[]).includes(value);
}

/** カテゴリ値から表示名を返す。未設定・未知の値の場合は`undefined`。 */
export function getSpotCategoryLabel(category: string | null | undefined): string | undefined {
  if (!category || !isSpotCategory(category)) {
    return undefined;
  }
  return SPOT_CATEGORY_LABELS[category];
}

/**
 * 並び順比較用のランクを返す(`SPOT_CATEGORY_ORDER`のインデックス)。
 * 未設定・未知の値は最後尾扱いにする(indexOfが-1になる場合は配列長を返す)。
 */
export function getSpotCategoryRank(category: string | null | undefined): number {
  if (!category) {
    return SPOT_CATEGORY_ORDER.length;
  }
  const index = (SPOT_CATEGORY_ORDER as string[]).indexOf(category);
  return index === -1 ? SPOT_CATEGORY_ORDER.length : index;
}
