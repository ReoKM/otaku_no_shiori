/**
 * S3b TodoRowSortMode(並べ替えモード、1行)。
 * 参照: docs/design/screens/S3b_TODO.md「TodoRowSortMode」
 * S3a_持ち物.md の PackingRowSortMode と同じ構造(ラベル+期限日表示+ドラッグハンドル)。
 *
 * 並べ替えは行右端のハンドル(≡)を約300ms長押し→ドラッグで行う(オーナーフィードバック反映、
 * 上下矢印ボタンは廃止)。ドラッグは同じ期限グループ(完了状態+期限日の組み合わせ)内に制限し、
 * グループ境界を越えて移動できないことで「押しても動かない」という誤解を防ぐ
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

export function TodoRowSortMode({ item, isDragging, registerRow, onHandlePointerDown }: TodoRowSortModeProps) {
  return (
    <div
      ref={registerRow}
      className={`flex min-h-14 touch-none items-center gap-2 border-b border-neutral-200 px-4 ${
        isDragging ? "relative z-10 bg-white opacity-80 shadow-lg" : ""
      }`}
    >
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
      <button
        type="button"
        aria-label="ドラッグして並べ替え"
        onPointerDown={onHandlePointerDown}
        className="flex h-11 w-11 shrink-0 touch-none items-center justify-center text-lg text-neutral-400"
      >
        ≡
      </button>
    </div>
  );
}
