"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/list-ui/BottomSheet";
import { normalizeAmountInput, validateBudgetAmount } from "@/lib/budget-validation";

interface BudgetTotalSheetProps {
  /** 現在の総額。未設定はnull(この場合「予算をクリアする」は出さない)。 */
  current: number | null;
  onSave: (amount: number) => void;
  onClear: () => void;
  onClose: () => void;
}

/**
 * S3b2 BudgetTotalSheet(総額入力シート)。
 * 参照: docs/design/screens/S3b2_予算.md「BudgetTotalSheet(総額入力シート)」
 *
 * クリアは1段階確認を挟む(`TodoActionSheet`の削除確認と同じ考え方)。
 * クリアしても費目・メモは残す(呼び出し側`BudgetSection`が`budget_total`のみ更新する)。
 */
export function BudgetTotalSheet({ current, onSave, onClear, onClose }: BudgetTotalSheetProps) {
  const [value, setValue] = useState(current !== null ? String(current) : "");
  const [error, setError] = useState<string | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);

  function handleSave() {
    const validationError = validateBudgetAmount(value);
    if (validationError) {
      setError(validationError);
      return;
    }
    onSave(Number(value));
  }

  if (confirmingClear) {
    return (
      <BottomSheet title="予算総額" onClose={onClose}>
        <p className="px-1 pb-4 text-[15px] leading-relaxed text-ink">
          予算総額を未設定に戻します。費目とメモは残ります
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setConfirmingClear(false)}
            className="min-h-12 flex-none rounded-xl border border-paper-dashed bg-white px-4.5 text-sm font-medium text-ink-label"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onClear}
            className="min-h-12 flex-1 rounded-xl bg-red-600 text-[15px] font-bold text-white"
          >
            予算をクリアする
          </button>
        </div>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet title="予算総額" onClose={onClose}>
      <div
        className={`flex min-h-12 items-center gap-1 rounded-xl border-[1.5px] bg-white px-3.5 ${
          error ? "border-red-400" : "border-sakura-field"
        }`}
      >
        <span className="text-base font-medium text-ink-muted">¥</span>
        <input
          type="text"
          inputMode="numeric"
          value={value}
          placeholder="50000"
          autoFocus
          aria-label="予算総額"
          onChange={(event) => {
            setValue(normalizeAmountInput(event.target.value));
            if (error) {
              setError(null);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSave();
            }
          }}
          className="min-h-12 w-full bg-transparent text-base font-medium text-ink outline-none"
        />
      </div>
      {error && <p className="mt-2 px-1 text-xs font-medium text-red-600">{error}</p>}
      <p className="mt-2.5 px-1 text-xs text-ink-muted">あとから変更できます</p>
      <button
        type="button"
        onClick={handleSave}
        className="mt-3 min-h-11 w-full rounded-btn bg-sakura text-[15px] font-bold text-white"
      >
        保存する
      </button>
      {current !== null && (
        <button
          type="button"
          onClick={() => setConfirmingClear(true)}
          className="mt-3 min-h-11 w-full text-[13px] font-medium text-red-600"
        >
          予算をクリアする
        </button>
      )}
    </BottomSheet>
  );
}
