"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AdSlotPlaceholder } from "@/components/common/AdSlotPlaceholder";
import { createPhoto, deletePhoto, listPhotosByShiori, updatePhoto } from "@/lib/guest-store";
import { groupLogsByDay, type LogGroupable } from "@/lib/log-sort";
import { computeAcceptableCount, getMaxPhotosPerShiori } from "@/lib/photo-limit";
import { resizeImageFile } from "@/lib/photo-resize";
import { PHOTO_CAPTION_MAX_LENGTH, sanitizeCaption } from "@/lib/photo-validation";
import type { Photo } from "@/types/shiori";
import { EmptyLog } from "./EmptyLog";
import { LogDateGroup } from "./LogDateGroup";
import { LogPhotoCard } from "./LogPhotoCard";
import { LogPhotoCardConfirmDelete } from "./LogPhotoCardConfirmDelete";
import { LogPhotoCardEditing } from "./LogPhotoCardEditing";
import { LogPhotoCardError } from "./LogPhotoCardError";
import { LogPhotoCardProcessing } from "./LogPhotoCardProcessing";
import { LogPhotoGrid } from "./LogPhotoGrid";
import { LogSkeleton } from "./LogSkeleton";
import { LogToolbar } from "./LogToolbar";

/**
 * S3d LogTab(ログタブ本体)。
 * 参照: docs/design/screens/S3d_ログ.md
 *
 * 写真追加は「選択直後に処理中カードを即時表示→Canvasリサイズ完了後に`photos`ストアへ保存し
 * 通常カードへ置き換える」という非同期フローのため、まだ保存されていない項目
 * (`processing`)をクライアントのみの状態として`photos`(保存済み)と別管理し、
 * 表示時にのみ1つの一覧へ合成する。
 */
interface ProcessingItem {
  id: string;
  sortKey: string;
  status: "processing" | "error";
}

interface EditDraft {
  id: string;
  caption: string;
  dayDate: string;
}

type LogListItem =
  | ({ kind: "photo"; id: string; photo: Photo } & LogGroupable)
  | ({ kind: "processing"; id: string } & LogGroupable)
  | ({ kind: "error"; id: string } & LogGroupable);

const NOTICE_DURATION_MS = 5000;

