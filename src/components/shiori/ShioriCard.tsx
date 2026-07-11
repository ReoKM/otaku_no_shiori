"use client";

import { useRouter } from "next/navigation";
import { formatDateRange } from "@/lib/format-date";
import { getTripTypeLabel } from "@/lib/trip-type";
import type { Shiori } from "@/types/shiori";
import { CoverAvatar } from "./CoverAvatar";

/**
 * しおり一覧の1件分カード。
 * 参照: docs/design/screens/S1_ホーム一覧.md「ShioriCard」
 */
export function ShioriCard({ shiori }: { shiori: Shiori }) {
  const router = useRouter();
  const dateRange = formatDateRange(shiori.start_date, shiori.end_date);

  return (
    <button
      type="button"
      onClick={() => router.push(`/shiori/${shiori.id}/packing`)}
      className="flex w-full items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 text-left"
    >
      <CoverAvatar cover={shiori.cover} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-base font-semibold text-neutral-900">
          {shiori.title}
        </p>
        {dateRange && <p className="text-sm text-neutral-500">{dateRange}</p>}
        <span className="inline-flex w-fit items-center rounded-full bg-pink-100 px-2 py-1 text-xs text-pink-700">
          {getTripTypeLabel(shiori.trip_type)}
        </span>
      </div>
    </button>
  );
}
