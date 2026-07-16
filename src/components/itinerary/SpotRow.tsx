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
    <div className="flex flex-col border-b border-neutral-200 px-4 py-3">
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
            className={`flex h-5 w-5 items-center justify-center rounded border ${
              row.isVisited ? "border-pink-500 bg-pink-500 text-white" : "border-neutral-300 bg-white"
            }`}
          >
            {row.isVisited && "✓"}
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={row.isVisited ? "text-base text-neutral-400 line-through" : "text-base text-neutral-900"}>
              {row.name}
            </p>
            {categoryLabel && (
              <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs text-pink-700">{categoryLabel}</span>
            )}
          </div>
          {row.area && <p className="text-sm text-neutral-500">{row.area}</p>}
          <a
            href={buildGoogleMapsSearchUrl(row.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-pink-500"
          >
            地図で見る
          </a>
          {row.description && <p className="line-clamp-2 text-xs text-neutral-500">{row.description}</p>}
          {row.caution && <p className="text-xs text-red-600">⚠ {row.caution}</p>}
          {row.memo && <p className="text-sm text-neutral-900">メモ: {row.memo}</p>}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <button
            type="button"
            onClick={onStartAddToItinerary}
            disabled={!dayOptions}
            className="h-11 whitespace-nowrap px-1 text-xs font-semibold text-pink-500 disabled:text-neutral-300"
          >
            旅程に追加
          </button>
          <button
            type="button"
            aria-label="削除"
            onClick={onStartDelete}
            className="flex h-11 w-11 items-center justify-center text-neutral-500"
          >
            🗑
          </button>
        </div>
      </div>

      {mode === "addPicker" && dayOptions && (
        <div className="mt-2 flex flex-col gap-2 border-t border-neutral-200 pt-2">
          <select
            aria-label="日付"
            value={pickerDayDate}
            onChange={(e) => onPickerDayDateChange(e.target.value)}
            className="h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-base text-neutral-900"
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
            className="h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-base text-neutral-900"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onCancelAddToItinerary} className="h-11 px-3 text-base text-neutral-500">
              キャンセル
            </button>
            <button
              type="button"
              onClick={onConfirmAddToItinerary}
              className="h-11 rounded-lg bg-pink-500 px-4 text-base font-semibold text-white"
            >
              追加
            </button>
          </div>
        </div>
      )}

      {mode === "delete" && (
        <div className="mt-2 flex items-center justify-between gap-2 border-t border-neutral-200 pt-2">
          <p className="text-xs text-neutral-700">本当に削除しますか？</p>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={onConfirmDelete} className="h-11 px-3 text-sm font-semibold text-red-600">
              削除
            </button>
            <button type="button" onClick={onCancelDelete} className="h-11 px-3 text-sm text-neutral-500">
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
