"use client";

import type { Photo } from "@/types/shiori";
import { PHOTO_CAPTION_MAX_LENGTH } from "@/lib/photo-validation";
import { useObjectUrl } from "./useObjectUrl";

/**
 * S3d LogPhotoCardEditing(編集モード)。
 * 参照: docs/design/screens/S3d_ログ.md「LogPhotoCardEditing(編集モード)」
 *
 * 実装上の判断(仕様に明記が無いため仮置き): 375px幅・3列グリッドではキャプション/日付入力欄の
 * 幅が確保できないため、編集中のカードのみグリッド3列分(`col-span-3`)を使って表示する。
 * 画像自体は仕様どおり拡大せず、サムネイルと同じ大きさのまま表示する。
 */
interface LogPhotoCardEditingProps {
  photo: Photo;
  caption: string;
  dayDate: string;
  onCaptionChange: (value: string) => void;
  onDayDateChange: (value: string) => void;
  onClearDayDate: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export function LogPhotoCardEditing({
  photo,
  caption,
  dayDate,
  onCaptionChange,
  onDayDateChange,
  onClearDayDate,
  onSave,
  onCancel,
}: LogPhotoCardEditingProps) {
  const url = useObjectUrl(photo.blob);
  const atMaxLength = caption.length >= PHOTO_CAPTION_MAX_LENGTH;

  return (
    <div className="col-span-3 flex flex-col gap-2 rounded-2xl border border-paper-border bg-sakura-tint p-3.5">
      <div className="aspect-square w-24 overflow-hidden rounded-xl border border-paper-border bg-paper-track">
        {/* 初回レンダー(ObjectURL確保前)は空文字が返る。src=""はページ全体の再取得を
            招くブラウザ挙動があるため、URLが確定するまでimg自体を描画しない */}
        {url && (
          // eslint-disable-next-line @next/next/no-img-element -- IndexedDBのBlobをObjectURL表示するためnext/imageの最適化対象外
          <img src={url} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div>
        <input
          type="text"
          value={caption}
          maxLength={PHOTO_CAPTION_MAX_LENGTH}
          placeholder="ひとことメモ(任意)"
          onChange={(e) => onCaptionChange(e.target.value)}
          className="min-h-12 w-full rounded-xl border-[1.5px] border-sakura-field bg-white px-3.5 text-base font-medium text-ink outline-none"
        />
        <p className={`text-right text-xs ${atMaxLength ? "font-medium text-red-600" : "text-ink-muted"}`}>
          {caption.length}/{PHOTO_CAPTION_MAX_LENGTH}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={dayDate}
          onChange={(e) => onDayDateChange(e.target.value)}
          className="min-h-12 flex-1 rounded-xl border border-paper-dashed bg-white px-3.5 text-base font-medium text-ink outline-none"
        />
        {dayDate && (
          <button
            type="button"
            onClick={onClearDayDate}
            aria-label="日付をクリア"
            className="flex h-11 w-11 items-center justify-center text-ink-label"
          >
            ×
          </button>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11.5 flex-none rounded-xl border border-paper-dashed bg-white px-4.5 text-sm font-medium text-ink-label"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={onSave}
          className="min-h-11.5 flex-1 rounded-xl bg-sakura text-[15px] font-bold text-white"
        >
          保存する
        </button>
      </div>
    </div>
  );
}
