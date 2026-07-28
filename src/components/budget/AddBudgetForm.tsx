"use client";

import { useState } from "react";
import { PlusIcon } from "@/components/list-ui/icons";
import {
  BUDGET_LABEL_MAX_LENGTH,
  normalizeAmountInput,
  validateBudgetAmount,
  validateBudgetLabel,
} from "@/lib/budget-validation";

interface AddBudgetFormProps {
  /** 入力欄を開いているか。閉じているときは「費目を追加」行を出す。 */
  open: boolean;
  /** 費目件数が上限(20件)に達しているか。達している間は追加行の代わりに注記を出す。 */
  disabled: boolean;
  onOpen: () => void;
  onClose: () => void;
  onAdd: (label: string, amount: number) => void;
}

/**
 * S3b2 AddBudgetForm(リスト末尾のインライン追加行)。
 * 参照: docs/design/screens/S3b2_予算.md「AddBudgetForm(インライン追加)」
 *
 * `todo/AddForm.tsx`と同じ構成に、金額入力欄を1つ足したもの。
 */
export function AddBudgetForm({ open, disabled, onOpen, onClose, onAdd }: AddBudgetFormProps) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [labelError, setLabelError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  function resetForm() {
    setLabel("");
    setAmount("");
    setLabelError(null);
    setAmountError(null);
  }

  function handleSubmit() {
    const labelValidationError = validateBudgetLabel(label);
    const amountValidationError = validateBudgetAmount(amount);
    if (labelValidationError || amountValidationError) {
      setLabelError(labelValidationError);
      setAmountError(amountValidationError);
      return;
    }
    onAdd(label.trim(), Number(amount));
    resetForm();
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  if (!open) {
    if (disabled) {
      return (
        <p className="border-t border-paper-divider bg-paper-surface px-4 py-4 text-center text-xs text-ink-muted">
          費目は20件までです
        </p>
      );
    }
    return (
      <button
        type="button"
        onClick={onOpen}
        className="flex min-h-15 w-full items-center gap-2 border-t border-paper-divider bg-paper-surface px-4 text-left text-[15px] font-bold text-sakura-ink"
      >
        <PlusIcon />
        費目を追加
      </button>
    );
  }

  return (
    <div className="border-t border-paper-divider bg-sakura-tint px-4 pt-3 pb-4">
      <input
        type="text"
        value={label}
        maxLength={BUDGET_LABEL_MAX_LENGTH}
        placeholder="例:交通費"
        autoFocus
        aria-label="追加する費目名"
        onChange={(event) => {
          setLabel(event.target.value);
          if (labelError) {
            setLabelError(null);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            handleSubmit();
          }
          if (event.key === "Escape") {
            handleClose();
          }
        }}
        className={`min-h-12 w-full rounded-xl border-[1.5px] bg-white px-3.5 text-base font-medium text-ink outline-none ${
          labelError ? "border-red-400" : "border-sakura-field"
        }`}
      />
      {labelError && <p className="mt-1.5 text-[12.5px] font-medium text-red-600">{labelError}</p>}

      <div
        className={`mt-2.5 flex min-h-12 items-center gap-1 rounded-xl border-[1.5px] bg-white px-3.5 ${
          amountError ? "border-red-400" : "border-sakura-field"
        }`}
      >
        <span className="text-base font-medium text-ink-muted">¥</span>
        <input
          type="text"
          inputMode="numeric"
          value={amount}
          placeholder="0"
          aria-label="追加する費目の金額"
          onChange={(event) => {
            setAmount(normalizeAmountInput(event.target.value));
            if (amountError) {
              setAmountError(null);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSubmit();
            }
            if (event.key === "Escape") {
              handleClose();
            }
          }}
          className="min-h-12 w-full bg-transparent text-base font-medium text-ink outline-none"
        />
      </div>
      {amountError && <p className="mt-1.5 text-[12.5px] font-medium text-red-600">{amountError}</p>}

      <div className="mt-2.5 flex gap-2">
        <button
          type="button"
          onClick={handleClose}
          className="min-h-11.5 flex-none rounded-xl border border-paper-dashed bg-white px-4.5 text-sm font-medium text-ink-label"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="min-h-11.5 flex-1 rounded-xl bg-sakura text-[15px] font-bold text-white"
        >
          登録する
        </button>
      </div>
      <p className="mt-2.5 text-xs text-ink-muted">金額はあとから変更できます</p>
    </div>
  );
}
