/**
 * S3b TodoRowSortMode(並べ替えモード、1行)。
 * 参照: docs/design/screens/S3b_TODO.md「TodoRowSortMode」
 * S3a_持ち物.md の PackingRowSortMode と同じ構造(上矢印/下矢印/ラベル表示のみ)。
 * グループ境界での「押しても動かない」誤解を防ぐため、期限日を小さく表示し、
 * グループ境界の矢印はdisabled表示にする。
 */
import { formatDueDate } from "@/lib/todo-sort";
import type { Todo } from "@/types/shiori";

interface TodoRowSortModeProps {
  item: Todo;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function TodoRowSortMode({
  item,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: TodoRowSortModeProps) {
  return (
    <div className="flex min-h-14 items-center gap-2 px-4">
      <button
        type="button"
        aria-label="上へ移動"
        disabled={!canMoveUp}
        onClick={onMoveUp}
        className={`flex h-11 w-11 shrink-0 items-center justify-center text-lg ${
          canMoveUp ? "text-neutral-900" : "bg-neutral-200 text-neutral-400"
        }`}
      >
        ↑
      </button>
      <button
        type="button"
        aria-label="下へ移動"
        disabled={!canMoveDown}
        onClick={onMoveDown}
        className={`flex h-11 w-11 shrink-0 items-center justify-center text-lg ${
          canMoveDown ? "text-neutral-900" : "bg-neutral-200 text-neutral-400"
        }`}
      >
        ↓
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-base ${
            item.is_done ? "text-neutral-400 line-through" : "text-neutral-900"
          }`}
        >
          {item.label}
        </p>
        {item.due_date && <p className="text-sm text-neutral-500">{formatDueDate(item.due_date)}</p>}
      </div>
    </div>
  );
}
