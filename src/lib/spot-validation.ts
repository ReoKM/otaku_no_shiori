/**
 * S3c(旅程タブ)「行きたい場所」セクションの自由入力フォームのバリデーション。
 * 文言は docs/design/screens/S3c_旅程スポット.md「文言一覧」に厳密に合わせる。
 *
 * 文字数上限(スポット名30文字/メモ100文字)は仕様に数値記載が無いため仮置き。
 * S3c仕様「不明点・仮置き」に明記のとおり、S2/S3a/S3b/旅程タイトルの前例(30文字)に揃えた。
 */
export const SPOT_NAME_MAX_LENGTH = 30;
export const SPOT_MEMO_MAX_LENGTH = 100;

/** スポット名をtrim()し、空ならエラー文言を返す。問題なければnullを返す。 */
export function validateSpotName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return "スポット名を入れてください";
  }
  return null;
}
