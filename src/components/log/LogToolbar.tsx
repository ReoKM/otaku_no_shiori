/**
 * S3d Toolbar(ツールバー行)。
 * 参照: docs/design/screens/S3d_ログ.md「レイアウト」1./「Toolbar」/「写真削除(選択モード)」
 *
 * 通常時は「削除」(1枚以上ある時のみ)+「写真を追加」を表示する。
 * 「削除」タップで選択モードに入り、ボタンが「キャンセル」+「削除(N)」に切り替わる
 * (オーナーフィードバック反映: 各カード常時表示の🗑ボタンを廃止し選択式にした)。
 * 「削除(N)」タップ後はツールバー直下にインライン確認バーを表示する(`window.confirm`は使わない)。
 *
 * ヘッダー(タブバー)に密着していた見た目を避けるため、行の上に`pt-3`の余白を追加している
 * (オーナーフィードバック反映)。
 */
interface LogToolbarProps {
  count: number;
  max: number;
  addDisabled: boolean;
  selectMode: boolean;
  confirming: boolean;
  selectedCount: number;
  onAddPhoto: () => void;
  onEnterSelectMode: () => void;
  onCancelSelectMode: () => void;
  onRequestDeleteConfirm: () => void;
  onConfirmDelete: () => void;
  onCancelConfirm: () => void;
}

export function LogToolbar({
  count,
  max,
  addDisabled,
  selectMode,
  confirming,
  selectedCount,
  onAddPhoto,
  onEnterSelectMode,
  onCancelSelectMode,
  onRequestDeleteConfirm,
  onConfirmDelete,
  onCancelConfirm,
}: LogToolbarProps) {
  return (
    <div className="flex flex-col gap-2 pt-3 pb-2">
      <div className="flex h-11 items-center justify-between px-4">
        <p className="text-sm text-neutral-500">
          {count}/{max}枚
        </p>
        {selectMode ? (
          <div className="flex items-center gap-2">
            <button type="button" onClick={onCancelSelectMode} className="h-11 px-2 text-sm text-neutral-500">
              キャンセル
            </button>
            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={onRequestDeleteConfirm}
              className={`flex h-11 items-center justify-center rounded-lg px-4 text-base font-semibold ${
                selectedCount === 0 ? "bg-neutral-200 text-neutral-400" : "bg-red-600 text-white"
              }`}
            >
              削除({selectedCount})
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {count > 0 && (
              <button type="button" onClick={onEnterSelectMode} className="h-11 px-2 text-sm text-neutral-500">
                削除
              </button>
            )}
            <button
              type="button"
              onClick={onAddPhoto}
              disabled={addDisabled}
              className={`flex h-11 items-center justify-center rounded-lg px-4 text-base font-semibold ${
                addDisabled ? "bg-neutral-200 text-neutral-400" : "bg-pink-500 text-white"
              }`}
            >
              写真を追加
            </button>
          </div>
        )}
      </div>
      {confirming && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4">
          <p className="text-sm text-neutral-700">選択した{selectedCount}枚を削除しますか？</p>
          <div className="flex gap-2">
            <button type="button" onClick={onConfirmDelete} className="h-11 px-2 text-sm font-semibold text-red-600">
              削除する
            </button>
            <button type="button" onClick={onCancelConfirm} className="h-11 px-2 text-sm text-neutral-500">
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
