interface PackingToolbarProps {
  count: number;
  checkedCount: number;
  sortMode: boolean;
  onToggleSortMode: () => void;
}

/**
 * S3a ツールバー行(件数表示+並べ替えボタン)。
 * 参照: docs/design/screens/S3a_持ち物.md「1. ツールバー行」
 *
 * 件数は総数・チェック済み・残りを1行で表示し、準備状況が一目で分かるようにする。
 * 「並べ替え」ボタンは項目が2件以上の時のみ表示する(仕様どおり)。
 * ただし並べ替えモード中に削除操作で1件以下に減った場合でも「完了」ボタンは
 * 表示し続け、ユーザーが並べ替えモードから抜けられなくなることを防ぐ(仮置き)。
 */
export function PackingToolbar({
  count,
  checkedCount,
  sortMode,
  onToggleSortMode,
}: PackingToolbarProps) {
  return (
    <div className="flex h-11 items-center justify-between px-4">
      <p className="text-sm text-neutral-500">
        全{count}件
        {count > 0 && (
          <>
            {" · "}
            <span className="text-pink-500">済 {checkedCount}</span>
            {" · "}残り {count - checkedCount}
          </>
        )}
      </p>
      {(count >= 2 || sortMode) && (
        <button type="button" onClick={onToggleSortMode} className="text-sm text-neutral-900">
          {sortMode ? "完了" : "並べ替え"}
        </button>
      )}
    </div>
  );
}
