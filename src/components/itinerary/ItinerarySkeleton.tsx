/**
 * S3c ローディング状態のスケルトン(日見出し+行×3本)。
 * 参照: docs/design/screens/S3c_旅程スポット.md「状態」表
 */
export function ItinerarySkeleton() {
  return (
    <div className="px-6 pt-5 pb-8" aria-hidden="true">
      <div className="h-4 w-28 animate-pulse rounded bg-paper-track" />
      <div className="mt-2.5 overflow-hidden rounded-2xl border border-paper-border bg-paper-surface">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex min-h-18 items-center gap-3 border-t border-paper-divider px-4 first:border-t-0"
          >
            <div className="h-4 w-10 shrink-0 animate-pulse rounded bg-paper-track" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-paper-track" />
          </div>
        ))}
      </div>
    </div>
  );
}
