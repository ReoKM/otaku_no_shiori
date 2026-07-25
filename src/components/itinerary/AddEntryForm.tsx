"use client";

import { useRef, useState } from "react";
import {
  ITINERARY_MEMO_MAX_LENGTH,
  ITINERARY_PLACE_NAME_MAX_LENGTH,
  ITINERARY_TITLE_MAX_LENGTH,
  validateItineraryTitle,
} from "@/lib/itinerary-validation";

export interface NewEntryValues {
  time: string | null;
  title: string;
  placeName: string | null;
  memo: string | null;
}

interface AddEntryFormProps {
  onSave: (values: NewEntryValues) => void;
  onCancel: () => void;
}

/**
 * S3c AddEntryForm(予定追加フォーム、該当日のDayBlock内にインライン表示)。
 * 参照: docs/design/screens/S3c_旅程スポット.md「AddEntryForm(予定追加フォーム)」
 */
export function AddEntryForm({ onSave, onCancel }: AddEntryFormProps) {
  const [time, setTime] = useState("");
  const [title, setTitle] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validateItineraryTitle(title);
    if (validationError) {
      setError(validationError);
      return;
    }
    onSave({
      time: time || null,
      title: title.trim(),
      placeName: placeName.trim() || null,
      memo: memo.trim() || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-t border-paper-divider bg-sakura-tint px-4 py-3.5">
      <span className="block px-0.5 pb-1 text-xs font-medium text-ink-muted">時刻(任意)</span>
      <input
        type="time"
        value={time}
        aria-label="時刻(任意)"
        onChange={(e) => setTime(e.target.value)}
        className="min-h-12 w-full rounded-xl border border-paper-dashed bg-white px-3.5 text-base font-medium text-ink outline-none"
      />
      <span className="block px-0.5 pb-1 text-xs font-medium text-ink-muted">予定名</span>
      <input
        ref={titleInputRef}
        aria-label="予定名"
        type="text"
        value={title}
        maxLength={ITINERARY_TITLE_MAX_LENGTH}
        placeholder="例: 会場入り"
        onChange={(e) => {
          setTitle(e.target.value);
          if (error) {
            setError(null);
          }
        }}
        className={`min-h-12 w-full rounded-xl border-[1.5px] bg-white px-3.5 text-base font-medium text-ink outline-none ${
          error ? "border-red-400" : "border-sakura-field"
        }`}
      />
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      <span className="block px-0.5 pb-1 text-xs font-medium text-ink-muted">場所(任意)</span>
      <input
        type="text"
        aria-label="場所"
        value={placeName}
        maxLength={ITINERARY_PLACE_NAME_MAX_LENGTH}
        placeholder="例: 東京ビッグサイト"
        onChange={(e) => setPlaceName(e.target.value)}
        className="min-h-12 w-full rounded-xl border border-paper-dashed bg-white px-3.5 text-base font-medium text-ink outline-none"
      />
      <span className="block px-0.5 pb-1 text-xs font-medium text-ink-muted">メモ(任意)</span>
      <textarea
        aria-label="メモ"
        value={memo}
        maxLength={ITINERARY_MEMO_MAX_LENGTH}
        placeholder="例: 開場30分前に到着"
        onChange={(e) => setMemo(e.target.value)}
        rows={2}
        className="w-full rounded-xl border border-paper-dashed bg-white px-3.5 py-2.5 text-base font-medium text-ink outline-none"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11.5 flex-none rounded-xl border border-paper-dashed bg-white px-4.5 text-sm font-medium text-ink-label"
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="min-h-11.5 flex-1 rounded-xl bg-sakura text-[15px] font-bold text-white"
        >
          登録する
        </button>
      </div>
    </form>
  );
}
