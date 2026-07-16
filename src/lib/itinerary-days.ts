/**
 * S3c(旅程タブ)の日リスト生成ロジック。
 * 参照: docs/design/screens/S3c_旅程スポット.md「レイアウト」「DayBlock」
 *
 * `days`はitinerary_entriesストアから取得するのではなく、
 * しおりの`start_date`〜`end_date`をUI側で日付順に列挙して生成する(仕様どおり)。
 * 型上は`string | null`のため、いずれかが`null`、または`end_date`が
 * `start_date`より前(イレギュラーなデータ)の場合はランタイムエラー・無限ループを
 * 避けるため`null`を返し、呼び出し側で「日程が設定されていません」フォールバック表示に切り替える。
 */
import type { ItineraryEntry } from "@/types/shiori";

const WEEKDAY_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;

/**
 * 安全弁: 1年分(366日)を超える日リストは生成しない。
 * S2で日程は必須入力のため通常は起こらないが、不正データによる
 * 無限ループ・過大なDOM生成を避けるための防御。
 */
const MAX_ITINERARY_DAYS = 366;

export interface ItineraryDayInfo {
  /** "YYYY-MM-DD" */
  date: string;
  /** 1始まりの日数(「1日目」の1) */
  dayIndex: number;
  /** 表示用ラベル。例: 「1日目 8/1(土)」 */
  label: string;
}

export interface ItineraryDayGroup extends ItineraryDayInfo {
  entries: ItineraryEntry[];
}

/** "YYYY-MM-DD" をローカルタイムゾーンの Date に変換する(UTC変換によるズレを避ける)。 */
function parseYmd(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** ローカルタイムゾーンの Date を "YYYY-MM-DD" に整形する。 */
function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 「{n}日目 {M/D}({曜日})」形式のラベルを作る。例: 「1日目 8/1(土)」 */
export function formatDayLabel(dayIndex: number, dateStr: string): string {
  const date = parseYmd(dateStr);
  return `${dayIndex}日目 ${date.getMonth() + 1}/${date.getDate()}(${WEEKDAY_JA[date.getDay()]})`;
}

/**
 * しおりの`start_date`〜`end_date`から日リストを生成する(日付順)。
 * どちらかが`null`、または`end_date`が`start_date`より前の場合は`null`を返す。
 */
export function buildItineraryDayList(
  startDate: string | null,
  endDate: string | null,
): ItineraryDayInfo[] | null {
  if (!startDate || !endDate) {
    return null;
  }
  if (endDate < startDate) {
    return null;
  }

  const days: ItineraryDayInfo[] = [];
  const cursor = parseYmd(startDate);
  let dayIndex = 1;

  while (days.length < MAX_ITINERARY_DAYS) {
    const dateStr = toYmd(cursor);
    days.push({ date: dateStr, dayIndex, label: formatDayLabel(dayIndex, dateStr) });
    if (dateStr === endDate) {
      break;
    }
    cursor.setDate(cursor.getDate() + 1);
    dayIndex += 1;
  }

  return days;
}

/** 日リストに、対応する`itinerary_entries`(sort_order昇順)を割り当てる。 */
export function groupEntriesByDay(
  days: ItineraryDayInfo[],
  entries: ItineraryEntry[],
): ItineraryDayGroup[] {
  return days.map((day) => ({
    ...day,
    entries: entries
      .filter((entry) => entry.day_date === day.date)
      .sort((a, b) => a.sort_order - b.sort_order),
  }));
}
