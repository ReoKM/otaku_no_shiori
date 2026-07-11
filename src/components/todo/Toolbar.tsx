/**
 * S3b Toolbar(ツールバー行)。
 * 参照: docs/design/screens/S3b_TODO.md「レイアウト」1.
 */
interface ToolbarProps {
  count: number;
  sortMode: boolean;
  onToggleSort: () => void;
}

export function Toolbar({ count, sortMode, onToggleSort }: ToolbarProps) {
  return (
    <div className="flex h-11 items-center justify-between px-4">
      <p className="text-sm text-neutral-500">{count}件</p>
      {count >= 2 && (
        <button
          type="button"
          onClick={onToggleSort}
          className="h-11 px-2 text-sm font-semibold text-pink-500"
        >
          {sortMode ? "完了" : "並べ替え"}
        </button>
      )}
    </div>
  );
}
