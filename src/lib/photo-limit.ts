/**
 * S3d(ログタブ)の写真枚数上限まわりの純粋関数。
 * 参照: docs/design/screens/S3d_ログ.md「状態」「文言一覧」、CLAUDE.md無料枠ガードレール
 * (写真上限は環境変数でのみ変更可・ユーザー設定不可)。
 */

/** 1しおりあたりの写真上限の既定値(F6仕様の既定値)。 */
export const DEFAULT_MAX_PHOTOS_PER_SHIORI = 20;

/**
 * `NEXT_PUBLIC_MAX_PHOTOS_PER_SHIORI` から上限枚数を取得する。
 * 未設定・不正な値(数値でない/0以下)の場合は既定値20を返す。
 */
export function getMaxPhotosPerShiori(): number {
  const raw = process.env.NEXT_PUBLIC_MAX_PHOTOS_PER_SHIORI;
  if (!raw) {
    return DEFAULT_MAX_PHOTOS_PER_SHIORI;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_MAX_PHOTOS_PER_SHIORI;
  }
  return parsed;
}

export interface AcceptableCountResult {
  /** 実際に取り込む枚数。 */
  accepted: number;
  /** 上限超過のため取り込まなかった枚数。 */
  rejected: number;
}

/**
 * 選択されたファイル枚数のうち、上限までの残り枠数分のみを受け入れる。
 * `currentUsed`には保存済み写真数に加え、処理中(まだ保存されていない)の枚数も
 * 含めて渡すこと(同時に複数回選択された場合の上限超過を防ぐため)。
 */
export function computeAcceptableCount(
  currentUsed: number,
  selectedCount: number,
  max: number,
): AcceptableCountResult {
  const remaining = Math.max(0, max - currentUsed);
  const accepted = Math.min(selectedCount, remaining);
  return { accepted, rejected: selectedCount - accepted };
}
