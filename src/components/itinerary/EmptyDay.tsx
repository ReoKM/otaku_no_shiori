/**
 * S3c EmptyDay(その日の予定が0件)。
 * 参照: docs/design/screens/S3c_旅程スポット.md「EmptyDay(その日の予定が0件)」
 *
 * 日カードの中に置くため枠線は持たず、文言のみ。追加導線はカード末尾の
 * 「予定を追加」行が担うので、ここにはボタンを置かない。
 */
export function EmptyDay() {
  return (
    <p className="px-4 py-6 text-center text-[13px] text-ink-muted">この日の予定はまだありません</p>
  );
}
