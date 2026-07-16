/**
 * S3c(旅程タブ)の並べ替え・日付変更ロジック。
 * 参照: docs/design/screens/S3c_旅程スポット.md
 * 「EntryRowSortMode(並べ替えモード、1行)」「EntryRow(編集中)」の日付変更プルダウン
 *
 * UIから独立した純粋関数として切り出し、ユニットテスト(itinerary-sort.test.ts)で担保する。
 * 旅程の並べ替えは「同じ日の中でのみ」有効(日をまたぐ並べ替えは不可、TODOの
 * グループ境界と同様のパターン)。日付変更は編集フォームのプルダウンからのみ可能。
 */
import type { ItineraryEntry } from "@/types/shiori";

/** `dayEntries`(同じ日の、sort_order昇順の配列)の`index`番目が上へ移動できるか。 */
export function canMoveUpInDay(dayEntries: ItineraryEntry[], index: number): boolean {
  return index > 0 && index < dayEntries.length;
}

/** `dayEntries`(同じ日の、sort_order昇順の配列)の`index`番目が下へ移動できるか。 */
export function canMoveDownInDay(dayEntries: ItineraryEntry[], index: number): boolean {
  return index >= 0 && index < dayEntries.length - 1;
}

/**
 * `dayEntries`内で`index`番目の項目を1つ上/下へ移動する。
 * 移動できない場合(先頭の上移動・末尾の下移動)は`null`を返す。
 * 戻り値は入れ替え後の配列(sort_orderの更新は呼び出し側の責務)。
 */
export function moveEntryInDay(
  dayEntries: ItineraryEntry[],
  index: number,
  direction: "up" | "down",
): ItineraryEntry[] | null {
  const movable = direction === "up" ? canMoveUpInDay(dayEntries, index) : canMoveDownInDay(dayEntries, index);
  if (!movable) {
    return null;
  }
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  const next = [...dayEntries];
  const tmp = next[index];
  next[index] = next[targetIndex];
  next[targetIndex] = tmp;
  return next;
}

/**
 * `entries`全体のうち、`dayDate`に属し`excludeId`を除いたものを
 * sort_order昇順のid配列で返す(削除後・日付変更後の残りを詰め直す際に使う)。
 */
export function sameDayIdsExcluding(
  entries: ItineraryEntry[],
  dayDate: string,
  excludeId: string,
): string[] {
  return entries
    .filter((entry) => entry.day_date === dayDate && entry.id !== excludeId)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((entry) => entry.id);
}

export interface DayChangePlan {
  /** 移動先の日での新しいsort_order(末尾に割り当てる)。 */
  newSortOrder: number;
  /**
   * 移動元の日に残る項目を0始まり連番に振り直すためのid配列(sort_order昇順)。
   * 日が変わらない場合は空配列(呼び出し不要)。
   */
  oldDayOrderedIds: string[];
}

/**
 * エントリーの日付(day_date)を変更する際、移動先の日の末尾sort_orderと
 * 移動元の日に残る項目の詰め直し計画を計算する。
 * (S3c仕様「移動先の日では末尾のsort_orderを割り当てる」に対応。
 * 移動元の日のsort_orderに欠番ができるのを防ぐため、あわせて詰め直す)
 */
export function computeDayChangePlan(
  entries: ItineraryEntry[],
  entryId: string,
  newDayDate: string,
): DayChangePlan {
  const current = entries.find((entry) => entry.id === entryId);
  const oldDayDate = current?.day_date;

  const newSortOrder = entries.filter(
    (entry) => entry.day_date === newDayDate && entry.id !== entryId,
  ).length;

  const oldDayOrderedIds =
    oldDayDate && oldDayDate !== newDayDate ? sameDayIdsExcluding(entries, oldDayDate, entryId) : [];

  return { newSortOrder, oldDayOrderedIds };
}
