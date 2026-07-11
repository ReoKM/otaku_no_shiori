/**
 * 旅程/スポット/ログタブ共通の準備中ブロック。
 * 参照: docs/design/screens/S3_しおり詳細.md「ComingSoon」
 */
export function ComingSoon({ feature }: { feature: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <span aria-hidden="true" className="text-xl">
        🚧
      </span>
      <p className="text-lg font-bold text-neutral-900">{feature}は準備中です</p>
      <p className="text-sm text-neutral-500">近日公開予定です。もうしばらくお待ちください。</p>
    </div>
  );
}
