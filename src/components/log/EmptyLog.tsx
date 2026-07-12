/**
 * S3d EmptyLog(空状態、写真0枚)。
 * 参照: docs/design/screens/S3d_ログ.md「EmptyLog(空状態)」
 */
interface EmptyLogProps {
  onAddPhoto: () => void;
}

export function EmptyLog({ onAddPhoto }: EmptyLogProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <p className="text-base text-neutral-500">まだ写真がありません</p>
      <p className="text-sm text-neutral-500">遠征中の思い出を写真とひとことで残しましょう</p>
      <button
        type="button"
        onClick={onAddPhoto}
        className="h-11 rounded-lg bg-pink-500 px-5 text-base font-semibold text-white"
      >
        写真を追加
      </button>
    </div>
  );
}
