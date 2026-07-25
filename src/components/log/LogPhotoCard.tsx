"use client";

import type { Photo } from "@/types/shiori";
import { useObjectUrl } from "./useObjectUrl";

/**
 * S3d LogPhotoCard(通常状態、1枚)。
 * 参照: docs/design/screens/S3d_ログ.md「LogPhotoCard(通常状態、1枚)」
 *
 * 選択モード中(`selectMode`)は右上の常時🗑削除ボタンを表示せず、代わりにチェックのオーバーレイを
 * 表示する(オーナーフィードバック反映: カードごとの常時削除ボタンは廃止し、
 * ツールバーの「削除」から入る選択式フローに変更した)。選択モード中は編集・追加ともに無効にし、
 * タップは選択トグルのみに切り替わる。
 */
interface LogPhotoCardProps {
  photo: Photo;
  onTapEdit: () => void;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
}

export function LogPhotoCard({ photo, onTapEdit, selectMode, selected, onToggleSelect }: LogPhotoCardProps) {
  const url = useObjectUrl(photo.blob);

  return (
    <div className="flex flex-col gap-1">
      <div className="relative aspect-square w-full">
        <button
          type="button"
          onClick={selectMode ? onToggleSelect : onTapEdit}
          aria-label={selectMode ? "写真を選択" : "写真を編集"}
          aria-pressed={selectMode ? selected : undefined}
          className="block h-full w-full overflow-hidden rounded-xl border border-paper-border bg-paper-track"
        >
          {/* 初回レンダー(ObjectURL確保前)は空文字が返る。src=""はページ全体の再取得を
              招くブラウザ挙動があるため、URLが確定するまでimg自体を描画しない */}
          {url && (
            // eslint-disable-next-line @next/next/no-img-element -- IndexedDBのBlobをObjectURL表示するためnext/imageの最適化対象外
            <img src={url} alt="" className="h-full w-full object-cover" />
          )}
        </button>
        {selectMode && (
          <div
            className={`pointer-events-none absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              selected ? "bg-sakura text-white" : "bg-white/80 text-transparent"
            }`}
          >
            ✓
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={selectMode ? onToggleSelect : onTapEdit}
        className={`truncate text-left text-[11.5px] ${
          photo.caption ? "text-ink-sub" : "text-ink-faint"
        }`}
      >
        {photo.caption ?? "メモを追加"}
      </button>
    </div>
  );
}
