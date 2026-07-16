/**
 * S5 FailedBlock(生成失敗)。
 * 参照: docs/design/screens/S5_共有画像プレビュー.md「FailedBlock(生成失敗)」「状態」(オフライン行)
 */
interface FailedBlockProps {
  /** trueの場合、オフライン検知による失敗として補足文を差し替える。 */
  offline: boolean;
  onRetry: () => void;
}

export function FailedBlock({ offline, onRetry }: FailedBlockProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
      <p className="text-lg font-bold text-red-600">画像の作成に失敗しました</p>
      <p className="text-sm text-neutral-500">
        {offline ? "電波の状態を確認してもう一度お試しください" : "時間をおいてもう一度お試しください"}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="h-11 rounded-lg bg-pink-500 px-4 text-base font-semibold text-white"
      >
        もう一度試す
      </button>
    </div>
  );
}
