"use client";

import { useState } from "react";
import { PlusIcon } from "@/components/list-ui/icons";
import { TODO_LABEL_MAX_LENGTH, validateTodoLabel } from "@/lib/todo-validation";

interface AddFormProps {
  /** 入力欄を開いているか。閉じているときは「やることを追加」行を出す。 */
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onAdd: (label: string) => void;
}

/**
 * S3b AddForm(リスト末尾のインライン追加行)。
 * 参照: docs/design/screens/S3b_TODO.md「AddForm(インライン追加)」
 *
 * 画面下に固定していた旧フォームをやめ、リストカードの末尾に置く。
 * 期限は登録後に行メニューから設定する形にして、追加時の入力を名前1つに絞る
 * (遠征前に思いついた順でどんどん足せるようにするため)。
 */
export function AddForm({ open, onOpen, onClose, onAdd }: AddFormProps) {
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    const validationError = validateTodoLabel(label);
    if (validationError) {
      setError(validationError);
      return;
    }
    onAdd(label.trim());
    setLabel("");
    setError(null);
  }

  function handleClose() {
    setLabel("");
    setError(null);
    onClose();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="flex min-h-15 w-full items-center gap-2 border-t border-paper-divider bg-paper-surface px-4 text-left text-[15px] font-bold text-sakura-ink"
      >
        <PlusIcon />
        やることを追加
      </button>
    );
  }

  return (
    <div className="border-t border-paper-divider bg-sakura-tint px-4 pt-3 pb-4">
      <input
        type="text"
        value={label}
        maxLength={TODO_LABEL_MAX_LENGTH}
        placeholder="例:チケット当落確認"
        autoFocus
        aria-label="追加するやることの名前"
        onChange={(event) => {
          setLabel(event.target.value);
          if (error) {
            setError(null);
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
          error ? "border-red-400" : "border-sakura-field"
        }`}
      />
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
      {error && <p className="mt-2.5 text-[12.5px] font-medium text-red-600">{error}</p>}
      <p className="mt-2.5 text-xs text-ink-muted">期限は登録後に行から設定できます</p>
    </div>
  );
}
