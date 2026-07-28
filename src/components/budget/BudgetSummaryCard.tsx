import { formatYen } from "@/lib/budget-validation";

interface BudgetSummaryCardProps {
  /** 予算総額。未設定はnull(`EmptyBudgetTotal`表示に切り替える)。 */
  total: number | null;
  /** 費目の合計金額。 */
  allocated: number;
  onOpenTotalSheet: () => void;
}

/**
 * S3b2 BudgetSummaryCard(予算総額・進捗バー・割り当て済み/残り表示)。
 * 参照: docs/design/screens/S3b2_予算.md「BudgetSummaryCard」
 *
 * 総額未設定時は破線枠の`EmptyBudgetTotal`表示に切り替える(総額0円は「設定済み」扱いのため対象外)。
 */
export function BudgetSummaryCard({ total, allocated, onOpenTotalSheet }: BudgetSummaryCardProps) {
  if (total === null) {
    return (
      <section className="rounded-2xl border border-dashed border-paper-dashed bg-paper-surface px-5.5 pt-9 pb-7 text-center">
        <p className="text-base font-bold text-ink-strong">予算はまだ決めていません</p>
        <p className="mt-2 text-[13px]/[1.7] text-ink-sub">
          総額を決めると、費目ごとの割り当てと残りが見えます
        </p>
        <button
          type="button"
          onClick={onOpenTotalSheet}
          className="mt-5 min-h-11 w-full rounded-btn bg-sakura text-[15px] font-bold text-white"
        >
          予算総額を決める
        </button>
      </section>
    );
  }

  const remaining = total - allocated;
  const isOver = remaining < 0;
  // 100%超は100%で止める(割合=割り当て済み÷総額)。total=0のときはゼロ割りを避け、
  // 費目が1件でもあれば即100%(超過)扱いにする。
  const percent = total > 0 ? Math.min(100, Math.round((allocated / total) * 100)) : allocated > 0 ? 100 : 0;

  return (
    <section
      aria-label="予算総額"
      className="rounded-2xl border border-paper-border bg-paper-surface px-4 py-3.5"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-bold tracking-[0.04em] text-ink-label">予算総額</span>
        <button
          type="button"
          onClick={onOpenTotalSheet}
          className="min-h-11 rounded-xl border border-sakura-border bg-white px-3.5 text-[13px] font-bold text-sakura-ink"
        >
          変更
        </button>
      </div>
      <p className="mt-1 text-[17px] font-black tabular-nums text-ink">{formatYen(total)}</p>
      <div
        role="progressbar"
        aria-label="予算の割り当て進捗"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-2.5 box-border h-2.5 overflow-hidden rounded-full border border-paper-track-border bg-paper-track"
      >
        <div
          className="h-full rounded-full bg-sakura transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-[13px] font-medium">
        <span className="text-ink-sub">割り当て済み {formatYen(allocated)}</span>
        <span className={isOver || remaining > 0 ? "text-sakura-ink" : "text-ink-sub"}>
          {isOver ? `${formatYen(Math.abs(remaining))} 超過` : `残り ${formatYen(remaining)}`}
        </span>
      </div>
    </section>
  );
}
