/**
 * S3b TodoRowSortMode(手動並べ替えモード、1行)。
 * 参照: docs/design/screens/S3b_TODO.md「TodoRowSortMode」
 * 持ち物の`PackingRowSortMode`と同じ構造に期限日の表示を足したもの。
 *
 * 並べ替えは行右端のハンドルを約300ms長押し→ドラッグで行う。ドラッグは同じ期限グループ
 * (完了状態+期限日の組み合わせ)内に制限し、グループ境界を越えて移動できないことで
 * 「押しても動かない」という誤解を防ぐ
 * (制限自体は`src/lib/use-drag-sort.ts`の`groupKeyOf`で担保する)。
 */
import { formatDueDate } from "@/lib/todo-sort";
import type { Todo } from "@/types/shiori";

interface TodoRowSortModeProps {
  item: Todo;
  isDragging: boolean;
  registerRow: (el: HTMLElement | null) => void;
  onHandlePointerDown: (e: React.PointerEvent<HTMLElement>) => void;
}

export function TodoRowSortMode({
  item,
  isDragging,
  registerRow,
  onHandlePointerDown,
}: TodoRowSortModeProps) {
  return (
    <div
      ref={registerRow}
      className={`flex min-h-17 touch-none items-center gap-2 border-t border-paper-divider px-4 first:border-t-0 ${
        isDragging ? "relative z-10 bg-paper-flash opacity-80 shadow-lg" : "bg-paper-surface"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-base font-medium ${
            item.is_done ? "text-ink-done line-through" : "text-ink"
          }`}
        >
          {item.label}
        </p>
        {item.due_date && (
          <p className="mt-0.5 text-xs font-medium text-ink-muted">
            期限 {formatDueDate(item.due_date)}
          </p>
        )}
      </div>
      <button
        type="button"
        aria-label={`${item.label}をドラッグして並べ替え`}
        onPointerDown={onHandlePointerDown}
        className="-mr-2.5 flex h-11 w-11 flex-none touch-none items-center justify-center text-ink-faint"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M3.5 6.5h11" />
          <path d="M3.5 11.5h11" />
        </svg>
      </button>
    </div>
  );
}
