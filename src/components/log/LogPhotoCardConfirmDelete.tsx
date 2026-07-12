"use client";

import type { Photo } from "@/types/shiori";
import { useObjectUrl } from "./useObjectUrl";

/**
 * S3d LogPhotoCardConfirmDelete(削除確認モード)。
 * 参照: docs/design/screens/S3d_ログ.md「LogPhotoCardConfirmDelete(削除確認モード)」
 */
interface LogPhotoCardConfirmDeleteProps {
  photo: Photo;
  onDelete: () => void;
  onCancel: () => void;
}

export function LogPhotoCardConfirmDelete({ photo, onDelete, onCancel }: LogPhotoCardConfirmDeleteProps) {
  const url = useObjectUrl(photo.blob);

  return (
    <div className="flex flex-col gap-1">
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-neutral-100">
        {/* eslint-disable-next-line @next/next/no-img-element -- IndexedDBのBlobをObjectURL表示するためnext/imageの最適化対象外 */}
        <img src={url} alt="" className="h-full w-full object-cover" />
      </div>
      <p className="text-xs text-neutral-700">本当に削除しますか？</p>
      <div className="flex gap-2">
        <button type="button" onClick={onDelete} className="h-11 flex-1 text-sm font-semibold text-red-600">
          削除
        </button>
        <button type="button" onClick={onCancel} className="h-11 flex-1 text-sm text-neutral-500">
          キャンセル
        </button>
      </div>
    </div>
  );
}
