"use client";

import { useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/supabase/sign-out";

/**
 * S6ログアウトボタン。
 * 参照: docs/design/screens/S6_設定アカウント.md「LoggedInSection」3. LogoutButton、「タップ時の挙動」
 *
 * 確認ダイアログは出さない(仕様どおり。`window.confirm`は使わない既存方針)。
 * 完了後の`LoggedOutSection`表示への切り替えは、呼び出し元(`SettingsRoute`)が
 * `supabase.auth.onAuthStateChange`を購読して行うため、このボタン自身は遷移処理を持たない。
 *
 * ログアウト失敗時のエラー表示は仕様に記載が無いため実装しない(仮置き。完了報告に記載)。
 * ローディング状態だけは失敗時も解除し、再度ボタンを押せる状態に戻す。
 */
export function LogoutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout() {
    setIsSigningOut(true);
    try {
      await signOut(getSupabaseBrowserClient());
    } catch {
      // 環境変数未設定等でクライアント生成自体が失敗した場合も、ボタンの操作性は維持する
      // (仕様どおりエラー表示は行わない。`finally`でのローディング解除のみ)。
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isSigningOut}
      aria-busy={isSigningOut}
      className="min-h-12 w-full rounded-btn border border-paper-border bg-paper-surface text-[15px] font-bold text-ink-strong disabled:opacity-50"
    >
      {isSigningOut ? "ログアウトしています…" : "ログアウト"}
    </button>
  );
}
