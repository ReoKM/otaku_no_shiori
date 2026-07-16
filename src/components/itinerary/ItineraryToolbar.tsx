/**
 * S3c Toolbar(旅程セクションのツールバー行)。
 * 参照: docs/design/screens/S3c_旅程スポット.md「ItinerarySection」
 * S3b Toolbarと同パターン(全エントリー数が2件以上のときのみ並べ替えボタンを表示)。
 */
interface ItineraryToolbarProps {
  count: number;
  sortMode: boolean;
  onToggleSort: () => void;
  /**
   * 並べ替えモード自体を提供できない場合にfalse。
   * 日程null(フォールバック表示)時は日ブロックが無く並べ替えの単位を定義できないため、
   * ボタン自体を出さない(実装裁量。docs/design/screens/S3c_旅程スポット.md参照)。
   */
  sortAvailable?: boolean;
}

export function ItineraryToolbar({
  count,
  sortMode,
  onToggleSort,
  sortAvailable = true,
}: ItineraryToolbarProps) {
  return (
    <div className="flex h-11 items-center justify-between px-4">
      <p className="text-sm text-neutral-500">{count}件</p>
      {/* 並べ替えモード中は件数に関わらず「完了」を出し続ける(モードから抜けられなくなるのを防ぐ) */}
      {sortAvailable && (count >= 2 || sortMode) && (
        <button
          type="button"
          onClick={onToggleSort}
          className="h-11 px-2 text-sm font-semibold text-pink-500"
        >
          {sortMode ? "完了" : "並べ替え"}
        </button>
      )}
    </div>
  );
}
