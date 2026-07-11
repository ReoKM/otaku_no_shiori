/**
 * S3b(TODOタブ)のソート規則・期限当日判定・並べ替えモードのグループ境界ロジック。
 * 参照: docs/design/screens/S3b_TODO.md「ソート規則」「TodoRowSortMode」「期限当日の強調表示」
 *
 * UIから独立した純粋関数として切り出し、ユニットテスト(todo-sort.test.ts)で担保する。
 */
import type { Todo } from "@/types/shiori";

const WEEKDAY_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;

/**
 * 実行環境のローカル日付を "YYYY-MM-DD" で返す。
 * `due_date` は `<input type="date">` 由来のローカル日付文字列のため、
 * UTC変換(`toISOString`等)を使うとタイムゾーンによって日付がずれる。
 * そのため `Date` のローカルgetter(`getFullYear`/`getMonth`/`getDate`)のみを使う。
 */
export function todayYmd(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * 期限日が「本日」と一致するかどうか判定する(完了済みかどうかは見ない。呼び出し側で`is_done`と組み合わせる)。
 * `todayStr`省略時は実行時点のローカル日付を使う。
 */
export function isDueToday(dueDate: string | null, todayStr: string = todayYmd()): boolean {
  return dueDate !== null && dueDate === todayStr;
}

/**
 * "YYYY-MM-DD" を「8/15(土)」形式に整形する(月/日+曜日、年は表示しない)。
 * UTC変換によるズレを避けるため、年月日を分解して`Date`のローカルコンストラクタに渡す。
 */
export function formatDueDate(dueDate: string): string {
  const [y, m, d] = dueDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${m}/${d}(${WEEKDAY_JA[date.getDay()]})`;
}

/**
 * ソート規則:
 * 1. 未完了(is_done=false)を上部、完了済みを末尾にまとめる
 * 2. 各グループ内は due_date が近い順(昇順)
 * 3. due_date未設定は各グループの末尾。未設定同士・同一日同士は sort_order 昇順でタイブレークする
 */
export function sortTodos(todos: Todo[]): Todo[] {
  return [...todos].sort((a, b) => {
    if (a.is_done !== b.is_done) {
      return a.is_done ? 1 : -1;
    }
    const aHasDue = a.due_date !== null;
    const bHasDue = b.due_date !== null;
    if (aHasDue !== bHasDue) {
      return aHasDue ? -1 : 1;
    }
    if (aHasDue && bHasDue && a.due_date !== b.due_date) {
      return (a.due_date as string) < (b.due_date as string) ? -1 : 1;
    }
    return a.sort_order - b.sort_order;
  });
}

/**
 * 並べ替えモードでの「同じグループ」判定キー。
 * 完了状態(is_done)と期限日(due_date、未設定は"none")の組み合わせが一致する項目同士のみ
 * 手動での順序入れ替え(タイブレーク変更)を許可する。
 */
export function todoGroupKey(todo: Pick<Todo, "is_done" | "due_date">): string {
  return `${todo.is_done ? "done" : "open"}|${todo.due_date ?? "none"}`;
}

/** `sorted`(ソート済み配列)の`index`番目の項目が、ひとつ上の項目と入れ替え可能か(同じグループ内か)。 */
export function canMoveUp(sorted: Todo[], index: number): boolean {
  if (index <= 0 || index >= sorted.length) {
    return false;
  }
  return todoGroupKey(sorted[index]) === todoGroupKey(sorted[index - 1]);
}

/** `sorted`(ソート済み配列)の`index`番目の項目が、ひとつ下の項目と入れ替え可能か(同じグループ内か)。 */
export function canMoveDown(sorted: Todo[], index: number): boolean {
  if (index < 0 || index >= sorted.length - 1) {
    return false;
  }
  return todoGroupKey(sorted[index]) === todoGroupKey(sorted[index + 1]);
}

/**
 * `sorted`配列内で`index`番目の項目を同グループ内で1つ上/下へ移動する。
 * グループ境界を越える移動は行わず`null`を返す(呼び出し側は何もしない=disabledの見た目どおりの挙動)。
 * 戻り値は入れ替え後の配列全体(sort_orderの更新は呼び出し側の責務。並び順のみ入れ替える)。
 */
export function moveTodoInGroup(
  sorted: Todo[],
  index: number,
  direction: "up" | "down",
): Todo[] | null {
  const movable = direction === "up" ? canMoveUp(sorted, index) : canMoveDown(sorted, index);
  if (!movable) {
    return null;
  }
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  const next = [...sorted];
  const tmp = next[index];
  next[index] = next[targetIndex];
  next[targetIndex] = tmp;
  return next;
}
