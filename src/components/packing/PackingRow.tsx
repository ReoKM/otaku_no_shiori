"use client";

import { useState } from "react";
import { validatePackingLabel, PACKING_LABEL_MAX_LENGTH } from "@/lib/packing-validation";
import type { PackingItem } from "@/types/shiori";

interface PackingRowProps {
  item: PackingItem;
  onToggleCheck: (id: string) => void;
  onSaveLabel: (id: string, label: string) => void;
  onDelete: (id: string) => void;
}

type RowMode = "view" | "edit" | "delete-confirm";

/**
 * S3a PackingRow(通常モード/編集中/削除確認中の1行)。
 * 参照: docs/design/screens/S3a_持ち物.md「PackingRow」
 * 行内の一時的な表示モード(編集中/削除確認中)はこの行の中だけで完結させる。
 */
export function PackingRow({ item, onToggleCheck, onSaveLabel, onDelete }: PackingRowProps) {
  const [mode, setMode] = useState<RowMode>("view");
  const [draft, setDraft] = useState(item.label);
  const [error, setError] = useState<string | null>(null);

  function startEdit() {
    setDraft(item.label);
    setError(null);
    setMode("edit");
  }

  function saveEdit() {
    const validationError = validatePackingLabel(draft);
    if (validationError) {
      setError(validationError);
      return;
    }
    onSaveLabel(item.id, draft.trim());
    setMode("view");
  }

  function cancelEdit() {
    setError(null);
    setMode("view");
  }

  if (mode === "delete-confirm") {
    return (
      <div className="flex min-h-14 items-center justify-between gap-2 border-b border-neutral-100 px-4">
        <p className="text-xs text-neutral-500">本当に削除しますか？</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="flex h-11 items-center px-2 text-sm text-red-600"
          >
            削除
          </button>
          <button
            type="button"
            onClick={() => setMode("view")}
            className="flex h-11 items-center px-2 text-sm text-neutral-500"
          >
            キャンセル
          </button>
        </div>
      </div>
    );
  }

  if (mode === "edit") {
    return (
      <div className="flex min-h-14 items-center gap-2 border-b border-neutral-100 px-4">
        <div className="min-w-0 flex-1">
          <input
            type="text"
            value={draft}
            maxLength={PACKING_LABEL_MAX_LENGTH}
            onChange={(event) => setDraft(event.target.value)}
            className={`h-11 w-full rounded-lg border px-3 text-base text-neutral-900 ${
              error ? "border-red-400 bg-red-50" : "border-neutral-200 bg-white"
            }`}
          />
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
        <button
          type="button"
          aria-label="保存"
          onClick={saveEdit}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-pink-500"
        >
          ✓
        </button>
        <button
          type="button"
          aria-label="編集をキャンセル"
          onClick={cancelEdit}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-14 items-center gap-2 border-b border-neutral-100 px-4 transition-colors hover:bg-neutral-50">
      <label className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
        <input
          type="checkbox"
          checked={item.is_checked}
          onChange={() => onToggleCheck(item.id)}
          className="h-6 w-6 rounded-md border-neutral-200 accent-pink-500"
        />
      </label>
      <p
        className={`line-clamp-2 min-w-0 flex-1 text-base ${
          item.is_checked ? "text-neutral-400 line-through" : "text-neutral-900"
        }`}
      >
        {item.label}
      </p>
      <button
        type="button"
        aria-label="編集"
        onClick={startEdit}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100"
      >
        ✏️
      </button>
      <button
        type="button"
        aria-label="削除"
        onClick={() => setMode("delete-confirm")}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100"
      >
        🗑
      </button>
    </div>
  );
}
