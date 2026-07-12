/**
 * S3d(ログタブ)のキャプション(ひとことメモ)バリデーション。
 * 参照: docs/design/screens/S3d_ログ.md「LogPhotoCardEditing(編集モード)」「キャプション文字数超過」
 *
 * 文字数上限50文字は仕様に数値指定が無いため、`S2_しおり作成.md`の「目的」欄と同水準で仮置き
 * (S3d仕様「不明点・仮置き」欄にも明記されている)。
 * キャプションはTODOラベル等と異なり任意項目のため、空文字は許容し(null化する)、
 * 「未入力ならエラー」という検証は行わない。
 */
export const PHOTO_CAPTION_MAX_LENGTH = 50;

/**
 * キャプション入力値をtrim()し、50文字を超える分は切り詰める。
 * trim後に空文字ならnull(未設定)を返す。
 */
export function sanitizeCaption(value: string): string | null {
  const trimmed = value.trim().slice(0, PHOTO_CAPTION_MAX_LENGTH);
  return trimmed.length === 0 ? null : trimmed;
}