export function LogTab({ shioriId }: { shioriId: string }) {
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [processing, setProcessing] = useState<ProcessingItem[]>([]);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const processingCounterRef = useRef(0);

  const maxPhotos = useMemo(() => getMaxPhotosPerShiori(), []);

  useEffect(() => {
    let cancelled = false;
    listPhotosByShiori(shioriId).then((items) => {
      if (!cancelled) {
        setPhotos(items);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [shioriId]);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) {
        clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);

  function showNotice(message: string) {
    setNotice(message);
    if (noticeTimerRef.current) {
      clearTimeout(noticeTimerRef.current);
    }
    noticeTimerRef.current = setTimeout(() => setNotice(null), NOTICE_DURATION_MS);
  }

  function handleAddPhotoClick() {
    fileInputRef.current?.click();
  }

  // `baseTime`は呼び出し側(実際のイベントハンドラ)で`Date.now()`を取得して渡す。
  // (この関数自体はイベントハンドラから呼ばれるだけだが、react-hooks/purity linterが
  // 経路の純粋性を静的解析しきれず誤検知するため、時刻取得はJSXのonChangeへ寄せている)
  function handleFilesSelected(fileList: FileList | null, baseTime: number) {
    if (!fileList || fileList.length === 0) {
      return;
    }
    const files = Array.from(fileList);
    const currentUsed = (photos?.length ?? 0) + processing.length;
    const { accepted, rejected } = computeAcceptableCount(currentUsed, files.length, maxPhotos);

    if (rejected > 0) {
      showNotice(`上限(${maxPhotos}枚)に達したため${accepted}枚のみ追加しました`);
    }

    const acceptedFiles = files.slice(0, accepted);
    if (acceptedFiles.length === 0) {
      return;
    }

    // 選択時点で並び順(仮のsort_key)を割り当ててから処理を開始する(S3d仕様「ファイル選択後」)。
    // リサイズは非同期で完了順が前後するため、選択順を保つために選択時点でキーを固定する。
    const newItems: ProcessingItem[] = acceptedFiles.map(() => {
      processingCounterRef.current += 1;
      return {
        id: crypto.randomUUID(),
        sortKey: new Date(baseTime + processingCounterRef.current).toISOString(),
        status: "processing",
      };
    });

    setProcessing((prev) => [...prev, ...newItems]);

    acceptedFiles.forEach((file, index) => {
      void processOneFile(file, newItems[index].id);
    });
  }

  async function processOneFile(file: File, processingId: string) {
    try {
      const blob = await resizeImageFile(file);
      const saved = await createPhoto({ shiori_id: shioriId, blob, day_date: null, caption: null });
      setProcessing((prev) => prev.filter((p) => p.id !== processingId));
      setPhotos((prev) => (prev ? [...prev, saved] : [saved]));
    } catch {
      setProcessing((prev) => prev.map((p) => (p.id === processingId ? { ...p, status: "error" } : p)));
    }
  }

  function handleDismissError(id: string) {
    setProcessing((prev) => prev.filter((p) => p.id !== id));
  }

  function handleStartEdit(photo: Photo) {
    setDeletingId(null);
    setEditDraft({ id: photo.id, caption: photo.caption ?? "", dayDate: photo.day_date ?? "" });
  }

  function handleCancelEdit() {
    setEditDraft(null);
  }

  async function handleSaveEdit() {
    if (!editDraft) {
      return;
    }
    const caption = sanitizeCaption(editDraft.caption);
    const updated = await updatePhoto(editDraft.id, {
      caption,
      day_date: editDraft.dayDate || null,
    });
    setPhotos((prev) => (prev ? prev.map((p) => (p.id === updated.id ? updated : p)) : prev));
    setEditDraft(null);
  }

  function handleStartDelete(photo: Photo) {
    setEditDraft(null);
    setDeletingId(photo.id);
  }

  function handleCancelDelete() {
    setDeletingId(null);
  }

  async function handleConfirmDelete(id: string) {
    await deletePhoto(id);
    setPhotos((prev) => (prev ? prev.filter((p) => p.id !== id) : prev));
    setDeletingId((prev) => (prev === id ? null : prev));
  }

  const listItems: LogListItem[] = useMemo(() => {
    const photoItems: LogListItem[] = (photos ?? []).map((photo) => ({
      kind: "photo",
      id: photo.id,
      day_date: photo.day_date,
      sort_key: photo.created_at,
      photo,
    }));
    const processingItems: LogListItem[] = processing.map((p) =>
      p.status === "error"
        ? { kind: "error" as const, id: p.id, day_date: null, sort_key: p.sortKey }
        : { kind: "processing" as const, id: p.id, day_date: null, sort_key: p.sortKey },
    );
    return [...photoItems, ...processingItems];
  }, [photos, processing]);

  const groups = useMemo(() => groupLogsByDay(listItems), [listItems]);

  const savedCount = photos?.length ?? 0;
  const disabled = savedCount >= maxPhotos;

  if (photos === null) {
    return (
      <div className="flex flex-1 flex-col">
        <LogToolbar count={0} max={maxPhotos} disabled onAddPhoto={() => {}} />
        <LogSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <LogToolbar count={savedCount} max={maxPhotos} disabled={disabled} onAddPhoto={handleAddPhotoClick} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFilesSelected(e.target.files, Date.now());
          e.target.value = "";
        }}
      />
      {notice && <p className="px-4 py-2 text-sm text-red-600">{notice}</p>}
      <div className="flex-1">
        {listItems.length === 0 ? (
          <EmptyLog onAddPhoto={handleAddPhotoClick} />
        ) : (
          groups.map((group) => (
            <LogDateGroup key={group.key} label={group.label}>
              <LogPhotoGrid>
                {group.items.map((item) => {
                  if (item.kind === "processing") {
                    return <LogPhotoCardProcessing key={item.id} />;
                  }
                  if (item.kind === "error") {
                    return (
                      <LogPhotoCardError key={item.id} onDismiss={() => handleDismissError(item.id)} />
                    );
                  }
                  const photo = item.photo;
                  if (editDraft?.id === photo.id) {
                    return (
                      <LogPhotoCardEditing
                        key={photo.id}
                        photo={photo}
                        caption={editDraft.caption}
                        dayDate={editDraft.dayDate}
                        onCaptionChange={(value) =>
                          setEditDraft((prev) =>
                            prev ? { ...prev, caption: value.slice(0, PHOTO_CAPTION_MAX_LENGTH) } : prev,
                          )
                        }
                        onDayDateChange={(value) =>
                          setEditDraft((prev) => (prev ? { ...prev, dayDate: value } : prev))
                        }
                        onClearDayDate={() =>
                          setEditDraft((prev) => (prev ? { ...prev, dayDate: "" } : prev))
                        }
                        onSave={handleSaveEdit}
                        onCancel={handleCancelEdit}
                      />
                    );
                  }
                  if (deletingId === photo.id) {
                    return (
                      <LogPhotoCardConfirmDelete
                        key={photo.id}
                        photo={photo}
                        onDelete={() => handleConfirmDelete(photo.id)}
                        onCancel={handleCancelDelete}
                      />
                    );
                  }
                  return (
                    <LogPhotoCard
                      key={photo.id}
                      photo={photo}
                      onTapEdit={() => handleStartEdit(photo)}
                      onTapDelete={() => handleStartDelete(photo)}
                    />
                  );
                })}
              </LogPhotoGrid>
            </LogDateGroup>
          ))
        )}
      </div>
      <div className="px-4 pb-4">
        <AdSlotPlaceholder />
      </div>
    </div>
  );
}
