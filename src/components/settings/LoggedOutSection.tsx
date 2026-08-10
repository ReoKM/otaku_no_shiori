"use client";

import { useEffect, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { type OAuthProvider, signInWithProvider } from "@/lib/supabase/oauth-login";
import { GuestNotice } from "./GuestNotice";
import { LoginButtonGoogle, LoginButtonX } from "./LoginButtons";
import { LoginErrorNotice } from "./LoginErrorNotice";
import { OfflineNotice } from "./OfflineNotice";

/**
 * S6未ログイン状態のセクション。
 * 参照: docs/design/screens/S6_設定アカウント.md「LoggedOutSection」「タップ時の挙動」「状態」
 *
 * ログイン中プロバイダ表示・データ移行状態・ログアウト(LoggedInSection)は本コンポーネントの
 * スコープ外(Issue #96)。ここでは「未ログイン状態のレイアウト」とX/Googleログインボタンの
 * 起動のみを扱う。
 */
export function LoggedOutSection({ initialLoginFailed = false }: { initialLoginFailed?: boolean }) {
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);
  const [loginFailed, setLoginFailed] = useState(initialLoginFailed);
  // 初期値は遅延初期化で`navigator.onLine`から取る(SSR中は`navigator`が無いためオンライン扱い)。
  // effect内で直接setStateすると連鎖レンダリングになるため、購読(addEventListener)のみをeffectに置く。
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [offlineTapProvider, setOfflineTapProvider] = useState<OAuthProvider | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    function handleOnline() {
      setIsOnline(true);
      setOfflineTapProvider(null);
    }
    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  async function handleLogin(provider: OAuthProvider) {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      // オフライン時: ログインボタンはグレーアウトせず、タップ時点でこのボタン直下に
      // 注意文言を即時表示する(仕様の「S2のバリデーション表示と同様に即時反映」)。
      setOfflineTapProvider(provider);
      return;
    }
    setOfflineTapProvider(null);
    setLoginFailed(false);
    setLoadingProvider(provider);

    const supabase = getSupabaseBrowserClient();
    const result = await signInWithProvider(supabase, provider, window.location.origin);

    if (!result.ok) {
      setLoadingProvider(null);
      setLoginFailed(true);
    }
    // 成功時はブラウザがプロバイダの同意画面(外部サイト)へ遷移するため、
    // ここでのstate更新は基本的に発生しない(遷移前の一瞬だけローディング表示が見える想定)。
  }

  return (
    <section className="flex flex-col gap-6">
      <GuestNotice />
      <div className="flex flex-col gap-3">
        <LoginButtonX
          isLoading={loadingProvider === "twitter"}
          isDisabled={loadingProvider !== null && loadingProvider !== "twitter"}
          showOfflineMessage={offlineTapProvider === "twitter"}
          onPress={() => handleLogin("twitter")}
        />
        <LoginButtonGoogle
          isLoading={loadingProvider === "google"}
          isDisabled={loadingProvider !== null && loadingProvider !== "google"}
          showOfflineMessage={offlineTapProvider === "google"}
          onPress={() => handleLogin("google")}
        />
      </div>
      {loginFailed && <LoginErrorNotice />}
      {!isOnline && <OfflineNotice />}
    </section>
  );
}
