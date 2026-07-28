import { PlusIcon } from "@/components/list-ui/icons";

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
    <div className="flex flex-col gap-2 pt-5 pb-3">
      <div className="flex min-h-11 items-center justify-between gap-2">
        <p className="text-[13px] font-medium text-ink-sub">
          {count}/{max}枚
        </p>
        {selectMode ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancelSelectMode}
              className="min-h-9 px-2 text-[13px] font-medium text-ink-sub"
            >
              選択をやめる
            </button>
            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={onRequestDeleteConfirm}
              className={`flex min-h-10 items-center justify-center rounded-full px-3.5 text-[13.5px] font-bold ${
                selectedCount === 0 ? "bg-paper-track text-ink-faint" : "bg-red-600 text-white"
              }`}
            >
              削除({selectedCount})
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {count > 0 && (
              <button
                type="button"
                onClick={onEnterSelectMode}
                className="min-h-9 px-2 text-[13px] font-medium text-ink-strong"
              >
                選択
              </button>
            )}
            <button
              type="button"
              onClick={onAddPhoto}
              disabled={addDisabled}
              className={`flex min-h-10 items-center justify-center gap-1.5 rounded-full border px-3.5 text-[13.5px] font-bold ${
                addDisabled
                  ? "border-paper-dashed bg-paper-track text-ink-faint"
                  : "border-sakura-border bg-white text-sakura-ink"
              }`}
            >
              <PlusIcon size={16} />
              写真を追加
            </button>
          </div>
        )}
      </div>
      {confirming && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-paper-border bg-paper-surface px-3.5 py-2">
          <p className="text-[13px] text-ink">選択した{selectedCount}枚を削除します。よろしいですか?</p>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={onCancelConfirm}
              className="min-h-11 px-3 text-[13px] font-medium text-ink-label"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={onConfirmDelete}
              className="min-h-11 px-3 text-[13px] font-bold text-red-600"
            >
              削除する
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
