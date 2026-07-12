/**
 * S3b TodoRow(通常モード/編集中/削除確認中の1行)。
 * 参照: docs/design/screens/S3b_TODO.md「TodoRow(通常モード)」「TodoRow(編集中)」「TodoRow(削除確認中)」
 */
import { formatDueDate } from "@/lib/todo-sort";
import { TODO_LABEL_MAX_LENGTH } from "@/lib/todo-validation";
import type { Todo } from "@/types/shiori";

export type TodoRowMode = "view" | "edit" | "delete";

interface TodoRowProps {
  item: Todo;
  mode: TodoRowMode;
  dueToday: boolean;
  onToggleDone: () => void;
  onStartEdit: () => void;
  onStartDelete: () => void;

  editLabel: string;
  editDueDate: string;
  editError: string | null;
  onEditLabelChange: (value: string) => void;
  onEditDueDateChange: (value: string) => void;
  onClearEditDueDate: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;

  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

export function TodoRow({
  item,
  mode,
  dueToday,
  onToggleDone,
  onStartEdit,
  onStartDelete,
  editLabel,
  editDueDate,
  editError,
  onEditLabelChange,
  onEditDueDateChange,
  onClearEditDueDate,
  onSaveEdit,
  onCancelEdit,
  onConfirmDelete,
  onCancelDelete,
}: TodoRowProps) {
  const highlightClass = dueToday
    ? "border-l-4 border-amber-400 bg-amber-50"
    : "border-l-4 border-transparent";

  if (mode === "edit") {
    return (
      <div className={`flex min-h-14 flex-col gap-2 px-4 py-3 ${highlightClass}`}>
        <input
          type="text"
          value={editLabel}
          maxLength={TODO_LABEL_MAX_LENGTH}
          onChange={(e) => onEditLabelChange(e.target.value)}
          className="h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-base text-neutral-900"
        />
        {editError && <p className="text-xs text-red-600">{editError}</p>}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={editDueDate}
            onChange={(e) => onEditDueDateChange(e.target.value)}
            className="h-11 flex-1 rounded-lg border border-neutral-200 bg-white px-3 text-base text-neutral-900"
          />
          {editDueDate && (
            <button type="button" onClick={onClearEditDueDate} className="text-xs text-neutral-500 underline">
              期限を削除
            </button>
          )}
        </div>
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
      <div className={`flex min-h-14 items-center justify-between gap-2 px-4 ${highlightClass}`}>
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
    <div className={`flex min-h-14 items-center gap-2 px-4 ${highlightClass}`}>
      <button
        type="button"
        role="checkbox"
        aria-checked={item.is_done}
        aria-label={item.is_done ? "未完了に戻す" : "完了にする"}
        onClick={onToggleDone}
        className="flex h-11 w-11 shrink-0 items-center justify-center"
      >
        <span
          className={`flex h-5 w-5 items-center justify-center rounded border ${
            item.is_done ? "border-pink-500 bg-pink-500 text-white" : "border-neutral-400"
          }`}
          aria-hidden="true"
        >
          {item.is_done ? "✓" : ""}
        </span>
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={`text-base ${
            item.is_done ? "text-neutral-400 line-through" : "text-neutral-900"
          }`}
        >
          {item.label}
        </p>
        {item.due_date && (
          <p className={`text-sm ${dueToday ? "text-amber-700" : "text-neutral-500"}`}>
            {formatDueDate(item.due_date)}
            {dueToday ? "(今日)" : ""}
          </p>
        )}
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
  );
}
