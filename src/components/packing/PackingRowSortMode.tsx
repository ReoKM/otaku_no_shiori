import type { PackingItem } from "@/types/shiori";

interface PackingRowSortModeProps {
  item: PackingItem;
  isDragging: boolean;
  registerRow: (el: HTMLElement | null) => void;
  onHandlePointerDown: (e: React.PointerEvent<HTMLElement>) => void;
}

/**
 * S3a PackingRowSortMode(手動並べ替えモードの1行)。
 * 参照: docs/design/screens/S3a_持ち物.md「PackingRowSortMode」
 * チェックボックス・行メニューは並べ替え中は表示しない(誤操作防止)。
 *
 * 並べ替えは行右端のハンドルを約300ms長押し→ドラッグで行う。
 * ロジックは`src/lib/use-drag-sort.ts`(共有フック)を参照。
 * ドラッグ中の行はスクロールと競合しないよう`touch-none`にし、影+半透明で強調する。
 */
export function PackingRowSortMode({
  item,
  isDragging,
  registerRow,
  onHandlePointerDown,
}: PackingRowSortModeProps) {
  return (
    <div
      ref={registerRow}
      className={`flex min-h-17 touch-none items-center gap-2 border-t border-paper-divider px-4 first:border-t-0 ${
        isDragging ? "relative z-10 bg-paper-flash opacity-80 shadow-lg" : "bg-paper-surface"
      }`}
    >
      <p className="min-w-0 flex-1 truncate text-base font-medium text-ink">{item.label}</p>
      <button
        type="button"
        aria-label={`${item.label}をドラッグして並べ替え`}
        onPointerDown={onHandlePointerDown}
        className="-mr-2.5 flex h-11 w-11 flex-none touch-none items-center justify-center text-ink-faint"
      >
        <DragHandleIcon />
      </button>
    </div>
  );
}

function DragHandleIcon() {
  return (
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
  );
}
