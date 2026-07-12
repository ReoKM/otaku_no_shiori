/**
 * S3b EmptyTodo(空状態)。
 * 参照: docs/design/screens/S3b_TODO.md「EmptyTodo(空状態)」
 */
interface EmptyTodoProps {
  onAddFromTemplate: () => void;
}

export function EmptyTodo({ onAddFromTemplate }: EmptyTodoProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <p className="text-base text-neutral-500">まだTODOがありません</p>
      <button
        type="button"
        onClick={onAddFromTemplate}
        className="h-11 rounded-lg bg-pink-500 px-5 text-base font-semibold text-white"
      >
        テンプレから追加
      </button>
    </div>
  );
}
