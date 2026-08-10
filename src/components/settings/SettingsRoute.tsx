"use client";

import { useSearchParams } from "next/navigation";

import { LegalLinks } from "./LegalLinks";
import { LoggedOutSection } from "./LoggedOutSection";
import { SettingsHeader } from "./SettingsHeader";

/**
 * S6 設定/アカウント画面のルート用ラッパー(クエリパラメータの読み取り担当)。
 * 参照: docs/design/screens/S6_設定アカウント.md
 *
 * `/auth/callback`(#94)はログイン失敗時に`?authError=<理由コード>`を付けてここへ戻ってくる
 * (`src/lib/supabase/oauth-login.ts`の`redirectTo`が`next=/settings`を指定しているため)。
 * `useSearchParams`を使うため、呼び出し元(`app/settings/page.tsx`)でSuspenseに包む必要がある
 * (`src/components/itinerary/ItineraryRoute.tsx`と同じ理由・同じパターン)。
 *
 * ログイン中(authState: loggedIn)の表示(ログアウト・データ移行状態)はIssue #96のスコープ。
 * 本コンポーネントは「未ログイン状態のレイアウト」のみを扱う。
 */
export function SettingsRoute() {
  const searchParams = useSearchParams();
  const loginFailed = searchParams.get("authError") !== null;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-paper">
      <SettingsHeader />
      <main className="flex flex-1 flex-col gap-8 px-6 pt-6 pb-8">
        <LoggedOutSection initialLoginFailed={loginFailed} />
      </main>
      <LegalLinks />
    </div>
  );
}
