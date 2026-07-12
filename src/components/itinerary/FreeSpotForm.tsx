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
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 px-4 py-3">
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
        className={`h-11 w-full rounded-lg border bg-white px-3 text-base text-neutral-900 ${
          error ? "border-red-400" : "border-neutral-200"
        }`}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <textarea
        value={memo}
        maxLength={SPOT_MEMO_MAX_LENGTH}
        placeholder="例: 聖地巡礼で行きたい"
        aria-label="メモ"
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
          追加
        </button>
      </div>
    </form>
  );
}
