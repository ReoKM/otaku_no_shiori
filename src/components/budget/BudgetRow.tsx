"use client";

/**
 * S3b2 BudgetRow(費目リストの1行、高さ56px)。
 * 参照: docs/design/screens/S3b2_予算.md「BudgetRow(1行)」
 *
 * チェック状態を持たないため、行の左側(費目名〜金額)全体は完了トグルではなく
 * `BudgetActionSheet`を開くボタンにする。
 */
import { MoreIcon } from "@/components/list-ui/icons";
import { formatYen } from "@/lib/budget-validation";
import type { BudgetItem } from "@/types/shiori";

interface BudgetRowProps {
  item: BudgetItem;
  /** 追加直後の行はハイライトを一度だけ流す。 */
  flash: boolean;
  onOpenMenu: () => void;
}

export function BudgetRow({ item, flash, onOpenMenu }: BudgetRowProps) {
  return (
    <div
      className={`flex min-h-14 items-center border-t border-paper-divider bg-paper-surface first:border-t-0 ${
        flash ? "animate-[paper-flash_1.2s_ease]" : ""
      }`}
    >
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex min-h-14 min-w-0 flex-1 items-center justify-between gap-3 px-4 text-left"
      >
        <span className="min-w-0 flex-1 truncate text-base font-medium text-ink">{item.label}</span>
        <span className="flex-none text-base font-medium tabular-nums text-ink">
          {formatYen(item.amount)}
        </span>
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
