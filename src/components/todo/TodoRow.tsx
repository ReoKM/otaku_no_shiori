"use client";

/**
 * S3b TodoRow(やることリストの1行、高さ68px)。
 * 参照: docs/design/screens/S3b_TODO.md「TodoRow」
 *
 * 持ち物の`PackingRow`と同じ構造に、期限日の1行を足したもの。
 * 行の左側全体が完了トグル、名前の編集・期限変更・削除は右端の「…」から開くシートで行う。
 */
import { ListCheckbox } from "@/components/list-ui/ListCheckbox";
import { MoreIcon } from "@/components/list-ui/icons";
import { formatDueDate } from "@/lib/todo-sort";
import type { Todo } from "@/types/shiori";

interface TodoRowProps {
  item: Todo;
  /** 期限が今日の未完了項目は行を強調する。 */
  dueToday: boolean;
  /** 追加直後の行はハイライトを一度だけ流す。 */
  flash: boolean;
  onToggleDone: () => void;
  onOpenMenu: () => void;
}

export function TodoRow({ item, dueToday, flash, onToggleDone, onOpenMenu }: TodoRowProps) {
  return (
    <div
      className={`flex min-h-17 items-center border-t border-paper-divider first:border-t-0 ${
        dueToday ? "border-l-4 border-l-amber-400 bg-amber-50" : "bg-paper-surface"
      } ${flash ? "animate-[paper-flash_1.2s_ease]" : ""}`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={item.is_done}
        onClick={onToggleDone}
        className="flex min-h-17 min-w-0 flex-1 items-center gap-3 py-1.5 pl-4 text-left"
      >
        <ListCheckbox checked={item.is_done} />
        <span className="min-w-0 flex-1">
          <span
            className={`line-clamp-2 block text-base/[1.4] ${
              item.is_done ? "font-normal text-ink-done line-through" : "font-medium text-ink"
            }`}
          >
            {item.label}
          </span>
          {item.due_date && (
            <span
              className={`mt-0.5 block text-xs font-medium ${
                item.is_done
                  ? "text-ink-faint"
                  : dueToday
                    ? "text-amber-700"
                    : "text-ink-muted"
              }`}
            >
              期限 {formatDueDate(item.due_date)}
              {dueToday && "・今日"}
            </span>
          )}
        </span>
        {item.is_done && (
          <span className="flex-none text-[11px] font-bold tracking-[0.06em] text-ink-faint">済</span>
        )}
      </button>
      <button
        type="button"
        aria-label={`${item.label}の編集・削除`}
        onClick={onOpenMenu}
        className="flex h-11 w-11 flex-none items-center justify-center text-ink-faint"
      >
        <MoreIcon />
      </button>
    </div>
  );
}
