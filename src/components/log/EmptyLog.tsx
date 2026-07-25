/**
 * S3d EmptyLog(空状態、写真0枚)。
 * 参照: docs/design/screens/S3d_ログ.md「EmptyLog(空状態)」
 *
 * 他タブの空状態と同じ破線カードに揃える。
 */
interface EmptyLogProps {
  onAddPhoto: () => void;
}

export function EmptyLog({ onAddPhoto }: EmptyLogProps) {
  return (
    <div className="rounded-2xl border border-dashed border-paper-dashed bg-paper-surface px-5.5 pt-9 pb-7 text-center">
      <p className="text-base font-bold text-ink-strong">写真はまだありません</p>
      <p className="mt-2 text-[13px]/[1.7] text-ink-sub">
        遠征中の思い出を、
        <br />
        写真とひとことで残しましょう
      </p>
      <button
        type="button"
        onClick={onAddPhoto}
        className="mt-5 min-h-13 w-full rounded-btn bg-sakura text-[15px] font-bold text-white"
      >
        ＋ 最初の写真を追加
      </button>
    </div>
  );
}
