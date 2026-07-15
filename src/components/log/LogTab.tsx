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
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmingDelete, setConfirmingDelete] = useState(false);
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

  function handleEnterSelectMode() {
    setEditDraft(null);
    setSelectMode(true);
    setSelectedIds(new Set());
    setConfirmingDelete(false);
  }

  function handleCancelSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
    setConfirmingDelete(false);
  }

  function handleToggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleRequestDeleteConfirm() {
    if (selectedIds.size === 0) {
      return;
    }
    setConfirmingDelete(true);
  }

  function handleCancelConfirm() {
    setConfirmingDelete(false);
  }

  async function handleConfirmBulkDelete() {
    // await後にstate変数(selectedIds)を直接参照しないよう、対象idを先にローカルへ固定する。
    const ids = Array.from(selectedIds);
    // 1件の失敗で全体がrejectして後続のsetState(選択モード解除)が走らなくなるのを防ぐため、
    // Promise.allSettledで全件の成否を待つ(PR #68レビュー指摘反映)。
    const results = await Promise.allSettled(ids.map((id) => deletePhoto(id)));
    // 削除に成功した写真のみUIから除去する(失敗した写真はDBに残っているため表示も残す)。
    const deletedIds = new Set(ids.filter((_, i) => results[i].status === "fulfilled"));
    setPhotos((prev) => (prev ? prev.filter((p) => !deletedIds.has(p.id)) : prev));
    // 成否に関わらず選択モード・確認バー・選択状態は解除する(UIが固まるのを防ぐ)。
    setSelectMode(false);
    setSelectedIds(new Set());
    setConfirmingDelete(false);
    const failedCount = ids.length - deletedIds.size;
    if (failedCount > 0) {
      showNotice(`${failedCount}枚の削除に失敗しました`);
    }
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
        <LogToolbar
          count={0}
          max={maxPhotos}
          addDisabled
          selectMode={false}
          confirming={false}
          selectedCount={0}
          onAddPhoto={() => {}}
          onEnterSelectMode={() => {}}
          onCancelSelectMode={() => {}}
          onRequestDeleteConfirm={() => {}}
          onConfirmDelete={() => {}}
          onCancelConfirm={() => {}}
        />
        <LogSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <LogToolbar
        count={savedCount}
        max={maxPhotos}
        addDisabled={disabled}
        selectMode={selectMode}
        confirming={confirmingDelete}
        selectedCount={selectedIds.size}
        onAddPhoto={handleAddPhotoClick}
        onEnterSelectMode={handleEnterSelectMode}
        onCancelSelectMode={handleCancelSelectMode}
        onRequestDeleteConfirm={handleRequestDeleteConfirm}
        onConfirmDelete={handleConfirmBulkDelete}
        onCancelConfirm={handleCancelConfirm}
      />
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
                  if (!selectMode && editDraft?.id === photo.id) {
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
                  return (
                    <LogPhotoCard
                      key={photo.id}
                      photo={photo}
                      onTapEdit={() => handleStartEdit(photo)}
                      selectMode={selectMode}
                      selected={selectedIds.has(photo.id)}
                      onToggleSelect={() => handleToggleSelect(photo.id)}
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
