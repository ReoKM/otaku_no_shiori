"use client";

import { PlusIcon } from "@/components/list-ui/icons";
import { PACKING_LABEL_MAX_LENGTH } from "@/lib/packing-validation";

interface PackingAddFormProps {
  /** 入力欄を開いているか。閉じているときは「持ち物を追加」行を出す。 */
  open: boolean;
  value: string;
  error: string | null;
  /** 同名の持ち物が既にある場合の注意表示(エラーではなく登録は可能)。 */
  duplicate: boolean;
  onOpen: () => void;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

/**
 * S3a AddForm(リスト末尾のインライン追加行)。
 * 参照: docs/design/screens/S3a_持ち物.md「AddForm(インライン追加)」
 *
 * 画面下に固定していた旧フォームをやめ、リストカードの末尾に置く。
 * 登録してもフォームは開いたままにして、続けて入力できるようにする。
 */
export function PackingAddForm({
  open,
  value,
  error,
  duplicate,
  onOpen,
  onChange,
  onSubmit,
  onCancel,
}: PackingAddFormProps) {
  if (!open) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="flex min-h-15 w-full items-center gap-2 border-t border-paper-divider bg-paper-surface px-4 text-left text-[15px] font-bold text-sakura-ink"
      >
        <PlusIcon />
        持ち物を追加
      </button>
    );
  }

  return (
    <div className="border-t border-paper-divider bg-sakura-tint px-4 pt-3 pb-4">
      <input
        type="text"
        value={value}
        maxLength={PACKING_LABEL_MAX_LENGTH}
        placeholder="例:モバイルバッテリー"
        autoFocus
        aria-label="追加する持ち物の名前"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSubmit();
          }
          if (event.key === "Escape") {
            onCancel();
          }
        }}
        className={`min-h-12 w-full rounded-xl border-[1.5px] bg-white px-3.5 text-base font-medium text-ink outline-none ${
          error ? "border-red-400" : "border-sakura-field"
        }`}
      />
      <div className="mt-2.5 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11.5 flex-none rounded-xl border border-paper-dashed bg-white px-4.5 text-sm font-medium text-ink-label"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="min-h-11.5 flex-1 rounded-xl bg-sakura text-[15px] font-bold text-white"
        >
          登録する
        </button>
      </div>
      {error && <p className="mt-2.5 text-[12.5px] font-medium text-red-600">{error}</p>}
      {!error && duplicate && (
        <p className="mt-2.5 text-[12.5px] font-medium text-sakura-ink">
          同じ名前の持ち物がすでにあります
        </p>
      )}
      <p className="mt-2.5 text-xs text-ink-muted">Enterで登録　続けて入力できます</p>
    </div>
  );
}
