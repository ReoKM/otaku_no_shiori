import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * S6(設定/アカウント)のX/Googleログインボタンが呼び出すOAuthログイン処理。
 * 参照: docs/design/screens/S6_設定アカウント.md「タップ時の挙動」
 *
 * `src/lib/supabase/auth-callback.ts`と同じ方針で、Supabaseクライアントへの実際の
 * 呼び出しをUIコンポーネントから切り離し、ユニットテスト可能にする
 * (実プロバイダへは接続せず、クライアントの応答を差し替えて検証する)。
 */

/**
 * Supabase Auth側のプロバイダ識別子。
 *
 * X(旧Twitter)はSupabase Auth上のプロバイダIDが今も`twitter`のため、UI表示は「X」でも
 * `signInWithOAuth`へ渡す値は`twitter`にする(Supabase公式ドキュメントの表記に合わせる。
 * Issue #91でオーナーが設定したOAuthプロバイダも同じIDで登録済み)。
 */
export type OAuthProvider = "twitter" | "google";

const OAUTH_CALLBACK_PATH = "/auth/callback";

/**
 * OAuthコールバック成功・失敗のどちらでも戻す先。
 *
 * S6の`LoginErrorNotice`(ログイン失敗時の表示)は「コールバックからエラーで復帰した場合」を
 * 前提にしている(docs/design/screens/S6_設定アカウント.md「状態」表)。`next`クエリパラメータは
 * `src/app/auth/callback/route.ts`が既に対応しているため、ここではS6自身のパスを固定値で渡す。
 */
const RETURN_TO_SETTINGS_PATH = "/settings";

/**
 * `signInWithOAuth`に渡す`redirectTo`を組み立てる。
 *
 * 常に呼び出し時点の自オリジン(`origin`引数)と固定パスから`new URL`で組み立てるため、
 * 外部ドメインを渡す余地は無い(`src/lib/supabase/auth-callback.ts`のオープンリダイレクト対策と
 * 同じ考え方。ユーザー入力は一切介在しない)。
 *
 * 例: `buildOAuthRedirectTo("https://example.com")`
 *   → `"https://example.com/auth/callback?next=%2Fsettings"`
 */
export function buildOAuthRedirectTo(origin: string): string {
  const url = new URL(OAUTH_CALLBACK_PATH, origin);
  url.searchParams.set("next", RETURN_TO_SETTINGS_PATH);
  return url.toString();
}

/** `signInWithProvider`の結果。 */
export type SignInWithProviderResult = { ok: true } | { ok: false; message: string };

/**
 * 指定プロバイダでOAuthログインを開始する。
 *
 * 成功時はブラウザがプロバイダの同意画面(外部サイト)へ遷移するため、この関数のPromiseが
 * 解決した後にアプリ側で追加の遷移処理をする必要は無い(失敗時のみUIへ反映する)。
 * 例外は投げず、必ず`SignInWithProviderResult`を返す(`exchangeAuthCode`と同じ方針)。
 *
 * 使用例:
 * ```ts
 * const supabase = getSupabaseBrowserClient();
 * const result = await signInWithProvider(supabase, "twitter", window.location.origin);
 * if (!result.ok) showLoginError();
 * ```
 */
export async function signInWithProvider(
  supabase: SupabaseClient,
  provider: OAuthProvider,
  origin: string,
): Promise<SignInWithProviderResult> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: buildOAuthRedirectTo(origin) },
    });
    if (error) {
      return { ok: false, message: error.message };
    }
    return { ok: true };
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    return { ok: false, message };
  }
}
