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

  // ロード結果を「どのidのものか」ごと保持する。
  // 別のしおりidへ遷移した直後は loaded.id !== shioriId となりローディング表示に戻るため、
  // 前のしおりのタイトル・日程が一瞬表示される不整合が起きない
  // (effect本体でのsetStateリセットを避けつつ同じ効果を得るための形)。
  const [loaded, setLoaded] = useState<{
    id: string;
    state: Exclude<LoadState, "loading">;
    shiori: Shiori | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getShiori(shioriId)
      .then((found) => {
        if (cancelled) {
          return;
        }
        if (found) {
          setLoaded({ id: shioriId, state: "ready", shiori: found });
        } else {
          setLoaded({ id: shioriId, state: "not-found", shiori: null });
        }
      })
      .catch(() => {
        // guest-store読込に失敗した場合もS3仕様に定義された「見つからない」表示にフォールバックする(仮置き)。
        if (!cancelled) {
          setLoaded({ id: shioriId, state: "not-found", shiori: null });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [shioriId]);

  const current = loaded && loaded.id === shioriId ? loaded : null;
  const state: LoadState = current ? current.state : "loading";
  const shiori = current?.shiori ?? null;

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
