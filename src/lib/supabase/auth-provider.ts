import type { User } from "@supabase/supabase-js";

import type { OAuthProvider } from "./oauth-login";

/**
 * S6ログイン済み状態(`LoggedInSection`)向けの、ログイン中プロバイダの判定・表示ロジック。
 * 参照: docs/design/screens/S6_設定アカウント.md「LoggedInSection」1. AccountStatusRow
 *
 * `signInWithProvider`（`oauth-login.ts`）が受け付けるプロバイダはX(`twitter`)とGoogleの
 * 2つのみ（本サービスのOAuthはこの2つだけ。`docs/01_service_spec.md` F8参照）なので、
 * `User.app_metadata.provider`がそれ以外の値だった場合はプロバイダ不明として`null`を返す
 * （呼び出し側は`null`のとき見出し行だけ表示しプロバイダ文言を省略する想定）。
 */

/**
 * Supabaseの`User`からログイン中プロバイダを判定する。
 *
 * 例:
 * ```ts
 * resolveOAuthProvider({ app_metadata: { provider: "google" } }) // → "google"
 * resolveOAuthProvider({ app_metadata: { provider: "email" } })  // → null(未対応プロバイダ)
 * resolveOAuthProvider(null)                                     // → null(未ログイン)
 * ```
 */
export function resolveOAuthProvider(user: Pick<User, "app_metadata"> | null | undefined): OAuthProvider | null {
  const provider = user?.app_metadata?.provider;
  if (provider === "twitter" || provider === "google") {
    return provider;
  }
  return null;
}

/** 文言一覧「ログイン中プロバイダ(X)」「ログイン中プロバイダ(Google)」。 */
export function getProviderLoginLabel(provider: OAuthProvider): string {
  return provider === "twitter" ? "Xでログイン中" : "Googleでログイン中";
}
