/**
 * S3b2 ローディング状態(サマリーカード+スケルトン行3本)。
 * 参照: docs/design/screens/S3b2_予算.md「状態」表
 *
 * `TodoSkeleton`と同じ考え方(読込後と同じ余白・行高にして表示の入れ替わりを抑える)。
 */
export function BudgetSkeleton() {
  return (
    <div className="flex flex-1 flex-col px-6 pt-5 pb-8" aria-hidden="true">
      <div className="h-[104px] animate-pulse rounded-2xl border border-paper-border bg-paper-surface" />
      <div className="pt-6 pb-3">
        <div className="h-4 w-24 animate-pulse rounded bg-paper-track" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-paper-border bg-paper-surface">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex min-h-14 items-center gap-3 border-t border-paper-divider px-4 first:border-t-0"
          >
            <div className="h-4 w-2/3 animate-pulse rounded bg-paper-track" />
          </div>
        ))}
      </div>
    </div>
  );
}
