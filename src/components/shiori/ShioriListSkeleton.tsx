/**
 * S1ローディング状態のスケルトン(カード形×2枚)。
 * 参照: docs/design/screens/S1_ホーム一覧.md「状態」表
 */
export function ShioriListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      <div className="h-20 animate-pulse rounded-xl bg-neutral-200" />
      <div className="h-20 animate-pulse rounded-xl bg-neutral-200" />
    </div>
  );
}
