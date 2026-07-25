/**
 * F9広告枠(しおり一覧S1下部・ログS3d下部の2箇所のみ。旅程・持ち物・TODOには置かない)。
 * AdSense審査通過までは自社告知を表示する(F9仕様)。
 * 公式Xは未開設のため外部導線は入れず、控えめなテキストのみとする。
 */
export function AdSlotPlaceholder() {
  return (
    <aside
      aria-label="プロモーション"
      className="flex h-20 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-paper-dashed bg-paper-surface text-center"
    >
      <p className="text-sm font-bold text-ink-strong">オタクのしおり</p>
      <p className="text-xs text-ink-muted">遠征のおともに。持ち物・TODO・旅程をこの1冊で。</p>
    </aside>
  );
}
