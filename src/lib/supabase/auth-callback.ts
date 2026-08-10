import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * `/auth/callback`(F8: X/Google OAuth)の判定ロジック。
 *
 * ルートハンドラ本体(`src/app/auth/callback/route.ts`)を薄く保つため、
 * 「リダイレクト先の決定」「コード交換」をここに切り出してユニットテスト可能にする。
 * 実プロバイダへの接続はテストせず、Supabaseクライアントの応答を差し替えて検証する
 * (`src/lib/supabase/health.ts` と同じ方針)。
 */

/** リダイレクト先パスとして許可する最大長。極端に長い値でのDoS・ログ汚染を避ける。 */
const MAX_NEXT_PATH_LENGTH = 512;

/** ログイン成功時のデフォルト遷移先。S6(設定/アカウント)は未実装のためS1(ホーム)にする。 */
export const DEFAULT_REDIRECT_PATH = "/";

/**
 * `next`クエリパラメータが「自サイト内の相対パス」として安全かを判定する。
 *
 * 個別パターン(`//`・`://`・バックスラッシュ等)を後追いでブロックする方式は
 * 新しいバイパス手法に弱いため採用しない。代わりに、実際にリダイレクトへ使う
 * `new URL(path, origin)` を判定側でも同じように解決し、結果の`origin`が
 * 期待どおり自サイトのままかで判定する(WHATWG URL仕様に沿った根本対策)。
 *
 * 例えば `/\evil.example` はいずれの文字列チェックもすり抜けるが、
 * 特別スキーム(http/https)ではバックスラッシュがスラッシュとして扱われるため
 * `new URL("/\\evil.example", "https://good.example")` は
 * `https://evil.example/` に解決される。この関数はその解決後の`origin`を見て拒否する。
 *
 * 拒否する例:
 * - `https://evil.example/` (絶対URL)
 * - `//evil.example/`(プロトコル相対URL。ブラウザは外部サイトとして扱う)
 * - `/\evil.example`(バックスラッシュ経由。`new URL`解決後に外部originになる)
 * - `/x`.repeat(1000)(異常に長い値)
 *
 * 許可する例: `/`, `/shiori/abc123`
 */
export function isSafeRedirectPath(path: string, origin: string): boolean {
  if (path.length === 0 || path.length > MAX_NEXT_PATH_LENGTH) {
    return false;
  }
  if (!path.startsWith("/")) {
    return false;
  }

  let resolved: URL;
  try {
    resolved = new URL(path, origin);
  } catch {
    return false;
  }

  return resolved.origin === new URL(origin).origin;
}

/**
 * `next`クエリパラメータからリダイレクト先パスを決める。
 *
 * 未指定・不正な値(外部URLなど)は必ず`DEFAULT_REDIRECT_PATH`にフォールバックする
 * (オープンリダイレクト対策)。
 *
 * 例: `resolveRedirectPath("/shiori/abc", "https://example.com")` → `"/shiori/abc"`
 * 例: `resolveRedirectPath("https://evil.example", "https://example.com")` → `"/"`
 * 例: `resolveRedirectPath(null, "https://example.com")` → `"/"`
 */
export function resolveRedirectPath(
  nextParam: string | null,
  origin: string,
): string {
  if (!nextParam) {
    return DEFAULT_REDIRECT_PATH;
  }
  return isSafeRedirectPath(nextParam, origin)
    ? nextParam
    : DEFAULT_REDIRECT_PATH;
}

/** `/auth/callback`が失敗しうる理由。フロント側でユーザー向けメッセージを出し分けるためのコード。 */
export type AuthCallbackErrorReason =
  /** OAuthプロバイダ側が`error`パラメータを付けて返した(ユーザーが同意しなかった等)。 */
  | "provider_denied"
  /** `code`パラメータが無い(直リンク・二重アクセスなど想定外の遷移)。 */
  | "missing_code"
  /** `exchangeCodeForSession`がエラーを返した、または例外を投げた。 */
  | "exchange_failed";

/**
 * 成功時にリダイレクトするURLを組み立てる。
 *
 * 例: `buildRedirectUrl("https://example.com", "/")` → `https://example.com/`
 */
export function buildRedirectUrl(origin: string, path: string): URL {
  return new URL(path, origin);
}

/**
 * 失敗時にリダイレクトするURLを組み立てる。
 *
 * リダイレクト先パスに`authError=<reason>`を付与する。フロント(S1/S6)側は
 * このパラメータを見てエラーメッセージを表示できる。プロバイダの生のエラー文言は
 * URLに含めない(オープンリダイレクト・反射的な文字列混入を避けるため、固定の理由コードのみ使う)。
 *
 * 例: `buildAuthErrorRedirectUrl("https://example.com", "/", "missing_code")`
 *   → `https://example.com/?authError=missing_code`
 */
export function buildAuthErrorRedirectUrl(
  origin: string,
  path: string,
  reason: AuthCallbackErrorReason,
): URL {
  const url = new URL(path, origin);
  url.searchParams.set("authError", reason);
  return url;
}

/** `exchangeAuthCode`の結果。 */
export type ExchangeAuthCodeResult =
  | { ok: true }
  | { ok: false; reason: "exchange_failed"; message: string };

/**
 * OAuth認可コードをSupabaseのセッションに交換する。
 *
 * 例外は投げず、必ず`ExchangeAuthCodeResult`を返す(呼び出し側で分岐しやすくするため)。
 * 成功時、Supabaseクライアントがセッションをcookieへ書き込む
 * (`src/lib/supabase/server.ts`の`setAll`経由)。
 *
 * 使用例:
 * ```ts
 * const result = await exchangeAuthCode(supabase, code);
 * if (!result.ok) redirectToError(result.reason);
 * ```
 */
export async function exchangeAuthCode(
  supabase: SupabaseClient,
  code: string,
): Promise<ExchangeAuthCodeResult> {
  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return { ok: false, reason: "exchange_failed", message: error.message };
    }
    return { ok: true };
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    return { ok: false, reason: "exchange_failed", message };
  }
}
