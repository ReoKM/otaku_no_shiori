import { SortIcon } from "@/components/list-ui/icons";

interface PackingToolbarProps {
  count: number;
  checkedCount: number;
  /** 「完了済みを隠す/表示」の現在の状態。 */
  showDone: boolean;
  onToggleShowDone: () => void;
  onOpenSortSheet: () => void;
  /** 手動並べ替えモード中は抜けるためのボタンだけを出す。 */
  manualSortMode: boolean;
  onExitManualSort: () => void;
}

/**
 * S3a ツールバー行(件数表示+完了済みの表示切替+並べ替え)。
 * 参照: docs/design/screens/S3a_持ち物.md「1. ツールバー行」
 *
 * リストカードの外・カードの上に置き、件数とリストの左端を揃える。
 * 「完了済みを隠す」は完了が1件以上あるときだけ出す(押しても何も変わらない状態を作らない)。
 */
export function PackingToolbar({
  count,
  checkedCount,
  showDone,
  onToggleShowDone,
  onOpenSortSheet,
  manualSortMode,
  onExitManualSort,
}: PackingToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-2 pt-6 pb-3">
      <span className="text-[13px] font-medium text-ink-sub">
        {count === 0 ? "まだ登録がありません" : `全${count}件・残り${count - checkedCount}件`}
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
          {checkedCount > 0 && (
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
