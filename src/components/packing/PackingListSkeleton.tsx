/**
 * S3a ローディング状態(スケルトン行3本)。
 * 参照: docs/design/screens/S3a_持ち物.md「状態」表
 */
export function PackingListSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-4 pt-4 pb-3">
      <div className="h-28 animate-pulse rounded-xl bg-neutral-200" />
      <div className="divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 bg-white">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex min-h-14 items-center gap-3 px-4">
            <div className="h-6 w-6 shrink-0 animate-pulse rounded-md bg-neutral-200" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
