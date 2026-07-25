interface EmptyPackingProps {
  onStartAdd: () => void;
  onAddFromTemplate: () => void;
}

/**
 * S3a EmptyPacking(空状態)。
 * 参照: docs/design/screens/S3a_持ち物.md「EmptyPacking(空状態)」
 *
 * 破線のカードで「まだ何も無い」ことを示し、最初の1件を登録する導線を主CTAに置く。
 * テンプレ投入は副次的な導線としてその下に置く(全削除後に再投入したい場合の受け皿)。
 */
export function EmptyPacking({ onStartAdd, onAddFromTemplate }: EmptyPackingProps) {
  return (
    <div className="rounded-2xl border border-dashed border-paper-dashed bg-paper-surface px-5.5 pt-9 pb-7 text-center">
      <p className="text-base font-bold text-ink-strong">持ち物はまだありません</p>
      <p className="mt-2 text-[13px]/[1.7] text-ink-sub">
        忘れ物を防ぐために、
        <br />
        必要なものを登録しましょう
      </p>
      <button
        type="button"
        onClick={onStartAdd}
        className="mt-5 min-h-13 w-full rounded-btn bg-sakura text-[15px] font-bold text-white"
      >
        ＋ 最初の持ち物を追加
      </button>
      <button
        type="button"
        onClick={onAddFromTemplate}
        className="mt-2.5 min-h-11 w-full text-[13px] font-bold text-sakura-ink"
      >
        テンプレから追加
      </button>
    </div>
  );
}
