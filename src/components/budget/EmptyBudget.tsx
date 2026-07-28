/**
 * S3b2 EmptyBudget(費目0件の空状態)。
 * 参照: docs/design/screens/S3b2_予算.md「EmptyBudget(費目0件の空状態)」
 *
 * `EmptyTodo`と同じ構成(破線カード+主CTA)。テンプレ投入は本仕様の対象外(仮置き参照)なので持たない。
 */
interface EmptyBudgetProps {
  onStartAdd: () => void;
}

export function EmptyBudget({ onStartAdd }: EmptyBudgetProps) {
  return (
    <div className="rounded-2xl border border-dashed border-paper-dashed bg-paper-surface px-5.5 pt-9 pb-7 text-center">
      <p className="text-base font-bold text-ink-strong">費目はまだありません</p>
      <p className="mt-2 text-[13px]/[1.7] text-ink-sub">
        交通費・宿・グッズなど、
        <br />
        使い道ごとに金額を分けましょう
      </p>
      <button
        type="button"
        onClick={onStartAdd}
        className="mt-5 min-h-13 w-full rounded-btn bg-sakura text-[15px] font-bold text-white"
      >
        ＋ 最初の費目を追加
      </button>
    </div>
  );
}
