import { SortIcon } from "@/components/list-ui/icons";

/**
 * S3c Toolbar(旅程セクションのツールバー行)。
 * 参照: docs/design/screens/S3c_旅程スポット.md「ItinerarySection」
 * 持ち物・やることのツールバーと同じ見た目に揃える。
 */
interface ItineraryToolbarProps {
  count: number;
  /** 日ブロックの数(「全4件・2日間」の後半)。 */
  dayCount: number;
  sortMode: boolean;
  onToggleSort: () => void;
  /**
   * 並べ替えモード自体を提供できない場合にfalse。
   * 日程null(フォールバック表示)時は日ブロックが無く並べ替えの単位を定義できないため、
   * ボタン自体を出さない。
   */
  sortAvailable?: boolean;
}

export function ItineraryToolbar({
  count,
  dayCount,
  sortMode,
  onToggleSort,
  sortAvailable = true,
}: ItineraryToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-2 pt-5 pb-1">
      <span className="text-[13px] font-medium text-ink-sub">
        {count === 0 ? "まだ予定がありません" : `全${count}件・${dayCount}日間`}
      </span>
      {/* 並べ替えモード中は件数に関わらず抜けるボタンを出し続ける(モードから抜けられなくなるのを防ぐ) */}
      {sortAvailable && (count >= 2 || sortMode) && (
        <button
          type="button"
          onClick={onToggleSort}
          className={`flex min-h-9 items-center gap-2 pr-1 pl-2 text-[13px] ${
            sortMode ? "font-bold text-sakura-ink" : "font-medium text-ink-strong"
          }`}
        >
          {!sortMode && <SortIcon />}
          {sortMode ? "並べ替えを終える" : "並べ替え"}
        </button>
      )}
    </div>
  );
}
