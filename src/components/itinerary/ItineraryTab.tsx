"use client";

import { useEffect, useState } from "react";
import { getShiori } from "@/lib/guest-store";
import { buildItineraryDayList, type ItineraryDayInfo } from "@/lib/itinerary-days";
import { ItinerarySection } from "./ItinerarySection";
import { ItinerarySkeleton } from "./ItinerarySkeleton";
import { SegmentedControl, type ItinerarySegment } from "./SegmentedControl";
import { SpotsPlaceholder } from "./SpotsPlaceholder";

/**
 * S3c ItineraryTab(旅程タブ本体)。
 * 参照: docs/design/screens/S3c_旅程スポット.md
 *
 * 「旅程」/「行きたい場所」のセグメント切替の器を提供する。本タスク(F4/W2タスク#8)では
 * 「旅程」セクション(ItinerarySection)のみを実装し、「行きたい場所」はタスク#9が
 * 置き換えるプレースホルダー(SpotsPlaceholder)に留める。
 */
export function ItineraryTab({ shioriId }: { shioriId: string }) {
  const [section, setSection] = useState<ItinerarySegment>("itinerary");
  const [dayList, setDayList] = useState<ItineraryDayInfo[] | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getShiori(shioriId).then((shiori) => {
      if (cancelled) {
        return;
      }
      setDayList(buildItineraryDayList(shiori?.start_date ?? null, shiori?.end_date ?? null));
    });
    return () => {
      cancelled = true;
    };
  }, [shioriId]);

  return (
    <div className="flex flex-1 flex-col">
      <SegmentedControl active={section} onChange={setSection} />
      {section === "itinerary" ? (
        dayList === undefined ? (
          <ItinerarySkeleton />
        ) : (
          <ItinerarySection shioriId={shioriId} dayList={dayList} />
        )
      ) : (
        <SpotsPlaceholder />
      )}
    </div>
  );
}
