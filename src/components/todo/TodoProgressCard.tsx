interface TodoProgressCardProps {
  total: number;
  doneCount: number;
}

/**
 * S3b やることの進捗カード。
 * 参照: docs/design/screens/S3b_TODO.md「進捗カード」
 * 持ち物の準備状況カードと同じ構造で、見出しだけ「やること」にする。
 */
export function TodoProgressCard({ total, doneCount }: TodoProgressCardProps) {
  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  return (
    <section
      aria-label="やることの進捗"
      className="rounded-2xl border border-paper-border bg-paper-surface px-4 py-3.5"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-bold tracking-[0.04em] text-ink-label">やること</span>
        <span
          className={`text-[13px] font-medium ${doneCount > 0 ? "text-sakura-ink" : "text-ink-sub"}`}
        >
          {total === 0 ? "登録0件" : `${doneCount}／${total}完了　残り${total - doneCount}件`}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="やることの進捗率"
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
