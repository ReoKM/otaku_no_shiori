/**
 * S1ローディング状態のスケルトン(カード形×2枚)。
 * 参照: docs/design/screens/S1_ホーム一覧.md「状態」表
 */
export function ShioriListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3.5 rounded-2xl border border-paper-border bg-paper-surface p-4"
        >
          <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-paper-track" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-paper-track" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-paper-track" />
          </div>
        </div>
      ))}
    </div>
  );
}
