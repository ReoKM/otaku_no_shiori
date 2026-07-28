/**
 * S3c EmptySpots(スポット0件の空状態)。
 * 参照: docs/design/screens/S3c_旅程スポット.md「EmptySpots(空状態)」
 */
export function EmptySpots() {
  return (
    <div className="rounded-2xl border border-dashed border-paper-dashed bg-paper-surface px-5.5 pt-9 pb-7 text-center">
      <p className="text-base font-bold text-ink-strong">行きたい場所はまだありません</p>
      <p className="mt-2 text-[13px]/[1.7] text-ink-sub">
        聖地やカフェなど、
        <br />
        遠征中に寄りたい場所を登録しましょう
      </p>
    </div>
  );
}
