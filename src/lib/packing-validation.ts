/**
 * S3a(持ち物タブ)のラベル入力バリデーション。
 * 参照: docs/design/screens/S3a_持ち物.md「AddForm」「タップ時の挙動」
 *
 * 文字数上限(30文字)はS2のタイトル上限に揃えた仮置き値。仕様書は上限超過時の
 * 専用エラー文言を定義していないため、入力欄の maxLength 属性で打鍵時に制限する運用とし、
 * ここではtrim()後が空文字かどうかのみを検証する。
 */
export const PACKING_LABEL_MAX_LENGTH = 30;

export const PACKING_LABEL_REQUIRED_ERROR = "持ち物の名前を入れてください";

/**
 * 持ち物ラベルを検証する。trim()した結果が空ならエラー文言を返し、問題なければnullを返す。
 * 追加フォーム・行編集の両方で共通利用する(保存時もtrim後の文字列を保存する仕様のため)。
 */
export function validatePackingLabel(value: string): string | null {
  if (value.trim().length === 0) {
    return PACKING_LABEL_REQUIRED_ERROR;
  }
  return null;
}
