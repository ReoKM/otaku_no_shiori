"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { resolveOAuthProvider } from "@/lib/supabase/auth-provider";
import { LegalLinks } from "./LegalLinks";
import { LoggedInSection } from "./LoggedInSection";
import { LoggedOutSection } from "./LoggedOutSection";
import { SettingsHeader } from "./SettingsHeader";

/**
 * ログイン状態。`getUser()`の応答が返るまでは`"loading"`とし、`LoggedInSection`/
 * `LoggedOutSection`のどちらも表示しない(誤った状態のセクションが一瞬見えるフラッシュを
 * 避けるための仮置き。仕様書にローディング状態の定義が無いための実装判断。完了報告に記載)。
 */
type AuthState = { status: "loading" } | { status: "loggedOut" } | { status: "loggedIn"; user: User };

/**
 * S6 設定/アカウント画面のルート用ラッパー(クエリパラメータの読み取り・ログイン状態判定担当)。
 * 参照: docs/design/screens/S6_設定アカウント.md
 *
 * `/auth/callback`(#94)はログイン失敗時に`?authError=<理由コード>`を付けてここへ戻ってくる
 * (`src/lib/supabase/oauth-login.ts`の`redirectTo`が`next=/settings`を指定しているため)。
 * `useSearchParams`を使うため、呼び出し元(`app/settings/page.tsx`)でSuspenseに包む必要がある
 * (`src/components/itinerary/ItineraryRoute.tsx`と同じ理由・同じパターン)。
 *
 * ログイン状態の判定は`supabase.auth.getUser()`(マウント時の初回判定)と
 * `onAuthStateChange`(ログアウトボタン押下等での状態変化の反映)の2本立てで行う。
 * `getUser()`を使う理由(`getSession()`ではない)は`src/lib/supabase/middleware.ts`と同じ
 * (Supabase Authサーバーにトークンを問い合わせて検証し直すため)。
 */
export function SettingsRoute() {
  const searchParams = useSearchParams();
  const loginFailed = searchParams.get("authError") !== null;
  const [authState, setAuthState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let isMounted = true;

    // 環境変数未設定(`MissingSupabaseEnvError`)等はここで同期的に投げられうるため、
    // Promiseチェーンの外側もtry/catchで囲む(`src/components/shiori-detail/LoginPromptBanner.tsx`
    // と同じ考え方: 判定できない場合はゲスト利用者を巻き込んで画面ごと壊さず、未ログイン扱いにする)。
    try {
      const supabase = getSupabaseBrowserClient();

      supabase.auth
        .getUser()
        .then(({ data }) => {
          if (!isMounted) {
            return;
          }
          setAuthState(data.user ? { status: "loggedIn", user: data.user } : { status: "loggedOut" });
        })
        .catch(() => {
          if (isMounted) {
            setAuthState({ status: "loggedOut" });
          }
        });

      // ログアウトボタン(`LogoutButton`)押下後、`LoggedOutSection`表示へ切り替えるための購読
      // (仕様「完了後はLoggedOutSection表示に戻る」)。ログイン自体は外部OAuth画面への
      // フルページ遷移を経て`/settings`に戻ってくるため、通常はマウント時の`getUser()`で
      // 判定できるが、この購読があればページ遷移なしでの状態変化にも追従できる。
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setAuthState(session?.user ? { status: "loggedIn", user: session.user } : { status: "loggedOut" });
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    } catch {
      // 同期的なsetStateはeffect内では避ける(react-hooks/set-state-in-effect)ため、マイクロタスクへずらす。
      queueMicrotask(() => {
        if (isMounted) {
          setAuthState({ status: "loggedOut" });
        }
      });
      return () => {
        isMounted = false;
      };
    }
  }, []);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-paper">
      <SettingsHeader />
      <main className="flex flex-1 flex-col gap-8 px-6 pt-6 pb-8">
        {authState.status === "loggedOut" && <LoggedOutSection initialLoginFailed={loginFailed} />}
        {authState.status === "loggedIn" && (
          <LoggedInSection provider={resolveOAuthProvider(authState.user)} />
        )}
      </main>
      <LegalLinks />
    </div>
  );
}
