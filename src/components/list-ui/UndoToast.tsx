"use client";

interface UndoToastProps {
  message: string;
  onUndo: () => void;
}

/**
 * 削除直後に画面下部へ出る取り消しトースト。
 * 参照: docs/design/screens/S3a_持ち物.md「削除の取り消し」
 *
 * 自動で消える時間の管理は呼び出し側(`useUndoToast`)が持つ。
 * ここは見た目と「元に戻す」ボタンだけを担当する。
 */
export function UndoToast({ message, onUndo }: UndoToastProps) {
  return (
    <div
      role="status"
      className="fixed inset-x-6 bottom-[86px] z-40 flex animate-[paper-fade-up_0.18s_ease] items-center justify-between gap-3 rounded-xl bg-ink px-3.5 py-3 text-[13.5px] font-medium text-paper"
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onUndo}
        className="min-h-8 shrink-0 text-[13.5px] font-bold text-sakura-undo"
      >
        元に戻す
      </button>
    </div>
  );
}
