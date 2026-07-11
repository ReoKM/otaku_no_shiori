/**
 * S3b(TODOタブ)追加フォーム/編集のラベルバリデーション。
 * 文言は docs/design/screens/S3b_TODO.md「文言一覧」に厳密に合わせる。
 *
 * 文字数上限30文字は仕様に数値記載が無いため仮置き(S3a_持ち物.md/S2_しおり作成.mdと揃えた)。
 * 上限超過時の専用エラー文言はS3b仕様に記載が無いため、入力欄側の`maxLength`属性でタイプ自体を防ぐ
 * 運用とし、ここでは空入力(trim後)の判定のみ行う。
 */
export const TODO_LABEL_MAX_LENGTH = 30;

/** ラベルをtrim()し、空ならエラー文言を返す。問題なければnullを返す。 */
export function validateTodoLabel(label: string): string | null {
  const trimmed = label.trim();
  if (trimmed.length === 0) {
    return "TODOの名前を入れてください";
  }
  return null;
}
