/**
 * F9広告枠のプレースホルダー(位置確保のみ、W1では中身なし)。
 * 参照: docs/design/screens/S1_ホーム一覧.md「3. 広告枠(F9・位置確保のみ)」
 */
export function AdSlotPlaceholder() {
  return (
    <div
      className="flex h-20 items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-100 text-xs text-neutral-400"
      aria-hidden="true"
    >
      広告枠(準備中)
    </div>
  );
}
