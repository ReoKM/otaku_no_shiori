/**
 * S3c SpotRow(通常モード/旅程に追加ピッカー表示中/削除確認中の1行)。
 * 参照: docs/design/screens/S3c_旅程スポット.md
 * 「SpotRow(1行)」「SpotRow(旅程に追加ピッカー表示中)」「SpotRow(削除確認中)」
 */
import { buildGoogleMapsSearchUrl } from "@/lib/googleMapsUrl";
import type { ItineraryDayInfo } from "@/lib/itinerary-days";
import type { ResolvedSpotRow } from "@/lib/spot-list";
import { getSpotCategoryLabel } from "@/lib/spot-category";

export type SpotRowMode = "view" | "addPicker" | "delete";

interface SpotRowProps {
  row: ResolvedSpotRow;
  mode: SpotRowMode;
  /** 「旅程に追加」ピッカーの日付選択肢。日程未設定(フォールバック)時は`null`で「旅程に追加」を無効化する。 */
  dayOptions: ItineraryDayInfo[] | null;
  onToggleVisited: () => void;
  onStartAddToItinerary: () => void;
  onStartDelete: () => void;

  pickerDayDate: string;
  pickerTime: string;
  onPickerDayDateChange: (value: string) => void;
  onPickerTimeChange: (value: string) => void;
  onConfirmAddToItinerary: () => void;
  onCancelAddToItinerary: () => void;

  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

export function SpotRow({
  row,
  mode,
  dayOptions,
  onToggleVisited,
  onStartAddToItinerary,
  onStartDelete,
  pickerDayDate,
  pickerTime,
  onPickerDayDateChange,
  onPickerTimeChange,
  onConfirmAddToItinerary,
  onCancelAddToItinerary,
  onConfirmDelete,
  onCancelDelete,
}: SpotRowProps) {
  const categoryLabel = getSpotCategoryLabel(row.category);

  return (
    <div className="flex flex-col border-t border-paper-divider bg-paper-surface px-4 py-3 first:border-t-0">
      <div className="flex items-start gap-2">
        <button
          type="button"
          role="checkbox"
          aria-checked={row.isVisited}
          aria-label="訪問済み"
          onClick={onToggleVisited}
          className="flex h-11 w-11 shrink-0 items-center justify-center"
        >
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs ${
              row.isVisited ? "bg-sakura text-white" : "border-2 border-ink-faint bg-white"
            }`}
          >
            {row.isVisited && "✓"}
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={row.isVisited ? "text-base text-ink-done line-through" : "text-base font-medium text-ink"}>
              {row.name}
            </p>
            {categoryLabel && (
              <span className="rounded-full bg-sakura-soft px-2 py-0.5 text-xs font-bold text-sakura-ink">{categoryLabel}</span>
            )}
          </div>
          {row.area && <p className="text-[12.5px] text-ink-sub">{row.area}</p>}
          <a
            href={buildGoogleMapsSearchUrl(row.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12.5px] font-bold text-sakura-ink"
          >
            地図で見る
          </a>
          {row.description && <p className="line-clamp-2 text-xs text-ink-muted">{row.description}</p>}
          {row.caution && <p className="text-xs text-red-600">⚠ {row.caution}</p>}
          {row.memo && <p className="text-[12.5px] text-ink">メモ: {row.memo}</p>}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <button
            type="button"
            onClick={onStartAddToItinerary}
            disabled={!dayOptions}
            className="min-h-9.5 rounded-xl border border-sakura-border bg-white px-3 text-[12.5px] font-bold whitespace-nowrap text-sakura-ink disabled:border-paper-dashed disabled:text-ink-faint"
          >
            旅程に追加
          </button>
          <button
            type="button"
            aria-label={`${row.name}を削除`}
            onClick={onStartDelete}
            className="flex h-11 w-11 items-center justify-center text-[12.5px] font-medium text-ink-muted"
          >
            削除
          </button>
        </div>
      </div>

      {mode === "addPicker" && dayOptions && (
        <div className="mt-2.5 flex flex-col gap-2 border-t border-paper-divider pt-2.5">
          <select
            aria-label="日付"
            value={pickerDayDate}
            onChange={(e) => onPickerDayDateChange(e.target.value)}
            className="min-h-12 w-full rounded-xl border border-paper-dashed bg-white px-3.5 text-base font-medium text-ink outline-none"
          >
            {dayOptions.map((day) => (
              <option key={day.date} value={day.date}>
                {day.label}
              </option>
            ))}
          </select>
          <input
            type="time"
            value={pickerTime}
            aria-label="時刻(任意)"
            onChange={(e) => onPickerTimeChange(e.target.value)}
            className="min-h-12 w-full rounded-xl border border-paper-dashed bg-white px-3.5 text-base font-medium text-ink outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancelAddToItinerary}
              className="min-h-11.5 flex-none rounded-xl border border-paper-dashed bg-white px-4.5 text-sm font-medium text-ink-label"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={onConfirmAddToItinerary}
              className="min-h-11.5 flex-1 rounded-xl bg-sakura text-[15px] font-bold text-white"
            >
              旅程に追加する
            </button>
          </div>
        </div>
      )}

      {mode === "delete" && (
        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-paper-divider pt-2.5">
          <p className="min-w-0 flex-1 text-[13px] text-ink">
            「{row.name}」を削除します。よろしいですか?
          </p>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={onCancelDelete}
              className="min-h-11 px-3 text-[13px] font-medium text-ink-label"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={onConfirmDelete}
              className="min-h-11 px-3 text-[13px] font-bold text-red-600"
            >
              削除する
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
