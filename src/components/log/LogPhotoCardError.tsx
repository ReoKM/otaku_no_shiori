/**
 * S3d「個別写真の読込・リサイズ失敗」状態のカード。
 * 参照: docs/design/screens/S3d_ログ.md「状態」表「個別写真の読込・リサイズ失敗」
 * タップで一覧から取り除ける(保存済みデータが無いため削除確認は不要)。
 */
interface LogPhotoCardErrorProps {
  onDismiss: () => void;
}

export function LogPhotoCardError({ onDismiss }: LogPhotoCardErrorProps) {
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={onDismiss}
        aria-label="読み込み失敗の項目を取り消す"
        className="flex aspect-square w-full items-center justify-center rounded-xl bg-paper-track text-2xl text-ink-muted"
      >
        ×
      </button>
      <p className="text-xs text-red-600">読み込みに失敗しました</p>
    </div>
  );
}
