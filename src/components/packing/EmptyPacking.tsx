interface EmptyPackingProps {
  onAddFromTemplate: () => void;
}

/**
 * S3a EmptyPacking(空状態)。
 * 参照: docs/design/screens/S3a_持ち物.md「EmptyPacking(空状態)」
 * アイコン+説明文でテンプレ追加へ自然に誘導する。
 */
export function EmptyPacking({ onAddFromTemplate }: EmptyPackingProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
      <div
        aria-hidden="true"
        className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-100 text-3xl"
      >
        🎒
      </div>
      <p className="text-base font-semibold text-neutral-900">まだ持ち物がありません</p>
      <p className="text-sm text-neutral-500">
        テンプレから追加して、遠征の準備を始めましょう
      </p>
      <button
        type="button"
        onClick={onAddFromTemplate}
        className="h-12 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 px-6 text-base font-semibold text-white shadow-sm"
      >
        テンプレから追加
      </button>
    </div>
  );
}
