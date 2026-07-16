/**
 * S5 GeneratingBlock(生成中)。
 * 参照: docs/design/screens/S5_共有画像プレビュー.md「GeneratingBlock(生成中)」
 * キャンセル導線は仕様に指定が無いため設けない。
 */
export function GeneratingBlock() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
      <div
        aria-hidden="true"
        className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-pink-500"
      />
      <p className="text-lg font-bold text-neutral-900">画像を作成しています…</p>
      <p className="text-sm text-neutral-500">電波が弱い場所では時間がかかる場合があります</p>
    </div>
  );
}
