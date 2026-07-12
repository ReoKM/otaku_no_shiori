/**
 * S3c EntryRowSortMode(並べ替えモード、1行)。
 * 参照: docs/design/screens/S3c_旅程スポット.md「EntryRowSortMode(並べ替えモード、1行)」
 * S3a PackingRowSortMode/S3b TodoRowSortModeと同パターン。
 * 同じ日の中でのみ有効(日をまたぐ並べ替えは不可のため、境界は呼び出し側=日ごとの配列で担保する)。
 */
import type { ItineraryEntry } from "@/types/shiori";

interface EntryRowSortModeProps {
  entry: ItineraryEntry;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function EntryRowSortMode({
  entry,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: EntryRowSortModeProps) {
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
      <p className="min-w-0 flex-1 truncate text-base text-neutral-900">{entry.title}</p>
    </div>
  );
}
