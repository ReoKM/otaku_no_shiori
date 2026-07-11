"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { ShioriDetailHeader } from "@/components/shiori-detail/ShioriDetailHeader";
import { TabBar, type ShioriTabId } from "@/components/shiori-detail/TabBar";
import { formatDateRange } from "@/lib/format-date";
import { getShiori } from "@/lib/guest-store";
import type { Shiori } from "@/types/shiori";

/**
 * S3 しおり詳細(タブシェル共通)。
 * 参照: docs/design/screens/S3_しおり詳細.md
 */
type LoadState = "loading" | "ready" | "not-found";

const TAB_IDS: ShioriTabId[] = ["packing", "todo", "itinerary", "spots", "log"];

function resolveActiveTab(pathname: string, shioriId: string): ShioriTabId | null {
  const prefix = `/shiori/${shioriId}/`;
  if (!pathname.startsWith(prefix)) {
    return null;
  }
  const rest = pathname.slice(prefix.length).split("/")[0];
  return TAB_IDS.find((tab) => tab === rest) ?? null;
}

export default function ShioriDetailLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string }>();
  const shioriId = params.id;
  const pathname = usePathname();
  const router = useRouter();

  const [state, setState] = useState<LoadState>("loading");
  const [shiori, setShiori] = useState<Shiori | null>(null);

  useEffect(() => {
    let cancelled = false;
    getShiori(shioriId)
      .then((found) => {
        if (cancelled) {
          return;
        }
        if (found) {
          setShiori(found);
          setState("ready");
        } else {
          setState("not-found");
        }
      })
      .catch(() => {
        // guest-store読込に失敗した場合もS3仕様に定義された「見つからない」表示にフォールバックする(仮置き)。
        if (!cancelled) {
          setState("not-found");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [shioriId]);

  const activeTab = resolveActiveTab(pathname, shioriId);
  const dateRange = shiori ? formatDateRange(shiori.start_date, shiori.end_date) : null;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-neutral-50">
      <ShioriDetailHeader
        loading={state === "loading"}
        title={state === "not-found" ? "しおりが見つかりません" : (shiori?.title ?? "")}
        dateRange={dateRange}
      />
      <TabBar shioriId={shioriId} activeTab={activeTab} disabled={state === "loading"} />
      <div className="flex flex-1 flex-col">
        {state === "not-found" ? (
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
        ) : (
          children
        )}
      </div>
    </div>
  );
}
