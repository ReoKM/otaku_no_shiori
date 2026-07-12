"use client";

import type { Photo } from "@/types/shiori";
import { useObjectUrl } from "./useObjectUrl";

/**
 * S3d LogPhotoCard(通常状態、1枚)。
 * 参照: docs/design/screens/S3d_ログ.md「LogPhotoCard(通常状態、1枚)」
 */
interface LogPhotoCardProps {
  photo: Photo;
  onTapEdit: () => void;
  onTapDelete: () => void;
}

export function LogPhotoCard({ photo, onTapEdit, onTapDelete }: LogPhotoCardProps) {
  const url = useObjectUrl(photo.blob);

  return (
    <div className="flex flex-col gap-1">
      <div className="relative aspect-square w-full">
        <button
          type="button"
          onClick={onTapEdit}
          aria-label="写真を編集"
          className="block h-full w-full overflow-hidden rounded-lg bg-neutral-100"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- IndexedDBのBlobをObjectURL表示するためnext/imageの最適化対象外 */}
          <img src={url} alt="" className="h-full w-full object-cover" />
        </button>
        <button
          type="button"
          onClick={onTapDelete}
          aria-label="削除"
          className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-lg text-neutral-700"
        >
          🗑
        </button>
      </div>
      <button
        type="button"
        onClick={onTapEdit}
        className={`truncate text-left text-xs ${photo.caption ? "text-neutral-500" : "text-neutral-400"}`}
      >
        {photo.caption ?? "メモを追加"}
      </button>
    </div>
  );
}
