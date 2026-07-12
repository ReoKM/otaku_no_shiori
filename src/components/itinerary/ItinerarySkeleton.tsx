/**
 * S3c ローディング状態のスケルトン(行×3本)。
 * 参照: docs/design/screens/S3c_旅程スポット.md「状態」表
 */
export function ItinerarySkeleton() {
  return (
    <div className="flex flex-col gap-2 px-4 py-3" aria-hidden="true">
      <div className="h-14 animate-pulse rounded-lg bg-neutral-200" />
      <div className="h-14 animate-pulse rounded-lg bg-neutral-200" />
      <div className="h-14 animate-pulse rounded-lg bg-neutral-200" />
    </div>
  );
}
