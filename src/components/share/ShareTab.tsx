"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getShiori,
  listItineraryEntriesByShiori,
  listPackingItemsByShiori,
  listPhotosByShiori,
  listShioriSpotsByShiori,
  listSpots,
} from "@/lib/guest-store";
import { formatDateRange } from "@/lib/format-date";
import { buildItineraryDayList } from "@/lib/itinerary-days";
import { blobToDataUrl, buildShareImageProps } from "@/lib/share-image-props";
import { canUseWebShareFiles, isShareAbortError } from "@/lib/share-image-save";
import { buildUgcSpotMap, resolveSpotRows } from "@/lib/spot-list";
import type { ShareImageTemplateId } from "@/templates/share-image/types";
import type { ItineraryEntry, PackingItem, Photo, Shiori } from "@/types/shiori";
import { FailedBlock } from "./FailedBlock";
import { GeneratingBlock } from "./GeneratingBlock";
import { PhotoSection, PHOTO_SELECT_MAX } from "./PhotoSection";
import { PreviewBlock } from "./PreviewBlock";
import { ShareHeader } from "./ShareHeader";
import { TemplateSection } from "./TemplateSection";

/**
 * S5 ShareTab(共有画像プレビュー画面本体)。
 * 参照: docs/design/screens/S5_共有画像プレビュー.md
 *
 * `/api/share-image`(タスク#11、netlify/functions/share-image.mts)を呼び出し、
 * テンプレ選択→生成→プレビュー→端末保存(3段構えのフォールバック)の一連の状態遷移を扱う。
 */
type LoadState = "loading" | "ready" | "not-found";

interface ShareData {
  shiori: Shiori;
  photos: Photo[];
  packingItems: PackingItem[];
  itineraryEntries: ItineraryEntry[];
  spotNames: string[];
}

type ScreenState =
  | { kind: "selecting" }
  | { kind: "generating" }
  | { kind: "failed"; offline: boolean }
  | { kind: "preview"; imageUrl: string; blob: Blob; canShareFiles: boolean; saved: boolean };

const EXCESS_NOTICE_DURATION_MS = 4000;
const SHARE_IMAGE_ENDPOINT = "/api/share-image";
const SHARE_IMAGE_FILE_NAME = "share-image.png";

