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
    <div className="col-span-3 flex flex-col gap-2 rounded-lg border border-neutral-200 p-3">
      <div className="aspect-square w-24 overflow-hidden rounded-lg bg-neutral-100">
        {/* eslint-disable-next-line @next/next/no-img-element -- IndexedDBのBlobをObjectURL表示するためnext/imageの最適化対象外 */}
        <img src={url} alt="" className="h-full w-full object-cover" />
      </div>
      <div>
        <input
          type="text"
          value={caption}
          maxLength={PHOTO_CAPTION_MAX_LENGTH}
          placeholder="ひとことメモ(任意)"
          onChange={(e) => onCaptionChange(e.target.value)}
          className="h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-base text-neutral-900"
        />
        <p className={`text-right text-xs ${atMaxLength ? "text-red-600" : "text-neutral-400"}`}>
          {caption.length}/{PHOTO_CAPTION_MAX_LENGTH}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={dayDate}
          onChange={(e) => onDayDateChange(e.target.value)}
          className="h-11 flex-1 rounded-lg border border-neutral-200 bg-white px-3 text-base text-neutral-900"
        />
        {dayDate && (
          <button
            type="button"
            onClick={onClearDayDate}
            aria-label="日付をクリア"
            className="flex h-11 w-11 items-center justify-center text-neutral-500"
          >
            ×
          </button>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          aria-label="保存"
          onClick={onSave}
          className="flex h-11 w-11 items-center justify-center text-lg text-pink-500"
        >
          ✓
        </button>
        <button
          type="button"
          aria-label="編集をキャンセル"
          onClick={onCancel}
          className="flex h-11 w-11 items-center justify-center text-lg text-neutral-500"
        >
          ×
        </button>
      </div>
    </div>
  );
}
