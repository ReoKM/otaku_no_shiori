/**
 * S6(設定/アカウント、`/settings`)でOAuthログイン完了後にトップページ(S1)へ
 * 自動遷移すべきかどうかの判定ロジック。
 *
 * オーナー報告: 「ログイン→Google認証→ログイン完了画面→戻る」をすると、ブラウザの
 * 戻る操作がGoogle側の履歴(アカウント選択画面)を辿ってしまい、再度アカウント選択画面が
 * 表示される不具合がある。あるべき姿は「ログイン完了後、トップページへ自動遷移」であり、
 * 戻る操作そのものを不要にすることで解消する。
 *
 * `src/components/settings/SettingsRoute.tsx`から呼び出す。判定ロジックをUIコンポーネントから
 * 切り離し、ユニットテスト可能にする(`src/lib/supabase/auth-callback.ts`と同じ方針)。
 */

/** `SettingsRoute`が管理するログイン状態。`supabase.auth.getUser()`の判定結果に対応する。 */
export type SettingsAuthStatus = "loading" | "loggedOut" | "loggedIn";

/**
 * トップページへの自動遷移を行うべきかを判定する。
 *
 * `justLoggedIn`は`/auth/callback`からの復帰時のみ`true`になる印
 * (`src/lib/supabase/oauth-login.ts`の`justLoggedIn=1`クエリパラメータ)。
 * これが無い場合(既にログイン済みの状態で`/settings`を手動で開いた場合など)は、
 * アカウント確認・ログアウト目的のアクセスを妨げないよう自動遷移させない。
 *
 * 例: `shouldAutoRedirectToHome(true, "loggedIn")` → `true`
 * 例: `shouldAutoRedirectToHome(false, "loggedIn")` → `false`(手動で`/settings`を開いた)
 * 例: `shouldAutoRedirectToHome(true, "loading")` → `false`(ログイン状態の判定が確定する前)
 * 例: `shouldAutoRedirectToHome(true, "loggedOut")` → `false`(ログイン失敗)
 */
export function shouldAutoRedirectToHome(
  justLoggedIn: boolean,
  authStatus: SettingsAuthStatus,
): boolean {
  return justLoggedIn && authStatus === "loggedIn";
}
