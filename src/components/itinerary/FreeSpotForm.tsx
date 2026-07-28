"use client";

import { useState } from "react";
import { SPOT_MEMO_MAX_LENGTH, SPOT_NAME_MAX_LENGTH, validateSpotName } from "@/lib/spot-validation";

export interface NewSpotValues {
  name: string;
  memo: string | null;
}

interface FreeSpotFormProps {
  onSave: (values: NewSpotValues) => void;
  onCancel: () => void;
}

/**
 * S3c FreeSpotForm(自由入力フォーム、AddSpotBar直下にインライン表示)。
 * 参照: docs/design/screens/S3c_旅程スポット.md「FreeSpotForm(自由入力フォーム、インライン表示)」
 */
export function FreeSpotForm({ onSave, onCancel }: FreeSpotFormProps) {
  const [name, setName] = useState("");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validateSpotName(name);
    if (validationError) {
      setError(validationError);
      return;
    }
    onSave({ name: name.trim(), memo: memo.trim() || null });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 flex flex-col gap-2 rounded-2xl border border-paper-border bg-sakura-tint px-4 py-3.5"
    >
      <input
        type="text"
        value={name}
        maxLength={SPOT_NAME_MAX_LENGTH}
        placeholder="例: ○○神社"
        aria-label="スポット名"
        onChange={(e) => {
          setName(e.target.value);
          if (error) {
            setError(null);
          }
        }}
        className={`min-h-12 w-full rounded-xl border-[1.5px] bg-white px-3.5 text-base font-medium text-ink outline-none ${
          error ? "border-red-400" : "border-sakura-field"
        }`}
      />
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      <textarea
        value={memo}
        maxLength={SPOT_MEMO_MAX_LENGTH}
        placeholder="例: 聖地巡礼で行きたい"
        aria-label="メモ"
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
