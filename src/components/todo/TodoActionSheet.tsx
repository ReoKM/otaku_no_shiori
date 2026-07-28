"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/list-ui/BottomSheet";
import { TODO_LABEL_MAX_LENGTH, validateTodoLabel } from "@/lib/todo-validation";
import type { Todo } from "@/types/shiori";

interface TodoActionSheetProps {
  item: Todo;
  onSave: (label: string, dueDate: string | null) => void;
  onDelete: () => void;
  onClose: () => void;
}

/**
 * S3b 行の「…」から開く編集/削除シート。
 * 参照: docs/design/screens/S3b_TODO.md「行メニューシート」
 *
 * 持ち物の`RowActionSheet`と同じ役割だが、やることは期限日も編集するため専用に持つ。
 * 削除は押し間違いが取り返しにくいので、シート内で1段階確認してから確定する。
 */
export function TodoActionSheet({ item, onSave, onDelete, onClose }: TodoActionSheetProps) {
  const [label, setLabel] = useState(item.label);
  const [dueDate, setDueDate] = useState(item.due_date ?? "");
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function handleSave() {
    const validationError = validateTodoLabel(label);
    if (validationError) {
      setError(validationError);
      return;
    }
    onSave(label.trim(), dueDate || null);
  }

  if (confirmingDelete) {
    return (
      <BottomSheet title="削除の確認" onClose={onClose}>
        <p className="px-1 pb-4 text-[15px] leading-relaxed text-ink">
          「{item.label}」を削除します。よろしいですか?
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setConfirmingDelete(false)}
            className="min-h-12 flex-none rounded-xl border border-paper-dashed bg-white px-4.5 text-sm font-medium text-ink-label"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="min-h-12 flex-1 rounded-xl bg-red-600 text-[15px] font-bold text-white"
          >
            削除する
          </button>
        </div>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet title={item.label} onClose={onClose}>
      <label className="block px-1 pb-1.5 text-xs font-medium text-ink-muted" htmlFor="todo-label">
        やること
      </label>
      <input
        id="todo-label"
        type="text"
        value={label}
        maxLength={TODO_LABEL_MAX_LENGTH}
        autoFocus
        onChange={(event) => {
          setLabel(event.target.value);
          setError(null);
        }}
        className={`min-h-12 w-full rounded-xl border-[1.5px] bg-white px-3.5 text-base font-medium text-ink outline-none ${
          error ? "border-red-400" : "border-sakura-field"
        }`}
      />
      {error && <p className="mt-2 px-1 text-xs font-medium text-red-600">{error}</p>}

      <label className="mt-4 block px-1 pb-1.5 text-xs font-medium text-ink-muted" htmlFor="todo-due">
        期限(任意)
      </label>
      <div className="flex items-center gap-2">
        <input
          id="todo-due"
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          className="min-h-12 flex-1 rounded-xl border border-paper-dashed bg-white px-3.5 text-base font-medium text-ink outline-none"
        />
        {dueDate && (
          <button
            type="button"
            onClick={() => setDueDate("")}
            className="min-h-12 flex-none rounded-xl border border-paper-dashed bg-white px-3.5 text-[13px] font-medium text-ink-label"
          >
            期限を消す
          </button>
        )}
      </div>

      <div className="mt-2.5 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="min-h-12 flex-none rounded-xl border border-paper-dashed bg-white px-4.5 text-sm font-medium text-ink-label"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="min-h-12 flex-1 rounded-xl bg-sakura text-[15px] font-bold text-white"
        >
          保存する
        </button>
      </div>
      <button
        type="button"
        onClick={() => setConfirmingDelete(true)}
        className="mt-3 min-h-12 w-full rounded-xl text-[15px] font-bold text-red-600"
      >
        削除する
      </button>
    </BottomSheet>
  );
}
