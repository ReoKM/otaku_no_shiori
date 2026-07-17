"use client";

import { useRef, useState } from "react";
import { TODO_LABEL_MAX_LENGTH, validateTodoLabel } from "@/lib/todo-validation";

interface AddFormProps {
  onAdd: (label: string, dueDate: string | null) => void;
}

/**
 * S3b AddForm(手動追加フォーム)。
 * 参照: docs/design/screens/S3b_TODO.md「AddForm(手動追加フォーム)」
 */
export function AddForm({ onAdd }: AddFormProps) {
  const [label, setLabel] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validateTodoLabel(label);
    if (validationError) {
      setError(validationError);
      return;
    }
    onAdd(label.trim(), dueDate || null);
    setLabel("");
    setDueDate("");
    setError(null);
    labelInputRef.current?.focus();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="sticky bottom-[var(--s3-tabbar-height)] flex flex-col gap-2 border-t border-neutral-200 bg-white px-4 py-4"
    >
      <input
        ref={labelInputRef}
        type="text"
        value={label}
        maxLength={TODO_LABEL_MAX_LENGTH}
        placeholder="例: チケット当落確認"
        onChange={(e) => {
          setLabel(e.target.value);
          if (error) {
            setError(null);
          }
        }}
        className={`h-11 w-full rounded-lg border bg-white px-3 text-base text-neutral-900 ${
          error ? "border-red-400" : "border-neutral-200"
        }`}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={dueDate}
          aria-label="期限日(任意)"
          placeholder="期限日(任意)"
          onChange={(e) => setDueDate(e.target.value)}
          className="h-11 flex-1 rounded-lg border border-neutral-200 bg-white px-3 text-base text-neutral-900"
        />
        {dueDate && (
          <button
            type="button"
            aria-label="期限日をクリア"
            onClick={() => setDueDate("")}
            className="flex h-11 w-11 shrink-0 items-center justify-center text-neutral-500"
          >
            ×
          </button>
        )}
        <button
          type="submit"
          className="h-11 shrink-0 rounded-lg bg-pink-500 px-4 text-base font-semibold text-white"
        >
          追加
        </button>
      </div>
    </form>
  );
}
