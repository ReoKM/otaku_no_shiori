/**
 * S3d ローディング状態(IndexedDBから`photos`読込中)。
 * 参照: docs/design/screens/S3d_ログ.md「状態」表
 */
export function LogSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2 pt-2" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="aspect-square animate-pulse rounded-xl border border-paper-border bg-paper-track"
        />
      ))}
    </div>
  );
}
