import type { PackingItem } from "@/types/shiori";

interface PackingRowSortModeProps {
  item: PackingItem;
  isDragging: boolean;
  registerRow: (el: HTMLElement | null) => void;
  onHandlePointerDown: (e: React.PointerEvent<HTMLElement>) => void;
}

/**
 * S3a PackingRowSortMode(並べ替えモードの1行)。
 * 参照: docs/design/screens/S3a_持ち物.md「PackingRowSortMode」
 * チェックボックス・編集・削除は並べ替えモード中は表示しない(誤操作防止)。
 *
 * 並べ替えは行右端のハンドル(≡)を約300ms長押し→ドラッグで行う(オーナーフィードバック反映、
 * 上下矢印ボタンは廃止)。ロジックは`src/lib/use-drag-sort.ts`(共有フック)を参照。
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
      className={`flex min-h-14 touch-none items-center gap-2 border-b border-neutral-100 px-4 ${
        isDragging ? "relative z-10 bg-white opacity-80 shadow-lg" : ""
      }`}
    >
      <p className="min-w-0 flex-1 truncate text-base text-neutral-900">{item.label}</p>
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
