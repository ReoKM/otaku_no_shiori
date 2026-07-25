/**
 * S3b EmptyTodo(空状態)。
 * 参照: docs/design/screens/S3b_TODO.md「EmptyTodo(空状態)」
 *
 * 持ち物の`EmptyPacking`と同じ構成(破線カード+主CTA+テンプレ導線)。
 */
interface EmptyTodoProps {
  onStartAdd: () => void;
  onAddFromTemplate: () => void;
}

export function EmptyTodo({ onStartAdd, onAddFromTemplate }: EmptyTodoProps) {
  return (
    <div className="rounded-2xl border border-dashed border-paper-dashed bg-paper-surface px-5.5 pt-9 pb-7 text-center">
      <p className="text-base font-bold text-ink-strong">やることはまだありません</p>
      <p className="mt-2 text-[13px]/[1.7] text-ink-sub">
        チケット申込や宿の予約など、
        <br />
        遠征までにやることを登録しましょう
      </p>
      <button
        type="button"
        onClick={onStartAdd}
        className="mt-5 min-h-13 w-full rounded-btn bg-sakura text-[15px] font-bold text-white"
      >
        ＋ 最初のやることを追加
      </button>
      <button
        type="button"
        onClick={onAddFromTemplate}
        className="mt-2.5 min-h-11 w-full text-[13px] font-bold text-sakura-ink"
      >
        テンプレから追加
      </button>
    </div>
  );
}
