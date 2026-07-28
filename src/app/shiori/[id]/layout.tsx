"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { ShioriDetailHeader } from "@/components/shiori-detail/ShioriDetailHeader";
import { TabBar, type ShioriTabId } from "@/components/shiori-detail/TabBar";
import { FEATURE_SHARE } from "@/lib/feature-flags";
import { formatDateRange } from "@/lib/format-date";
import { getShiori } from "@/lib/guest-store";
import { useCompactHeader } from "@/lib/use-compact-header";
import type { Shiori } from "@/types/shiori";

/**
 * S3 しおり詳細(タブシェル共通)。
 * 参照: docs/design/screens/S3_しおり詳細.md
 */
type LoadState = "loading" | "ready" | "not-found";

const TAB_IDS: ShioriTabId[] = ["packing", "todo", "itinerary", "log"];

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
  const compact = useCompactHeader();

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
  // 共有機能はファーストリリースでは閉じる(src/lib/feature-flags.ts)。
  // フラグを`true`に戻すとヘッダーの共有アイコンが復活する。
  const shareHref =
    FEATURE_SHARE && state === "ready" ? `/shiori/${shioriId}/share` : undefined;

  // S4(スポット検索 `/shiori/[id]/spots/...`)/S5(共有画像 `/shiori/[id]/share`)は
  // 独自のヘッダー・戻る導線を持つ専用画面のため、このレイアウトのタブシェル
  // (ヘッダー+タブバー)を適用しない。
  // 参照: docs/design/screens/S4_スポット検索.md「レイアウト」(一覧画面ヘッダー/詳細画面ヘッダー)、
  // docs/design/screens/S5_共有画像プレビュー.md「レイアウト」(専用ヘッダー「共有画像を作る」)
  if (
    pathname.startsWith(`/shiori/${shioriId}/spots`) ||
    pathname.startsWith(`/shiori/${shioriId}/share`)
  ) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-paper">
      {/* ヘッダーとタブは1つのstickyブロックにまとめ、スクロール中もタブが常に見える状態を保つ */}
      <div className="sticky top-0 z-30 bg-paper-surface">
        <ShioriDetailHeader
          loading={state === "loading"}
          title={state === "not-found" ? "しおりが見つかりません" : (shiori?.title ?? "")}
          dateRange={dateRange}
          shareHref={shareHref}
          compact={compact}
        />
        <TabBar shioriId={shioriId} activeTab={activeTab} disabled={state === "loading"} />
      </div>
      <div className="flex flex-1 flex-col">
        {state === "not-found" ? (
          <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
            <p className="text-ink-sub">このしおりは見つかりませんでした</p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="h-12 rounded-btn border border-sakura-border bg-paper-surface px-5 text-[15px] font-bold text-sakura-ink"
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
