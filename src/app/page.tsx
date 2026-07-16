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
    <div className="flex min-h-full flex-1 flex-col bg-neutral-50">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white px-4 py-4">
        <p className="text-xl font-bold text-neutral-900">オタクのしおり</p>
      </header>
      <main className="flex flex-1 flex-col gap-8 px-4 py-4">
        {state === "loading" && <ShioriListSkeleton />}
        {state === "error" && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-red-600">しおりの読み込みに失敗しました</p>
            <button
              type="button"
              onClick={handleReload}
              className="h-11 rounded-lg border border-pink-500 px-4 text-pink-500"
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
      <footer className="flex items-center justify-center gap-6 px-4 pb-6 pt-2">
        <Link href="/terms" className="text-xs text-neutral-400 underline-offset-2 hover:underline">
          利用規約
        </Link>
        <Link href="/privacy" className="text-xs text-neutral-400 underline-offset-2 hover:underline">
          プライバシーポリシー
        </Link>
      </footer>
      {state === "ready" && shioriList.length > 0 && <FabButton />}
    </div>
  );
}
