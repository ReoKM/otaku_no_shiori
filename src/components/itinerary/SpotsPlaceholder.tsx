/**
 * S3c「行きたい場所」セクションの暫定プレースホルダー。
 *
 * F5(行きたいスポット機能)はW2タスク#9で並行実装されるため、本タスク(F4)では
 * セグメント切替の器のみを用意し、中身は最小限の表示に留める(タスク#9がそのまま置き換える想定)。
 */
export function SpotsPlaceholder() {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <p className="text-base text-neutral-500">行きたい場所(実装中)</p>
    </div>
  );
}
