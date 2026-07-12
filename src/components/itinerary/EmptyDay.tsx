/**
 * S3c EmptyDay(その日の予定が0件)。
 * 参照: docs/design/screens/S3c_旅程スポット.md「EmptyDay(その日の予定が0件)」
 */
interface EmptyDayProps {
  onAdd: () => void;
}

export function EmptyDay({ onAdd }: EmptyDayProps) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
      <p className="text-sm text-neutral-500">この日の予定はまだありません</p>
      <button type="button" onClick={onAdd} className="h-11 px-3 text-base font-semibold text-pink-500">
        予定を追加
      </button>
    </div>
  );
}
