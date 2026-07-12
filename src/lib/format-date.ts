/**
 * S1(一覧)のしおりカードで使う日程表示の整形ロジック。
 * `start_date`/`end_date` は `<input type="date">` 由来の "YYYY-MM-DD" 形式を想定する。
 * 参照: docs/design/screens/S1_ホーム一覧.md「ShioriCard」
 */

/** "YYYY-MM-DD" を "YYYY/MM/DD" に変換する。 */
export function formatYmd(dateStr: string): string {
  return dateStr.replaceAll("-", "/");
}

/**
 * 開始日・終了日を「2026/08/01〜2026/08/02」形式にまとめる。
 * 開始日=終了日の場合は「2026/08/01」のみ。両方nullの場合はnullを返す。
 */
export function formatDateRange(
  startDate: string | null,
  endDate: string | null,
): string | null {
  if (!startDate && !endDate) {
    return null;
  }
  if (startDate && endDate) {
    return startDate === endDate
      ? formatYmd(startDate)
      : `${formatYmd(startDate)}〜${formatYmd(endDate)}`;
  }
  return formatYmd((startDate ?? endDate) as string);
}
