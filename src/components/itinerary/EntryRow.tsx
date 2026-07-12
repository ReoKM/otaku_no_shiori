"use client";

/**
 * S3c EntryRow(通常モード/編集中/削除確認中の1行)。
 * 参照: docs/design/screens/S3c_旅程スポット.md
 * 「EntryRow(通常モード、1行)」「EntryRow(編集中)」「EntryRow(削除確認中)」
 */
import { useEffect, useRef } from "react";
import { buildGoogleMapsSearchUrl } from "@/lib/googleMapsUrl";
import type { ItineraryDayInfo } from "@/lib/itinerary-days";
import {
  ITINERARY_MEMO_MAX_LENGTH,
  ITINERARY_PLACE_NAME_MAX_LENGTH,
  ITINERARY_TITLE_MAX_LENGTH,
} from "@/lib/itinerary-validation";
import type { ItineraryEntry } from "@/types/shiori";

export type EntryRowMode = "view" | "edit" | "delete";

interface EntryRowProps {
  entry: ItineraryEntry;
  mode: EntryRowMode;
  onStartEdit: () => void;
  onStartDelete: () => void;

  /**
   * Issue #63: 「旅程に追加」直後の強調表示対象かどうか。
   * trueの間、背景`color-primary-soft`(`bg-pink-100`)で一時的に強調し、
   * 表示された位置までスクロールする(S3c仕様「旅程に追加 完了直後」)。
   */
  highlighted?: boolean;

  /** 日付変更プルダウンの選択肢。日程null(フォールバック中)の場合は`null`でプルダウン非表示。 */
  dayOptions: ItineraryDayInfo[] | null;

  editTime: string;
  editTitle: string;
  editPlaceName: string;
  editMemo: string;
  editDayDate: string;
  editError: string | null;
  onEditTimeChange: (value: string) => void;
  onEditTitleChange: (value: string) => void;
  onEditPlaceNameChange: (value: string) => void;
  onEditMemoChange: (value: string) => void;
  onEditDayDateChange: (value: string) => void;
  onClearEditTime: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;

  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

export function EntryRow({
  entry,
  mode,
  onStartEdit,
  onStartDelete,
  highlighted = false,
  dayOptions,
  editTime,
  editTitle,
  editPlaceName,
  editMemo,
  editDayDate,
  editError,
  onEditTimeChange,
  onEditTitleChange,
  onEditPlaceNameChange,
  onEditMemoChange,
  onEditDayDateChange,
  onClearEditTime,
  onSaveEdit,
  onCancelEdit,
  onConfirmDelete,
  onCancelDelete,
}: EntryRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  // Issue #63: 強調表示対象になったタイミングで、この行の位置までスクロールする。
  useEffect(() => {
    if (highlighted) {
      rowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlighted]);

  if (mode === "edit") {
    return (
      <div className="flex flex-col gap-2 border-b border-neutral-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={editTime}
            aria-label="時刻"
            onChange={(e) => onEditTimeChange(e.target.value)}
            className="h-11 flex-1 rounded-lg border border-neutral-200 bg-white px-3 text-base text-neutral-900"
          />
          {editTime && (
            <button type="button" onClick={onClearEditTime} className="text-xs text-neutral-500 underline">
              時刻を削除
            </button>
          )}
        </div>
        <input
          type="text"
          value={editTitle}
          maxLength={ITINERARY_TITLE_MAX_LENGTH}
          onChange={(e) => onEditTitleChange(e.target.value)}
          className="h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-base text-neutral-900"
        />
        {editError && <p className="text-xs text-red-600">{editError}</p>}
        <input
          type="text"
          value={editPlaceName}
          maxLength={ITINERARY_PLACE_NAME_MAX_LENGTH}
          placeholder="例: 東京ビッグサイト"
          onChange={(e) => onEditPlaceNameChange(e.target.value)}
          className="h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-base text-neutral-900"
        />
        <textarea
          value={editMemo}
          maxLength={ITINERARY_MEMO_MAX_LENGTH}
          rows={2}
          onChange={(e) => onEditMemoChange(e.target.value)}
          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-base text-neutral-900"
        />
        {dayOptions && (
          <select
            aria-label="日付"
            value={editDayDate}
            onChange={(e) => onEditDayDateChange(e.target.value)}
            className="h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-base text-neutral-900"
          >
            {dayOptions.map((day) => (
              <option key={day.date} value={day.date}>
                {day.label}
              </option>
            ))}
          </select>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            aria-label="保存"
            onClick={onSaveEdit}
            className="flex h-11 w-11 items-center justify-center text-lg text-pink-500"
          >
            ✓
          </button>
          <button
            type="button"
            aria-label="編集をキャンセル"
            onClick={onCancelEdit}
            className="flex h-11 w-11 items-center justify-center text-lg text-neutral-500"
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  if (mode === "delete") {
    return (
      <div className="flex min-h-14 items-center justify-between gap-2 border-b border-neutral-200 px-4">
        <p className="text-xs text-neutral-700">本当に削除しますか？</p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onConfirmDelete}
            className="h-11 px-3 text-sm font-semibold text-red-600"
          >
            削除
          </button>
          <button type="button" onClick={onCancelDelete} className="h-11 px-3 text-sm text-neutral-500">
            キャンセル
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={rowRef}
      className={`flex flex-col gap-1 border-b border-neutral-200 px-4 py-3 ${
        highlighted ? "bg-pink-100" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            {entry.time && <span className="text-sm text-neutral-500">{entry.time}</span>}
            <p className="text-base text-neutral-900">{entry.title}</p>
          </div>
          {entry.place_name && (
            <a
              href={buildGoogleMapsSearchUrl(entry.place_name)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-pink-500"
            >
              📍 {entry.place_name}
            </a>
          )}
          {entry.memo && <p className="whitespace-pre-wrap text-sm text-neutral-500">{entry.memo}</p>}
        </div>
        <button
          type="button"
          aria-label="編集"
          onClick={onStartEdit}
          className="flex h-11 w-11 shrink-0 items-center justify-center text-neutral-500"
        >
          ✎
        </button>
        <button
          type="button"
          aria-label="削除"
          onClick={onStartDelete}
          className="flex h-11 w-11 shrink-0 items-center justify-center text-neutral-500"
        >
          🗑
        </button>
      </div>
    </div>
  );
}
