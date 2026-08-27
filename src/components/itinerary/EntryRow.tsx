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
      <div className="flex flex-col gap-2 border-t border-paper-divider bg-sakura-tint px-4 py-3.5 first:border-t-0">
        <span className="block px-0.5 pb-1 text-xs font-medium text-ink-muted">時刻(任意)</span>
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={editTime}
            aria-label="時刻"
            onChange={(e) => onEditTimeChange(e.target.value)}
            className="min-h-12 flex-1 rounded-xl border border-paper-dashed bg-white px-3.5 text-base font-medium text-ink outline-none"
          />
          {editTime && (
            <button type="button" onClick={onClearEditTime} className="text-xs font-medium text-ink-label underline">
              時刻を削除
            </button>
          )}
        </div>
        <span className="block px-0.5 pb-1 text-xs font-medium text-ink-muted">予定名</span>
        <input
          type="text"
          aria-label="予定名"
          value={editTitle}
          maxLength={ITINERARY_TITLE_MAX_LENGTH}
          onChange={(e) => onEditTitleChange(e.target.value)}
          className="min-h-12 w-full rounded-xl border border-paper-dashed bg-white px-3.5 text-base font-medium text-ink outline-none"
        />
        {editError && <p className="text-xs font-medium text-red-600">{editError}</p>}
        <span className="block px-0.5 pb-1 text-xs font-medium text-ink-muted">場所(任意)</span>
        <input
          type="text"
          aria-label="場所"
          value={editPlaceName}
          maxLength={ITINERARY_PLACE_NAME_MAX_LENGTH}
          placeholder="例: 東京ビッグサイト"
          onChange={(e) => onEditPlaceNameChange(e.target.value)}
          className="min-h-12 w-full rounded-xl border border-paper-dashed bg-white px-3.5 text-base font-medium text-ink outline-none"
        />
        <span className="block px-0.5 pb-1 text-xs font-medium text-ink-muted">メモ(任意)</span>
        <textarea
          aria-label="メモ"
          value={editMemo}
          maxLength={ITINERARY_MEMO_MAX_LENGTH}
          rows={2}
          onChange={(e) => onEditMemoChange(e.target.value)}
          className="w-full rounded-xl border border-paper-dashed bg-white px-3.5 py-2.5 text-base font-medium text-ink outline-none"
        />
        {dayOptions && (
          <span className="block px-0.5 pb-1 text-xs font-medium text-ink-muted">日付</span>
        )}
        {dayOptions && (
          <select
            aria-label="日付"
            value={editDayDate}
            onChange={(e) => onEditDayDateChange(e.target.value)}
            className="min-h-12 w-full rounded-xl border border-paper-dashed bg-white px-3.5 text-base font-medium text-ink outline-none"
          >
            {dayOptions.map((day) => (
              <option key={day.date} value={day.date}>
                {day.label}
              </option>
            ))}
          </select>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancelEdit}
            className="min-h-11.5 flex-none rounded-xl border border-paper-dashed bg-white px-4.5 text-sm font-medium text-ink-label"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onSaveEdit}
            className="min-h-11.5 flex-1 rounded-xl bg-sakura text-[15px] font-bold text-white"
          >
            保存する
          </button>
        </div>
        {/* 予定名の行をタップして開く「詳細」を兼ねるため、地図と削除の導線もここに置く */}
        {entry.place_name && (
          <a
            href={buildGoogleMapsSearchUrl(entry.place_name)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center justify-center text-[13px] font-bold text-sakura-ink"
          >
            地図で見る
          </a>
        )}
        <button
          type="button"
          onClick={onStartDelete}
          className="min-h-11 w-full rounded-xl text-[13px] font-bold text-red-600"
        >
          この予定を削除する
        </button>
      </div>
    );
  }

  if (mode === "delete") {
    return (
      <div className="flex min-h-18 items-center justify-between gap-2 border-t border-paper-divider bg-paper-surface px-4 first:border-t-0">
        <p className="min-w-0 flex-1 text-[13px] text-ink">
          「{entry.title}」を削除します。よろしいですか?
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
    );
  }

  return (
    <div
      ref={rowRef}
      role="button"
      tabIndex={0}
      onClick={onStartEdit}
      onKeyDown={(event) => {
        // 行全体がボタン代わりのため、Enter/Spaceでもタップと同じ「編集開始」を起こす
        // (地図リンクをネストするため<button>ではなく<div role="button">にした分の補い)
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onStartEdit();
        }
      }}
      className={`flex min-h-18 w-full items-center gap-3 border-t border-paper-divider px-4 py-2.5 text-left first:border-t-0 ${
        highlighted ? "bg-sakura-soft" : "bg-paper-surface"
      }`}
    >
      {/* 時刻の桁数に関わらず予定名の左端が揃うよう、時刻の幅を固定する */}
      <span className="w-13 flex-none text-[13px] font-bold tracking-[0.02em] text-sakura-ink">
        {entry.time ?? ""}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base/[1.4] font-medium text-ink">{entry.title}</span>
        {entry.place_name && (
          // 行全体のonClick(編集開始)に食われないよう、リンク自体でクリックを止める
          // (<a>を<div role="button">の中に置くこと自体はHTML上有効)
          <a
            href={buildGoogleMapsSearchUrl(entry.place_name)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="mt-1 inline-block text-[12.5px] font-bold text-sakura-ink"
          >
            地図で見る
          </a>
        )}
        {entry.memo && (
          <span className="mt-1 block line-clamp-2 text-[12.5px] whitespace-pre-wrap text-ink-muted">
            {entry.memo}
          </span>
        )}
      </span>
      <ChevronIcon />
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="flex-none text-ink-faint"
    >
      <path d="M6.5 3.5 12.5 9l-6 5.5" />
    </svg>
  );
}
