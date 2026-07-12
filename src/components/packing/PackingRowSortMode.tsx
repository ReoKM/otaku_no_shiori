import type { PackingItem } from "@/types/shiori";

interface PackingRowSortModeProps {
  item: PackingItem;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}

/**
 * S3a PackingRowSortMode(並べ替えモードの1行)。
 * 参照: docs/design/screens/S3a_持ち物.md「PackingRowSortMode」
 * チェックボックス・編集・削除は並べ替えモード中は表示しない(誤操作防止)。
 */
export function PackingRowSortMode({
  item,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
}: PackingRowSortModeProps) {
  return (
    <div className="flex min-h-14 items-center gap-2 border-b border-neutral-200 px-4">
      <button
        type="button"
        aria-label="上に移動"
        disabled={isFirst}
        onClick={() => onMoveUp(item.id)}
        className={`flex h-11 w-11 shrink-0 items-center justify-center text-lg ${
          isFirst ? "text-neutral-400" : "text-neutral-900"
        }`}
      >
        ↑
      </button>
      <button
        type="button"
        aria-label="下に移動"
        disabled={isLast}
        onClick={() => onMoveDown(item.id)}
        className={`flex h-11 w-11 shrink-0 items-center justify-center text-lg ${
          isLast ? "text-neutral-400" : "text-neutral-900"
        }`}
      >
        ↓
      </button>
      <p className="min-w-0 flex-1 truncate text-base text-neutral-900">{item.label}</p>
    </div>
  );
}
