/**
 * S3b2(やることタブ内「予算」セクション)のバリデーション・表示フォーマット。
 * 文言・数値上限は docs/design/screens/S3b2_予算.md「金額の表示・入力規則」に厳密に合わせる。
 *
 * 費目件数上限20件・費目名20文字・メモ200文字・金額上限9,999,999円は
 * S3b2仕様「不明点・仮置き」に明記された仮置き値をそのまま採用する。
 */

/** 費目名の最大文字数。 */
export const BUDGET_LABEL_MAX_LENGTH = 20;

/** メモの最大文字数。 */
export const BUDGET_MEMO_MAX_LENGTH = 200;

/** 総額・費目とも共通の金額上限(7桁)。 */
export const BUDGET_AMOUNT_MAX = 9_999_999;

/** 費目件数の上限。 */
export const BUDGET_ITEM_COUNT_MAX = 20;

/**
 * 費目名をtrim()し、空ならエラー文言を返す。問題なければnullを返す。
 * 最大文字数(20文字)は入力欄側の`maxLength`属性でタイプ自体を防ぐ運用とし
 * (`todo-validation.ts`と同じ考え方)、専用のエラー文言はS3b2仕様に記載が無いためここでは持たない。
 */
export function validateBudgetLabel(label: string): string | null {
  const trimmed = label.trim();
  if (trimmed.length === 0) {
    return "費目名を入れてください";
  }
  return null;
}

/**
 * 金額の入力文字列を検証する。
 * `inputMode="numeric"`前提のため、呼び出し側は`normalizeAmountInput`で
 * 全角→半角変換・数字以外の除去を済ませた文字列を渡す想定。
 * 空文字・数字以外・マイナス・桁超過をエラーとする。
 */
export function validateBudgetAmount(value: string): string | null {
  if (value.trim().length === 0 || !/^\d+$/.test(value)) {
    return "金額を数字で入れてください";
  }
  const amount = Number(value);
  if (amount > BUDGET_AMOUNT_MAX) {
    return "金額は9,999,999円までです";
  }
  return null;
}

/** メモの文字数が上限を超えているか。 */
export function isBudgetMemoTooLong(memo: string): boolean {
  return memo.length > BUDGET_MEMO_MAX_LENGTH;
}

/**
 * 入力欄の生値から、数字以外を破棄した文字列を作る。
 * 全角数字は半角へ変換してから数字以外を除去する(「入力欄」規則)。
 */
export function normalizeAmountInput(raw: string): string {
  const halfWidth = raw.replace(/[０-９]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0xfee0),
  );
  return halfWidth.replace(/[^\d]/g, "");
}

/** 円表記でフォーマットする(半角「¥」+3桁カンマ区切り)。例: `formatYen(12800)` → `"¥12,800"` */
export function formatYen(amount: number): string {
  return `¥${amount.toLocaleString("en-US")}`;
}
