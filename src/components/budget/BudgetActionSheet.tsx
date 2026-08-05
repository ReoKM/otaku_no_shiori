"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/list-ui/BottomSheet";
import {
  BUDGET_LABEL_MAX_LENGTH,
  normalizeAmountInput,
  validateBudgetAmount,
  validateBudgetLabel,
} from "@/lib/budget-validation";
import type { BudgetItem } from "@/types/shiori";

interface BudgetActionSheetProps {
  item: BudgetItem;
  onSave: (label: string, amount: number) => void;
  onDelete: () => void;
  onClose: () => void;
}

/**
 * S3b2 行の「…」/行タップから開く編集/削除シート。
 * 参照: docs/design/screens/S3b2_予算.md「BudgetActionSheet(行メニューシート)」
 *
 * `todo/TodoActionSheet.tsx`と同じ役割だが、期限日ではなく金額を編集する。
 * 削除は1段階確認を挟んでから確定する(やることタブと同じ)。
 */
export function BudgetActionSheet({ item, onSave, onDelete, onClose }: BudgetActionSheetProps) {
  const [label, setLabel] = useState(item.label);
  const [amount, setAmount] = useState(String(item.amount));
  const [labelError, setLabelError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function handleSave() {
    const labelValidationError = validateBudgetLabel(label);
    const amountValidationError = validateBudgetAmount(amount);
    if (labelValidationError || amountValidationError) {
      setLabelError(labelValidationError);
      setAmountError(amountValidationError);
      return;
    }
    onSave(label.trim(), Number(amount));
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
      <label className="block px-1 pb-1.5 text-xs font-medium text-ink-muted" htmlFor="budget-item-label">
        費目名
      </label>
      <input
        id="budget-item-label"
        type="text"
        value={label}
        maxLength={BUDGET_LABEL_MAX_LENGTH}
        autoFocus
        onChange={(event) => {
          setLabel(event.target.value);
          setLabelError(null);
        }}
        className={`min-h-12 w-full rounded-xl border-[1.5px] bg-white px-3.5 text-base font-medium text-ink outline-none ${
          labelError ? "border-red-400" : "border-sakura-field"
        }`}
      />
      {labelError && <p className="mt-2 px-1 text-xs font-medium text-red-600">{labelError}</p>}

      <label className="mt-4 block px-1 pb-1.5 text-xs font-medium text-ink-muted" htmlFor="budget-item-amount">
        金額
      </label>
      <div
        className={`flex min-h-12 items-center gap-1 rounded-xl border-[1.5px] bg-white px-3.5 ${
          amountError ? "border-red-400" : "border-sakura-field"
        }`}
      >
        <span className="text-base font-medium text-ink-muted">¥</span>
        <input
          id="budget-item-amount"
          type="text"
          inputMode="numeric"
          value={amount}
          onChange={(event) => {
            setAmount(normalizeAmountInput(event.target.value));
            setAmountError(null);
          }}
          className="min-h-12 w-full bg-transparent text-base font-medium text-ink outline-none"
        />
      </div>
      {amountError && <p className="mt-2 px-1 text-xs font-medium text-red-600">{amountError}</p>}

      <div className="mt-4 flex gap-2">
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
