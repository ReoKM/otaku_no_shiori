"use client";

import { useObjectUrl } from "@/components/log/useObjectUrl";
import type { Photo } from "@/types/shiori";

/**
 * S5 PhotoSection(写真選択、Step2・任意)。
 * 参照: docs/design/screens/S5_共有画像プレビュー.md「PhotoSection」
 *
 * ログ(`S3d_ログ.md`)に保存済みの写真一覧をサムネイルグリッドで表示する。
 * サムネイル自体は`LogPhotoGrid`と同じ3列グリッド見た目を踏襲しつつ、
 * ログタブ側の編集・削除機能は持たない選択専用の別実装とする
 * (このタスクではログタブのファイルを変更しない)。
 */
export const PHOTO_SELECT_MAX = 3;

interface PhotoSectionProps {
  photos: Photo[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  excessNotice: boolean;
}

export function PhotoSection({ photos, selectedIds, onToggle, excessNotice }: PhotoSectionProps) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-bold text-neutral-900">写真を選ぶ(任意・最大3枚)</h2>
      <p className="text-sm text-neutral-500">
        {selectedIds.length}/{PHOTO_SELECT_MAX}枚選択中
      </p>
      {excessNotice && <p className="text-sm text-red-600">写真は3枚まで選べます</p>}
      {photos.length === 0 ? (
        <p className="text-sm text-neutral-500">ログに写真を追加すると、ここから選べます</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <PhotoThumb
              key={photo.id}
              photo={photo}
              selected={selectedIds.includes(photo.id)}
              onTap={() => onToggle(photo.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function PhotoThumb({
  photo,
  selected,
  onTap,
}: {
  photo: Photo;
  selected: boolean;
  onTap: () => void;
}) {
  const url = useObjectUrl(photo.blob);

  return (
    <button
      type="button"
      onClick={onTap}
      aria-pressed={selected}
      aria-label={selected ? "選択を解除" : "この写真を選択"}
      className="relative aspect-square w-full overflow-hidden rounded-lg bg-neutral-100"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- IndexedDBのBlobをObjectURL表示するためnext/imageの最適化対象外 */}
      <img src={url} alt="" className="h-full w-full object-cover" />
      {selected && (
        <span
          aria-hidden="true"
          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-xs text-white"
        >
          ✓
        </span>
      )}
    </button>
  );
}
