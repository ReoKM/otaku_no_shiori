"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdSlotPlaceholder } from "@/components/common/AdSlotPlaceholder";
import { EmptyState } from "@/components/shiori/EmptyState";
import { FabButton } from "@/components/shiori/FabButton";
import { ShioriCard } from "@/components/shiori/ShioriCard";
import { ShioriListSkeleton } from "@/components/shiori/ShioriListSkeleton";
import { listShiori } from "@/lib/guest-store";
import type { Shiori } from "@/types/shiori";

/**
 * S1 ホーム/しおり一覧。
 * 参照: docs/design/screens/S1_ホーム一覧.md
 */
type LoadState = "loading" | "ready" | "error";

export default function Home() {
  const [state, setState] = useState<LoadState>("loading");
  const [shioriList, setShioriList] = useState<Shiori[]>([]);

  const fetchList = useCallback(() => {
    return listShiori()
      .then((list) => {
        setShioriList(list);
        setState("ready");
      })
      .catch(() => {
        setState("error");
      });
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  function handleReload() {
    setState("loading");
    fetchList();
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-paper">
      <header className="sticky top-0 z-30 border-b border-paper-border bg-paper-surface px-6 py-4">
        <p className="text-xl font-black tracking-[0.01em] text-ink">オタクのしおり</p>
      </header>
      <main className="flex flex-1 flex-col gap-8 px-6 pt-5 pb-8">
        {state === "loading" && <ShioriListSkeleton />}
        {state === "error" && (
          <div className="rounded-2xl border border-dashed border-paper-dashed bg-paper-surface px-5 py-8 text-center">
            <p className="text-[15px] font-bold text-ink-strong">しおりを読み込めませんでした</p>
            <p className="mt-2 text-[13px] text-ink-sub">通信は使っていないので、開き直すと直ることがあります</p>
            <button
              type="button"
              onClick={handleReload}
              className="mt-5 min-h-12 w-full rounded-btn border border-sakura-border bg-white text-[15px] font-bold text-sakura-ink"
            >
              再読み込み
            </button>
          </div>
        )}
        {state === "ready" &&
          (shioriList.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="flex flex-col gap-3">
              {shioriList.map((shiori) => (
                <ShioriCard key={shiori.id} shiori={shiori} />
              ))}
            </div>
          ))}
        <AdSlotPlaceholder />
      </main>
      {/* しおりが1件以上あるときは右下に追従ボタンが出るため、フッターのリンクが
          隠れないよう下余白を広げる */}
      <footer
        className={`flex items-center justify-center gap-6 px-6 pt-2 ${
          state === "ready" && shioriList.length > 0 ? "pb-24" : "pb-6"
        }`}
      >
        <Link href="/terms" className="text-xs text-ink-muted underline-offset-2 hover:underline">
          利用規約
        </Link>
        <Link href="/privacy" className="text-xs text-ink-muted underline-offset-2 hover:underline">
          プライバシーポリシー
        </Link>
      </footer>
      {state === "ready" && shioriList.length > 0 && <FabButton />}
    </div>
  );
}
