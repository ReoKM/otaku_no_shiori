"use client";

import { useState } from "react";
import { BottomSheet } from "./BottomSheet";

interface RowActionSheetProps {
  /** シート見出しに出す対象の名前。 */
  title: string;
  /** 名前の初期値(編集欄に入る)。 */
  initialLabel: string;
  maxLength: number;
  /** 名前を検証する。問題があればエラー文言を、無ければnullを返す。 */
  validate: (value: string) => string | null;
  onSave: (label: string) => void;
  onDelete: () => void;
  onClose: () => void;
}

/**
 * 行の「…」から開く編集/削除シート。
 * 参照: docs/design/screens/S3a_持ち物.md「行メニューシート」
 *
 * 新デザインは行タップを完了トグルに割り当てるため、編集・削除はこのシートに集約する
 * (行内に編集✏️・削除🗑ボタンを並べる旧UIを置き換える)。
 * 削除は押し間違いが取り返しにくいので、シート内で1段階確認してから確定する。
 */
export function RowActionSheet({
  title,
  initialLabel,
  maxLength,
  validate,
  onSave,
  onDelete,
  onClose,
}: RowActionSheetProps) {
  const [label, setLabel] = useState(initialLabel);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function handleSave() {
    const validationError = validate(label);
    if (validationError) {
      setError(validationError);
      return;
    }
    onSave(label.trim());
  }

  if (confirmingDelete) {
    return (
      <BottomSheet title="削除の確認" onClose={onClose}>
        <p className="px-1 pb-4 text-[15px] leading-relaxed text-ink">
          「{title}」を削除します。よろしいですか?
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
    <BottomSheet title={title} onClose={onClose}>
      <label className="block px-1 pb-1.5 text-xs font-medium text-ink-muted" htmlFor="row-action-label">
        名前
      </label>
      <input
        id="row-action-label"
        type="text"
        value={label}
        maxLength={maxLength}
        autoFocus
        onChange={(event) => {
          setLabel(event.target.value);
          setError(null);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            handleSave();
          }
        }}
        className={`min-h-12 w-full rounded-xl border-[1.5px] bg-white px-3.5 text-base font-medium text-ink outline-none ${
          error ? "border-red-400" : "border-sakura-field"
        }`}
      />
      {error && <p className="mt-2 px-1 text-xs font-medium text-red-600">{error}</p>}
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
