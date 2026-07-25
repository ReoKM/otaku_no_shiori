"use client";

import {
  LIST_SORT_MODES,
  LIST_SORT_MODE_LABELS,
  type ListSortMode,
} from "@/lib/list-sort-mode";
import { BottomSheet } from "./BottomSheet";

interface SortSheetProps {
  current: ListSortMode;
  onPick: (mode: ListSortMode) => void;
  onClose: () => void;
}

/**
 * 並べ替えシート(登録順 / 未完了を上に / 完了済みを上に / 手動で並べ替え)。
 * 参照: docs/design/screens/S3a_持ち物.md「並べ替えシート」
 */
export function SortSheet({ current, onPick, onClose }: SortSheetProps) {
  return (
    <BottomSheet title="並べ替え" onClose={onClose}>
      <div className="flex flex-col">
        {LIST_SORT_MODES.map((mode) => {
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
