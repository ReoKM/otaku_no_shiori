interface EmptyPackingProps {
  onAddFromTemplate: () => void;
}

/**
 * S3a EmptyPacking(空状態)。
 * 参照: docs/design/screens/S3a_持ち物.md「EmptyPacking(空状態)」
 */
export function EmptyPacking({ onAddFromTemplate }: EmptyPackingProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <p className="text-base text-neutral-500">まだ持ち物がありません</p>
      <button
        type="button"
        onClick={onAddFromTemplate}
        className="h-11 rounded-lg bg-pink-500 px-4 text-base font-semibold text-white"
      >
        テンプレから追加
      </button>
    </div>
  );
}
