import { Suspense } from "react";

import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { SettingsRoute } from "@/components/settings/SettingsRoute";

/**
 * S6 設定/アカウント画面。
 * 参照: docs/design/screens/S6_設定アカウント.md
 *
 * ルーティングは同ドキュメントの仮置きどおり`/settings`(仕様にS6のパス名指定が無いため)。
 *
 * このファイルはServer Componentのまま保つ(`"use client"`を付けない)。
 * Client Componentのページファイルは`export const dynamic`を持てず、
 * ルートが動的扱い(リクエストごとにNetlify Functions起動)になるため
 * (`src/app/shiori/[id]/itinerary/page.tsx`と同じ理由)。
 *
 * `authError`クエリパラメータはページ側のsearchParamsで読むとルートが動的になるため、
 * `SettingsRoute`(Client Component)の`useSearchParams`で読む。
 * `useSearchParams`はSuspense境界を要求するのでここで包む。
 */
export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full flex-1 flex-col bg-paper">
          <SettingsHeader />
        </div>
      }
    >
      <SettingsRoute />
    </Suspense>
  );
}

export const dynamic = "force-static";
