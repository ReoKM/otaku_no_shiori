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
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 px-4 py-3">
      <input
        type="time"
        value={time}
        aria-label="時刻(任意)"
        onChange={(e) => setTime(e.target.value)}
        className="h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-base text-neutral-900"
      />
      <input
        ref={titleInputRef}
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
        className={`h-11 w-full rounded-lg border bg-white px-3 text-base text-neutral-900 ${
          error ? "border-red-400" : "border-neutral-200"
        }`}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <input
        type="text"
        value={placeName}
        maxLength={ITINERARY_PLACE_NAME_MAX_LENGTH}
        placeholder="例: 東京ビッグサイト"
        onChange={(e) => setPlaceName(e.target.value)}
        className="h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-base text-neutral-900"
      />
      <textarea
        value={memo}
        maxLength={ITINERARY_MEMO_MAX_LENGTH}
        placeholder="例: 開場30分前に到着"
        onChange={(e) => setMemo(e.target.value)}
        rows={2}
        className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-base text-neutral-900"
      />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="h-11 px-3 text-base text-neutral-500">
          キャンセル
        </button>
        <button
          type="submit"
          className="h-11 rounded-lg bg-pink-500 px-4 text-base font-semibold text-white"
        >
          保存
        </button>
      </div>
    </form>
  );
}
