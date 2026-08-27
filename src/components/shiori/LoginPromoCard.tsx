"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type LoginState = "loading" | "loggedOut" | "loggedIn";

/**
 * S1ホーム下部の「ログインすると同期される」誘導カード。
 * オーナー指示により追加(仕様書に明記なし。ログイン動線をホーム下部にも常設する)。
 *
 * 文言は`src/components/settings/GuestNotice.tsx`(S6未ログイン時の説明文)と
 * 同じものを再利用し、アプリ内で表記を揃える。
 *
 * ログイン済みの場合は表示しない。判定できるまで(`loading`)は何も表示せず、
 * 一瞬表示→非表示のちらつきを避ける(`SettingsRoute`と同じ考え方)。
 */
export function LoginPromoCard() {
  const [state, setState] = useState<LoginState>("loading");

  useEffect(() => {
    let cancelled = false;

    try {
      // 環境変数未設定(`MissingSupabaseEnvError`)等はここで同期的に投げられうるため、
      // Promiseチェーンの外側もtry/catchで囲む(`src/components/shiori-detail/LoginPromptBanner.tsx`
      // と同じ考え方: 判定できない場合はゲスト扱いにする)。
      getSupabaseBrowserClient()
        .auth.getUser()
        .then(({ data }) => {
          if (!cancelled) {
            setState(data.user ? "loggedIn" : "loggedOut");
          }
        })
        .catch(() => {
          if (!cancelled) {
            setState("loggedOut");
          }
        });
    } catch {
      // 同期的なsetStateはeffect内では避ける(react-hooks/set-state-in-effect)ため、マイクロタスクへずらす
      queueMicrotask(() => {
        if (!cancelled) {
          setState("loggedOut");
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, []);

  if (state !== "loggedOut") {
    return null;
  }

  return (
    <div className="rounded-2xl border border-sakura-border bg-sakura-soft px-5 py-6 text-center">
      <p className="text-[15px] font-black text-ink">ログインしてクラウド保存</p>
      <p className="mt-2 text-[13px] leading-[1.9] text-ink-sub">
        ログインすると、しおりが自動でクラウドに保存され、機種変更や別の端末からも見られるようになります。
      </p>
      <Link
        href="/settings"
        className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-btn bg-sakura text-[15px] font-bold text-white"
      >
        ログインする
      </Link>
    </div>
  );
}
