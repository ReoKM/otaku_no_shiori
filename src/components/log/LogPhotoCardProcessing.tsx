/**
 * S3d LogPhotoCardProcessing(アップロード中=クライアントリサイズ処理中)。
 * 参照: docs/design/screens/S3d_ログ.md「LogPhotoCardProcessing」
 * タップ操作不可(削除・編集どちらも不可)。
 */
export function LogPhotoCardProcessing() {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-neutral-200">
        <span
          className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent"
          aria-hidden="true"
        />
      </div>
      <p className="text-xs text-neutral-400">処理中…</p>
    </div>
  );
}
