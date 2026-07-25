"use client";

import { LIST_SORT_MODE_LABELS, type ListSortMode } from "@/lib/list-sort-mode";
import { BottomSheet } from "./BottomSheet";

interface SortSheetProps {
  /** このタブで選べる並び順(`SORT_MODES_BY_TAB`から渡す)。 */
  modes: readonly ListSortMode[];
  current: ListSortMode;
  onPick: (mode: ListSortMode) => void;
  onClose: () => void;
}

/**
 * 並べ替えシート。選択肢はタブごとに異なる(`SORT_MODES_BY_TAB`)。
 * 参照: docs/design/screens/S3a_持ち物.md「並べ替えシート」
 */
export function SortSheet({ modes, current, onPick, onClose }: SortSheetProps) {
  return (
    <BottomSheet title="並べ替え" onClose={onClose}>
      <div className="flex flex-col">
        {modes.map((mode) => {
          const selected = mode === current;
          return (
            <button
              key={mode}
              type="button"
              aria-pressed={selected}
              onClick={() => onPick(mode)}
              className={`min-h-13 rounded-xl px-4 text-left text-[15px] ${
                selected ? "bg-sakura-soft font-bold text-sakura-ink" : "font-medium text-ink-strong"
              }`}
            >
              {LIST_SORT_MODE_LABELS[mode]}
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}
