"use client";

import { useRouter } from "next/navigation";
import { formatDateRange } from "@/lib/format-date";
import { getTripTypeLabel } from "@/lib/trip-type";
import type { Shiori } from "@/types/shiori";
import { CoverAvatar } from "./CoverAvatar";

/**
 * しおり一覧の1件分カード。
 * 参照: docs/design/screens/S1_ホーム一覧.md「ShioriCard」
 *
 * S3のリスト行と同じ「紙のカード+シェブロン」の作りに揃える。
 */
export function ShioriCard({ shiori }: { shiori: Shiori }) {
  const router = useRouter();
  const dateRange = formatDateRange(shiori.start_date, shiori.end_date);

  return (
    <button
      type="button"
      onClick={() => router.push(`/shiori/${shiori.id}/packing`)}
      className="flex w-full items-center gap-3.5 rounded-2xl border border-paper-border bg-paper-surface p-4 text-left"
    >
      <CoverAvatar cover={shiori.cover} />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-base font-bold text-ink">{shiori.title}</span>
        {dateRange && <span className="text-[12.5px] font-medium text-ink-sub">{dateRange}</span>}
        <span className="mt-0.5 inline-flex w-fit items-center rounded-full bg-sakura-soft px-2 py-0.5 text-xs font-bold text-sakura-ink">
          {getTripTypeLabel(shiori.trip_type)}
        </span>
      </span>
      <svg
        width="16"
        height="16"
        viewBox="0 0 18 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="flex-none text-ink-faint"
      >
        <path d="M6.5 3.5 12.5 9l-6 5.5" />
      </svg>
    </button>
  );
}
