interface PackingToolbarProps {
  count: number;
  sortMode: boolean;
  onToggleSortMode: () => void;
}

/**
 * S3a ツールバー行(件数表示+並べ替えボタン)。
 * 参照: docs/design/screens/S3a_持ち物.md「1. ツールバー行」
 *
 * 「並べ替え」ボタンは項目が2件以上の時のみ表示する(仕様どおり)。
 * ただし並べ替えモード中に削除操作で1件以下に減った場合でも「完了」ボタンは
 * 表示し続け、ユーザーが並べ替えモードから抜けられなくなることを防ぐ(仮置き)。
 */
export function PackingToolbar({ count, sortMode, onToggleSortMode }: PackingToolbarProps) {
  return (
    <div className="flex h-11 items-center justify-between px-4">
      <p className="text-sm text-neutral-500">{count}件</p>
      {(count >= 2 || sortMode) && (
        <button type="button" onClick={onToggleSortMode} className="text-sm text-neutral-900">
          {sortMode ? "完了" : "並べ替え"}
        </button>
      )}
    </div>
  );
}
