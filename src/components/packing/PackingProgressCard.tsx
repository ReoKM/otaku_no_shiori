interface PackingProgressCardProps {
  total: number;
  checkedCount: number;
}

/**
 * S3a 準備状況カード。
 * 参照: docs/design/screens/S3a_持ち物.md「準備状況カード」
 *
 * 「n／m完了　残りn件」と進捗バーの2要素だけに絞る。
 */
export function PackingProgressCard({ total, checkedCount }: PackingProgressCardProps) {
  const percent = total === 0 ? 0 : Math.round((checkedCount / total) * 100);
  const remaining = total - checkedCount;

  return (
    <section
      aria-label="持ち物の準備状況"
      className="rounded-2xl border border-paper-border bg-paper-surface px-4 py-3.5"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-bold tracking-[0.04em] text-ink-label">準備状況</span>
        <span
          className={`text-[13px] font-medium ${
            checkedCount > 0 ? "text-sakura-ink" : "text-ink-sub"
          }`}
        >
          {total === 0 ? "登録0件" : `${checkedCount}／${total}完了　残り${remaining}件`}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="持ち物の準備率"
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
    </section>
  );
}