export function ShareTab({ shioriId }: { shioriId: string }) {
  const router = useRouter();
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [data, setData] = useState<ShareData | null>(null);
  const [templateId, setTemplateId] = useState<ShareImageTemplateId>("simple");
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [excessNotice, setExcessNotice] = useState(false);
  const [screenState, setScreenState] = useState<ScreenState>({ kind: "selecting" });

  const excessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const shiori = await getShiori(shioriId);
      if (cancelled) {
        return;
      }
      if (!shiori) {
        setLoadState("not-found");
        return;
      }
      const [photos, packingItems, itineraryEntries, shioriSpots, ugcSpots] = await Promise.all([
        listPhotosByShiori(shioriId),
        listPackingItemsByShiori(shioriId),
        listItineraryEntriesByShiori(shioriId),
        listShioriSpotsByShiori(shioriId),
        listSpots(),
      ]);
      if (cancelled) {
        return;
      }
      const resolvedSpots = resolveSpotRows(shioriSpots, buildUgcSpotMap(ugcSpots));
      setData({
        shiori,
        photos,
        packingItems,
        itineraryEntries,
        spotNames: resolvedSpots.map((row) => row.name),
      });
      setLoadState("ready");
    }

    load().catch(() => {
      // guest-store読込に失敗した場合もS3/S4と同様「見つからない」表示にフォールバックする(仮置き)。
      if (!cancelled) {
        setLoadState("not-found");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [shioriId]);

  // 生成済み画像のObjectURLはアンマウント時にのみ破棄する(状態遷移中の破棄は
  // handleGenerate/handleBackToTemplate側で個別に行うため、ここではrefの最終値のみ見る)。
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (excessTimerRef.current) {
        clearTimeout(excessTimerRef.current);
      }
    };
  }, []);

  function showExcessNotice() {
    setExcessNotice(true);
    if (excessTimerRef.current) {
      clearTimeout(excessTimerRef.current);
    }
    excessTimerRef.current = setTimeout(() => setExcessNotice(false), EXCESS_NOTICE_DURATION_MS);
  }

  function handleTogglePhoto(id: string) {
    const alreadySelected = selectedPhotoIds.includes(id);
    if (!alreadySelected && selectedPhotoIds.length >= PHOTO_SELECT_MAX) {
      showExcessNotice();
      return;
    }
    setSelectedPhotoIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  function discardCurrentPreview() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }

  async function handleGenerate() {
    if (!data) {
      return;
    }
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      // オフライン時は通信不要な生成失敗と同じ表示にフォールバックする(仕様「状態」表、仮置き)。
      setScreenState({ kind: "failed", offline: true });
      return;
    }

    discardCurrentPreview();
    setScreenState({ kind: "generating" });

    try {
      const selectedPhotos = selectedPhotoIds
        .map((id) => data.photos.find((photo) => photo.id === id))
        .filter((photo): photo is Photo => photo !== undefined);
      const photoDataUrls = (
        await Promise.all(selectedPhotos.map((photo) => blobToDataUrl(photo.blob)))
      ).filter((url): url is string => url !== null);

      const dayList = buildItineraryDayList(data.shiori.start_date, data.shiori.end_date);
      const props = buildShareImageProps({
        templateId,
        title: data.shiori.title,
        formattedDateRange: formatDateRange(data.shiori.start_date, data.shiori.end_date),
        tripType: data.shiori.trip_type,
        itineraryEntries: data.itineraryEntries,
        dayList,
        packingLabels: data.packingItems.map((item) => item.label),
        spotNames: data.spotNames,
        photoDataUrls,
      });

      const response = await fetch(SHARE_IMAGE_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(props),
      });

      if (!response.ok) {
        setScreenState({ kind: "failed", offline: false });
        return;
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      previewUrlRef.current = imageUrl;

      const file = new File([blob], SHARE_IMAGE_FILE_NAME, { type: "image/png" });
      const canShareFiles = canUseWebShareFiles(
        typeof navigator !== "undefined" ? navigator : undefined,
        file,
      );

      setScreenState({ kind: "preview", imageUrl, blob, canShareFiles, saved: false });
    } catch {
      setScreenState({ kind: "failed", offline: false });
    }
  }

  function handleRetry() {
    setScreenState({ kind: "selecting" });
  }

  function handleBackToTemplate() {
    discardCurrentPreview();
    setScreenState({ kind: "selecting" });
  }

  async function handleSave() {
    if (screenState.kind !== "preview") {
      return;
    }
    const { blob, canShareFiles } = screenState;

    if (canShareFiles && typeof navigator !== "undefined" && typeof navigator.share === "function") {
      const file = new File([blob], SHARE_IMAGE_FILE_NAME, { type: "image/png" });
      try {
        await navigator.share({ files: [file] });
        setScreenState((prev) => (prev.kind === "preview" ? { ...prev, saved: true } : prev));
      } catch (error) {
        // 仕様「ユーザーが共有シートをキャンセルするとAbortErrorでrejectされる…
        // キャンセル時は状態を変えない」。Abort以外の異常系は仕様に指定が無いため、
        // 状態は変えずコンソールログのみ残す(完了報告の仮置きに明記)。
        if (!isShareAbortError(error)) {
          console.error("[S5] 共有に失敗しました", error);
        }
      }
      return;
    }

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = SHARE_IMAGE_FILE_NAME;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setScreenState((prev) => (prev.kind === "preview" ? { ...prev, saved: true } : prev));
  }

  if (loadState === "loading") {
    return (
      <div className="flex min-h-full flex-1 flex-col bg-neutral-50">
        <ShareHeader shioriId={shioriId} />
        <div className="flex flex-1 items-center justify-center px-4 py-10">
          <p className="text-sm text-neutral-500">読み込み中…</p>
        </div>
      </div>
    );
  }

  if (loadState === "not-found" || !data) {
    return (
      <div className="flex min-h-full flex-1 flex-col bg-neutral-50">
        <ShareHeader shioriId={shioriId} />
        <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
          <p className="text-red-600">このしおりは見つかりませんでした</p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="h-11 rounded-lg border border-pink-500 px-4 text-pink-500"
          >
            一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-neutral-50">
      <ShareHeader shioriId={shioriId} />
      <div className="flex flex-1 flex-col gap-8 px-4 py-4">
        {screenState.kind === "selecting" && (
          <>
            <TemplateSection selected={templateId} onSelect={setTemplateId} />
            <PhotoSection
              photos={data.photos}
              selectedIds={selectedPhotoIds}
              onToggle={handleTogglePhoto}
              excessNotice={excessNotice}
            />
          </>
        )}
        {screenState.kind === "generating" && <GeneratingBlock />}
        {screenState.kind === "failed" && (
          <FailedBlock offline={screenState.offline} onRetry={handleRetry} />
        )}
        {screenState.kind === "preview" && (
          <PreviewBlock
            imageUrl={screenState.imageUrl}
            canShareFiles={screenState.canShareFiles}
            saved={screenState.saved}
            onSave={handleSave}
            onBackToTemplate={handleBackToTemplate}
          />
        )}
      </div>
      {screenState.kind === "selecting" && (
        <div className="sticky bottom-0 border-t border-neutral-200 bg-white p-4">
          <button
            type="button"
            onClick={handleGenerate}
            className="h-11 w-full rounded-lg bg-pink-500 text-base font-semibold text-white"
          >
            共有画像を作成
          </button>
        </div>
      )}
    </div>
  );
}
