"use client";

import { useEffect, useState } from "react";
import { BackButton } from "@/components/common/BackButton";
import { buildGoogleMapsSearchUrl } from "@/lib/googleMapsUrl";
import { createShioriSpot, deleteShioriSpot, listShioriSpotsByShiori } from "@/lib/guest-store";
import { getSpotCategoryLabel } from "@/lib/spot-category";
import type { SeedSpot } from "@/lib/seed-spots";

interface SpotSearchDetailProps {
  shioriId: string;
  spot: SeedSpot;
  /** 一覧へ戻る際に検索条件(`q`/`category`)を保持するためのクエリ文字列("?q=...&category=..."または"")。 */
  backQueryString: string;
}

/**
 * S4 詳細画面(`/shiori/[id]/spots/search/[spotId]`)。
 * 参照: docs/design/screens/S4_スポット検索.md「詳細画面」「DetailBody」「AddedIndicator」
 */
export function SpotSearchDetail({ shioriId, spot, backQueryString }: SpotSearchDetailProps) {
  const [added, setAdded] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listShioriSpotsByShiori(shioriId).then((rows) => {
      if (!cancelled) {
        setAdded(rows.some((row) => row.spot_id === spot.id));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [shioriId, spot.id]);

  async function handleAdd() {
    setPending(true);
    try {
      await createShioriSpot({ shiori_id: shioriId, spot_id: spot.id });
      setAdded(true);
    } finally {
      // 書き込み失敗時もpendingを必ず解除し、ボタンが操作不能のまま固まるのを防ぐ
      setPending(false);
    }
  }

  async function handleRemove() {
    setPending(true);
    try {
      await deleteShioriSpot(shioriId, spot.id);
      setAdded(false);
    } finally {
      setPending(false);
    }
  }

  const categoryLabel = getSpotCategoryLabel(spot.category);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-neutral-50 pb-20">
      <div className="sticky top-0 flex h-14 items-center gap-2 border-b border-neutral-200 bg-white px-2">
        <BackButton href={`/shiori/${shioriId}/spots/search${backQueryString}`} />
        <h1 className="flex-1 truncate text-xl font-bold text-neutral-900">{spot.name}</h1>
        <div className="w-11 shrink-0" aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-4 px-4 py-4">
        <div className="flex items-center gap-2">
          {categoryLabel && (
            <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs text-pink-700">{categoryLabel}</span>
          )}
          <span className="text-sm text-neutral-500">{spot.area}</span>
        </div>
        <a
          href={buildGoogleMapsSearchUrl(spot.map_query || spot.name)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-pink-500"
        >
          地図で見る
        </a>
        <div>
          <h2 className="text-lg font-bold text-neutral-900">このスポットについて</h2>
          <p className="whitespace-pre-wrap text-base text-neutral-900">{spot.description}</p>
        </div>
        {spot.caution && (
          <div className="rounded-lg bg-red-50 p-4 text-red-600">⚠ {spot.caution}</div>
        )}
      </div>

      <div className="sticky bottom-0 mt-auto flex items-center justify-between border-t border-neutral-200 bg-white p-4">
        {added ? (
          <>
            <span className="flex items-center gap-1 text-base font-semibold text-neutral-400">
              ✓ 追加済み
            </span>
            <button
              type="button"
              onClick={handleRemove}
              disabled={pending}
              className="flex h-11 items-center px-2 text-xs text-neutral-500"
            >
              追加を取り消す
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleAdd}
            disabled={added === null || pending}
            className="h-11 w-full rounded-lg bg-pink-500 text-base font-semibold text-white disabled:opacity-50"
          >
            しおりに追加
          </button>
        )}
      </div>
    </div>
  );
}
