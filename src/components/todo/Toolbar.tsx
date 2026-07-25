import { SortIcon } from "@/components/list-ui/icons";

/**
 * S3b Toolbar(ツールバー行)。
 * 参照: docs/design/screens/S3b_TODO.md「レイアウト」
 *
 * 持ち物タブの`PackingToolbar`と同じ構成。件数とリストの左端を揃える。
 */
interface ToolbarProps {
  count: number;
  doneCount: number;
  showDone: boolean;
  onToggleShowDone: () => void;
  onOpenSortSheet: () => void;
  manualSortMode: boolean;
  onExitManualSort: () => void;
}

export function Toolbar({
  count,
  doneCount,
  showDone,
  onToggleShowDone,
  onOpenSortSheet,
  manualSortMode,
  onExitManualSort,
}: ToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-2 pt-6 pb-3">
      <span className="text-[13px] font-medium text-ink-sub">
        {count === 0 ? "まだ登録がありません" : `全${count}件・残り${count - doneCount}件`}
      </span>
      {manualSortMode ? (
        <button
          type="button"
          onClick={onExitManualSort}
          className="min-h-9 px-2 text-[13px] font-bold text-sakura-ink"
        >
          並べ替えを終える
        </button>
      ) : (
        <div className="flex items-center gap-1">
          {doneCount > 0 && (
            <button
              type="button"
              onClick={onToggleShowDone}
              className="min-h-9 px-2 text-[13px] font-medium text-ink-sub"
            >
              {showDone ? "完了済みを隠す" : "完了済みを表示"}
            </button>
          )}
          {count >= 2 && (
            <button
              type="button"
              onClick={onOpenSortSheet}
              className="flex min-h-9 items-center gap-2 pr-1 pl-2 text-[13px] font-medium text-ink-strong"
            >
              <SortIcon />
              並べ替え
            </button>
          )}
        </div>
      )}
    </div>
  );
}
