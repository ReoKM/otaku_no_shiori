/**
 * S3b ローディング状態(進捗カード+スケルトン行3本)。
 * 参照: docs/design/screens/S3b_TODO.md「状態」表
 *
 * 読み込み後のレイアウトと同じ余白・行高にして、表示が入れ替わったときのズレを抑える。
 */
export function TodoSkeleton() {
  return (
    <div className="flex flex-1 flex-col px-6 pt-5 pb-8" aria-hidden="true">
      <div className="h-[70px] animate-pulse rounded-2xl border border-paper-border bg-paper-surface" />
      <div className="pt-6 pb-3">
        <div className="h-4 w-32 animate-pulse rounded bg-paper-track" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-paper-border bg-paper-surface">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex min-h-17 items-center gap-3 border-t border-paper-divider px-4 first:border-t-0"
          >
            <div className="h-6.5 w-6.5 shrink-0 animate-pulse rounded-lg bg-paper-track" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-paper-track" />
          </div>
        ))}
      </div>
    </div>
  );
}
