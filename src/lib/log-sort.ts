/**
 * S3d(ログタブ)の並び順ロジック(仮置き。仕様書「並び順」欄・完了報告にも明記)。
 * 参照: docs/design/screens/S3d_ログ.md「並び順」
 *
 * - 日付グループは`day_date`の昇順(古い日付が先)
 * - `day_date`未設定は「日付未設定」グループとして最後にまとめる
 * - 各グループ内は`sort_key`(保存済み写真は`created_at`、処理中の項目は選択順の仮キー)の昇順
 *
 * 日付見出しの整形("8/15(土)"形式)は`S3b_TODO.md`の期限日表示と同じ形式のため、
 * `src/lib/todo-sort.ts`の`formatDueDate`をそのまま再利用する(重複実装しない)。
 */
import { formatDueDate } from "./todo-sort";

/** 日付未設定グループの内部キー。`day_date`としては存在しない値のため衝突しない。 */
const UNSET_KEY = "unset";

/** 日付未設定グループの見出し文言(仕様の文言一覧どおり)。 */
export const UNSET_DATE_LABEL = "日付未設定";

export interface LogGroup<T> {
  /** グループの一意キー("YYYY-MM-DD" または未設定グループの場合は"unset")。 */
  key: string;
  /** 見出し表示文言。 */
  label: string;
  items: T[];
}

export interface LogGroupable {
  day_date: string | null;
  /** グループ内の並び順を決める昇順キー(ISO日時文字列など、文字列比較で正しく並ぶもの)。 */
  sort_key: string;
}

/**
 * ログ項目を日付グループに分け、仕様どおりの並び順(グループ: 日付昇順→未設定は最後、
 * グループ内: sort_key昇順)で返す。
 */
export function groupLogsByDay<T extends LogGroupable>(items: T[]): LogGroup<T>[] {
  const buckets = new Map<string, T[]>();
  for (const item of items) {
    const key = item.day_date ?? UNSET_KEY;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(item);
    } else {
      buckets.set(key, [item]);
    }
  }

  const sortWithinGroup = (group: T[]) =>
    [...group].sort((a, b) => a.sort_key.localeCompare(b.sort_key));

  const dateKeys = [...buckets.keys()].filter((key) => key !== UNSET_KEY).sort();

  const groups: LogGroup<T>[] = dateKeys.map((key) => ({
    key,
    label: formatDueDate(key),
    items: sortWithinGroup(buckets.get(key) ?? []),
  }));

  const unsetItems = buckets.get(UNSET_KEY);
  if (unsetItems) {
    groups.push({
      key: UNSET_KEY,
      label: UNSET_DATE_LABEL,
      items: sortWithinGroup(unsetItems),
    });
  }

  return groups;
}
