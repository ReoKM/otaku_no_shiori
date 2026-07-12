/**
 * S3c(旅程タブ)の予定追加/編集フォームのバリデーション。
 * 文言は docs/design/screens/S3c_旅程スポット.md「文言一覧」に厳密に合わせる。
 *
 * 文字数上限(タイトル30文字/場所名50文字/メモ100文字)は仕様に数値記載が無いため仮置き。
 * S3c仕様「不明点・仮置き」に明記のとおり、S2/S3a/S3bの前例(タイトル系30文字)に揃え、
 * 場所名・メモはそれより長い情報を想定し50文字・100文字とした。
 * 上限超過の専用エラー文言は仕様に無いため、入力欄の`maxLength`属性でタイプ自体を防ぐ
 * 運用とし、ここでは空入力(trim後)の判定のみ行う。
 */
export const ITINERARY_TITLE_MAX_LENGTH = 30;
export const ITINERARY_PLACE_NAME_MAX_LENGTH = 50;
export const ITINERARY_MEMO_MAX_LENGTH = 100;

/** タイトルをtrim()し、空ならエラー文言を返す。問題なければnullを返す。 */
export function validateItineraryTitle(title: string): string | null {
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    return "予定のタイトルを入れてください";
  }
  return null;
}
