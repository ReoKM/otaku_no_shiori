"use client";

import { useState } from "react";
import { BUDGET_MEMO_MAX_LENGTH, isBudgetMemoTooLong } from "@/lib/budget-validation";

interface BudgetMemoCardProps {
  /** 保存済みのメモ本文。未入力は空文字。 */
  value: string;
  onSave: (value: string) => void;
}

/**
 * S3b2 BudgetMemoCard(予算セクション全体で1本のメモ)。
 * 参照: docs/design/screens/S3b2_予算.md「BudgetMemoCard」
 *
 * 費目ごとではなく予算セクション全体の注記(交通費は早割で確保済み、等)を1本持つ。
 * カードをタップすると編集状態になり、複数行入力欄+文字数カウンタを出す。
 */
export function BudgetMemoCard({ value, onSave }: BudgetMemoCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        className="mt-6 w-full rounded-2xl border border-paper-border bg-paper-surface p-4 text-left"
      >
        <p className="text-[13px] font-bold text-ink-label">メモ</p>
        <p
          className={`mt-1.5 whitespace-pre-wrap text-base ${
            value ? "font-medium text-ink" : "text-ink-muted"
          }`}
        >
          {value || "例:交通費は早割で確保済み。グッズは現地で追加購入するかも"}
        </p>
      </button>
    );
  }

  const tooLong = isBudgetMemoTooLong(draft);

  return (
    <div className="mt-6 rounded-2xl border border-paper-border bg-paper-surface p-4">
      <p className="pb-1.5 text-[13px] font-bold text-ink-label">メモ</p>
      <textarea
        value={draft}
        rows={4}
        autoFocus
        placeholder="例:交通費は早割で確保済み。グッズは現地で追加購入するかも"
        onChange={(event) => setDraft(event.target.value)}
        className="w-full rounded-xl border-[1.5px] border-sakura-field bg-sakura-tint px-3.5 py-3 text-base font-medium text-ink outline-none"
      />
      <p className={`mt-1 text-right text-xs ${tooLong ? "font-medium text-red-600" : "text-ink-muted"}`}>
        {draft.length}/{BUDGET_MEMO_MAX_LENGTH}
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="min-h-11.5 flex-none rounded-xl border border-paper-dashed bg-white px-4.5 text-sm font-medium text-ink-label"
        >
          キャンセル
        </button>
        <button
          type="button"
          disabled={tooLong}
          onClick={() => {
            onSave(draft.trim());
            setEditing(false);
          }}
          className={`min-h-11.5 flex-1 rounded-xl text-[15px] font-bold text-white ${
            tooLong ? "bg-paper-track-border" : "bg-sakura"
          }`}
        >
          保存する
        </button>
      </div>
    </div>
  );
}
