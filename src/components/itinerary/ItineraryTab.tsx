"use client";

import { useEffect, useState } from "react";
import { getShiori } from "@/lib/guest-store";
import { buildItineraryDayList, type ItineraryDayInfo } from "@/lib/itinerary-days";
import { ItinerarySection } from "./ItinerarySection";
import { ItinerarySkeleton } from "./ItinerarySkeleton";
import { SegmentedControl, type ItinerarySegment } from "./SegmentedControl";
import { SpotSection } from "./SpotSection";

/**
 * S3c ItineraryTab(旅程タブ本体)。
 * 参照: docs/design/screens/S3c_旅程スポット.md
 *
 * 「旅程」/「行きたい場所」のセグメント切替の器。
 * S4(スポット検索)からの「戻る」・「しおりに戻って自由に追加する」導線は
 * クエリパラメータ(`section=spots`/`openFreeForm=1`)で遷移してくるため、
 * `initialSection`/`initialOpenFreeForm`(`src/app/shiori/[id]/itinerary/page.tsx`が
 * searchParamsから渡す)を初期状態に反映する。
 */
export function ItineraryTab({
  shioriId,
  initialSection = "itinerary",
  initialOpenFreeForm = false,
}: {
  shioriId: string;
  initialSection?: ItinerarySegment;
  initialOpenFreeForm?: boolean;
}) {
  const [section, setSection] = useState<ItinerarySegment>(initialSection);
  const [dayList, setDayList] = useState<ItineraryDayInfo[] | null | undefined>(undefined);
  // Issue #63: 「旅程に追加」直後に強調表示・スクロールする対象のentry id。
  // `ItinerarySection`側で次の操作(編集・削除・並べ替え・予定追加を開始した時点)が
  // 行われたら`onHighlightConsumed`経由でnullに戻す(「次の操作まで一時的に強調」)。
  const [highlightEntryId, setHighlightEntryId] = useState<string | null>(null);

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
          <ItinerarySection
            shioriId={shioriId}
            dayList={dayList}
            highlightEntryId={highlightEntryId}
            onHighlightConsumed={() => setHighlightEntryId(null)}
          />
        )
      ) : (
        <SpotSection
          shioriId={shioriId}
          dayList={dayList ?? null}
          openFreeFormInitial={initialOpenFreeForm}
          onAddedToItinerary={(entryId) => {
            setSection("itinerary");
            setHighlightEntryId(entryId);
          }}
        />
      )}
    </div>
  );
}
