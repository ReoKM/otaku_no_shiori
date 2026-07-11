/**
 * S2(しおり作成)フォームのバリデーションロジック。
 * 文言は docs/design/screens/S2_しおり作成.md の「バリデーション文言」表に厳密に合わせる。
 *
 * 文字数上限(タイトル30文字/目的50文字)は仕様書側で「仮置き」と明記されている値。
 */
import type { TripType } from "@/types/shiori";

export const SHIORI_TITLE_MAX_LENGTH = 30;
export const SHIORI_PURPOSE_MAX_LENGTH = 50;

export interface ShioriFormValues {
  title: string;
  startDate: string;
  endDate: string;
  tripType: TripType | null;
  purpose: string;
}

export interface ShioriFormErrors {
  title?: string;
  startDate?: string;
  endDate?: string;
  tripType?: string;
  purpose?: string;
}

/**
 * フォーム値を検証しエラー一覧を返す。
 * S2仕様: バリデーションは送信ボタン押下時にまとめて実行する。
 */
export function validateShioriForm(values: ShioriFormValues): ShioriFormErrors {
  const errors: ShioriFormErrors = {};
  // 保存時はtrim後の値を保存するため、文字数判定もtrim後の長さで行う
  // (前後スペース込みで上限を超える有効な入力を不当に弾かないため)。
  const trimmedTitle = values.title.trim();
  const trimmedPurpose = values.purpose.trim();

  if (trimmedTitle.length === 0) {
    errors.title = "タイトルを入れてください";
  } else if (trimmedTitle.length > SHIORI_TITLE_MAX_LENGTH) {
    errors.title = "タイトルは30文字以内で入力してください";
  }

  if (!values.startDate) {
    errors.startDate = "開始日を選択してください";
  }

  if (!values.endDate) {
    errors.endDate = "終了日を選択してください";
  } else if (values.startDate && values.endDate < values.startDate) {
    errors.endDate = "終了日は開始日以降の日付にしてください";
  }

  if (!values.tripType) {
    errors.tripType = "遠征タイプを選んでください";
  }

  if (trimmedPurpose.length > SHIORI_PURPOSE_MAX_LENGTH) {
    errors.purpose = "目的は50文字以内で入力してください";
  }

  return errors;
}

/** 表示順(スクロール先の判定にも使う)。 */
export const SHIORI_FORM_FIELD_ORDER = [
  "title",
  "startDate",
  "endDate",
  "tripType",
  "purpose",
] as const satisfies readonly (keyof ShioriFormErrors)[];

export function hasShioriFormErrors(errors: ShioriFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** エラーがある項目のうち、表示順で最初のフィールド名を返す(スクロール対象の判定用)。 */
export function firstShioriFormErrorField(
  errors: ShioriFormErrors,
): (typeof SHIORI_FORM_FIELD_ORDER)[number] | null {
  for (const field of SHIORI_FORM_FIELD_ORDER) {
    if (errors[field]) {
      return field;
    }
  }
  return null;
}
