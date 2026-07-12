"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/common/BackButton";
import { ItinerarySkeleton } from "@/components/itinerary/ItinerarySkeleton";
import { listShioriSpotsByShiori } from "@/lib/guest-store";
import { SEED_SPOTS } from "@/lib/seed-spots";
import { searchSeedSpots, type SpotCategoryFilter } from "@/lib/spot-search";
import { CategoryChips } from "./CategoryChips";
import { EmptySearchResult } from "./EmptySearchResult";
import { SpotCard } from "./SpotCard";

interface SpotSearchListProps {
  shioriId: string;
  initialKeyword: string;
  initialCategory: SpotCategoryFilter;
}

/**
 * S4 一覧画面(`/shiori/[id]/spots/search`)。
 * 参照: docs/design/screens/S4_スポット検索.md「一覧画面」
 *
 * 検索キーワード・カテゴリの状態はURLクエリ(`q`/`category`)に同期する(`router.replace`)。
 * 詳細画面への遷移は`router.push`のため、詳細画面の戻るボタンでの復帰時も
 * このクエリからそのまま復元できる(S4仕様「検索条件は保持したまま」に対応)。
 */
export function SpotSearchList({ shioriId, initialKeyword, initialCategory }: SpotSearchListProps) {
  const router = useRouter();
  const [keyword, setKeyword] = useState(initialKeyword);
  const [category, setCategory] = useState<SpotCategoryFilter>(initialCategory);
  const [addedSpotIds, setAddedSpotIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    let cancelled = false;
    listShioriSpotsByShiori(shioriId).then((rows) => {
      if (!cancelled) {
        setAddedSpotIds(new Set(rows.map((row) => row.spot_id)));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [shioriId]);

  useEffect(() => {
    const query = new URLSearchParams();
    if (keyword) {
      query.set("q", keyword);
    }
    if (category !== "all") {
      query.set("category", category);
    }
    const qs = query.toString();
    router.replace(`/shiori/${shioriId}/spots/search${qs ? `?${qs}` : ""}`, { scroll: false });
    // keyword/categoryの変化のみを追跡する(routerは安定参照ではないため依存に含めない)。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shioriId, keyword, category]);

  const results = useMemo(() => searchSeedSpots(SEED_SPOTS, keyword, category), [keyword, category]);

  function handleTapSpot(spotId: string) {
    const query = new URLSearchParams();
    if (keyword) {
      query.set("q", keyword);
    }
    if (category !== "all") {
      query.set("category", category);
    }
    const qs = query.toString();
    router.push(`/shiori/${shioriId}/spots/search/${spotId}${qs ? `?${qs}` : ""}`);
  }

  function handleBackToShioriFreeForm() {
    router.push(`/shiori/${shioriId}/itinerary?section=spots&openFreeForm=1`);
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-neutral-50">
      <div className="sticky top-0 flex h-14 items-center gap-2 border-b border-neutral-200 bg-white px-2">
        <BackButton href={`/shiori/${shioriId}/itinerary?section=spots`} />
        <h1 className="flex-1 truncate text-center text-xl font-bold text-neutral-900">スポットを探す</h1>
        <div className="w-11 shrink-0" aria-hidden="true" />
      </div>

      <div className="px-4 py-3">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="スポット名・エリアで検索"
          aria-label="スポット名・エリアで検索"
          className="h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-base text-neutral-900"
        />
      </div>

      <CategoryChips active={category} onChange={setCategory} />

      <div className="px-4 py-2">
        <p className="text-sm text-neutral-500">{results.length}件</p>
      </div>

      {addedSpotIds === null ? (
        <ItinerarySkeleton />
      ) : results.length === 0 ? (
        <EmptySearchResult onBackToShiori={handleBackToShioriFreeForm} />
      ) : (
        <div className="flex flex-col">
          {results.map((spot) => (
            <SpotCard
              key={spot.id}
              spot={spot}
              added={addedSpotIds.has(spot.id)}
              onTap={() => handleTapSpot(spot.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
