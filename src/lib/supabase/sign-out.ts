import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * S6ログアウトボタン(`LogoutButton`)が呼び出すログアウト処理。
 * 参照: docs/design/screens/S6_設定アカウント.md「LoggedInSection」3. LogoutButton
 * 「タップ時の挙動」ログアウトボタンの行
 *
 * `oauth-login.ts`の`signInWithProvider`と同じ方針で、Supabaseクライアントへの実際の
 * 呼び出しをUIコンポーネントから切り離し、ユニットテスト可能にする
 * （実クライアントへは接続せず、応答を差し替えて検証する）。
 *
 * 確認ダイアログは出さない（仕様どおり。呼び出し元のボタンで`window.confirm`は使わない）。
 * ログアウト完了後の画面遷移（`LoggedOutSection`表示に戻る）は、この関数の責務ではなく、
 * 呼び出し元が`supabase.auth.onAuthStateChange`を購読して行う
 * （`src/components/settings/SettingsRoute.tsx`）。
 */

/** `signOut`の結果。 */
export type SignOutResult = { ok: true } | { ok: false; message: string };

/**
 * 使用例:
 * ```ts
 * const supabase = getSupabaseBrowserClient();
 * const result = await signOut(supabase);
 * if (!result.ok) { / * 仕様上、失敗時のエラー表示は定義されていない * / }
 * ```
 */
export async function signOut(supabase: SupabaseClient): Promise<SignOutResult> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { ok: false, message: error.message };
    }
    return { ok: true };
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    return { ok: false, message };
  }
}
