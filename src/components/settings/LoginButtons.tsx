"use client";

import type { ReactNode } from "react";

import { GoogleLogoIcon, XLogoIcon } from "./icons";
import { OFFLINE_NOTICE_TEXT } from "./OfflineNotice";

/**
 * S6ログインボタン(X / Google)。
 * 参照: docs/design/screens/S6_設定アカウント.md「LoggedOutSection」2. LoginButtonX / LoginButtonGoogle
 *
 * 共通レイアウト・状態遷移を`OAuthLoginButtonBody`にまとめ、`LoginButtonX`/`LoginButtonGoogle`は
 * 見た目(アイコン・文言)だけを差し替える薄いラッパーにする(仕様のコンポーネント構造に合わせて
 * 2つの名前をエクスポートする)。
 */
export type LoginButtonProps = {
  /** このボタンがOAuth起動中か(「◯◯に移動しています…」+スピナー表示にする)。 */
  isLoading: boolean;
  /** もう一方のボタンが処理中のため、このボタンを無効化するか(二重タップ防止)。 */
  isDisabled: boolean;
  /** タップ時にオフラインだった場合、ボタン直下に注意文言を出すか。 */
  showOfflineMessage: boolean;
  onPress: () => void;
};

type OAuthLoginButtonBodyProps = LoginButtonProps & {
  icon: ReactNode;
  idleLabel: string;
  loadingLabel: string;
};

function LoadingSpinner() {
  return (
    <svg className="h-6 w-6 shrink-0 animate-spin text-ink" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function OAuthLoginButtonBody({
  icon,
  idleLabel,
  loadingLabel,
  isLoading,
  isDisabled,
  showOfflineMessage,
  onPress,
}: OAuthLoginButtonBodyProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={onPress}
        disabled={isDisabled || isLoading}
        aria-busy={isLoading}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-btn border-[1.5px] border-paper-border bg-paper-surface px-4 text-[15px] font-bold text-ink disabled:opacity-50"
      >
        {isLoading ? <LoadingSpinner /> : icon}
        <span>{isLoading ? loadingLabel : idleLabel}</span>
      </button>
      {showOfflineMessage && <p className="px-0.5 text-xs text-ink-muted">{OFFLINE_NOTICE_TEXT}</p>}
    </div>
  );
}

export function LoginButtonX(props: LoginButtonProps) {
  return (
    <OAuthLoginButtonBody
      {...props}
      icon={<XLogoIcon className="h-6 w-6 shrink-0 text-ink" />}
      idleLabel="Xでログイン"
      loadingLabel="Xに移動しています…"
    />
  );
}

export function LoginButtonGoogle(props: LoginButtonProps) {
  return (
    <OAuthLoginButtonBody
      {...props}
      icon={<GoogleLogoIcon className="h-6 w-6 shrink-0" />}
      idleLabel="Googleでログイン"
      loadingLabel="Googleに移動しています…"
    />
  );
}
