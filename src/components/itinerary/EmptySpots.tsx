/**
 * S3c EmptySpots(スポット0件の空状態)。
 * 参照: docs/design/screens/S3c_旅程スポット.md「EmptySpots(空状態)」
 */
export function EmptySpots() {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <p className="text-base text-neutral-500">まだ行きたい場所がありません</p>
      <p className="text-sm text-neutral-500">上のボタンから追加しましょう</p>
    </div>
  );
}
