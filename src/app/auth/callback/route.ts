import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildAuthErrorRedirectUrl,
  buildRedirectUrl,
  exchangeAuthCode,
  resolveRedirectPath,
} from "@/lib/supabase/auth-callback";

/**
 * OAuthコールバックルート(GET /auth/callback)。F8。
 *
 * X/Google OAuthの同意後、SupabaseがこのURLへ`code`パラメータ付きでリダイレクトする。
 * `code`をセッションに交換し(`exchangeCodeForSession`)、cookieにセッションを書き込んでから
 * アプリ側の画面へリダイレクトする。
 *
 * 対応するクエリパラメータ:
 * - `code`(必須): OAuth認可コード。無ければ`missing_code`としてエラー扱い
 * - `error`(任意): プロバイダ側が同意拒否などで返すエラーコード。あれば`provider_denied`としてエラー扱い
 * - `next`(任意): 成功時の遷移先パス。自サイト内の相対パスのみ許可(オープンリダイレクト対策)。
 *   省略・不正な値はホーム(`/`)にフォールバックする
 *
 * 失敗時はリダイレクト先に`authError=<理由コード>`を付与する。理由コードはプロバイダの生の
 * エラー文言を含まない固定値のみ(`src/lib/supabase/auth-callback.ts`の`AuthCallbackErrorReason`)。
 *
 * 成功例: `/auth/callback?code=xxxx` → `302 Location: /`
 * 失敗例: `/auth/callback?error=access_denied` → `302 Location: /?authError=provider_denied`
 *
 * 実プロバイダ(X/Google)での実際のログイン成功確認は、この環境では実施できない
 * (ブラウザでの対話的なOAuth同意操作が必要なため)。Netlifyプレビューデプロイ上で
 * QA/オーナーが手動確認する。
 */

// Cookieを書き換えるため、キャッシュせず毎回実行する。
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const providerError = url.searchParams.get("error");
  const redirectPath = resolveRedirectPath(
    url.searchParams.get("next"),
    url.origin,
  );

  if (providerError) {
    return Response.redirect(
      buildAuthErrorRedirectUrl(url.origin, redirectPath, "provider_denied"),
      302,
    );
  }

  if (!code) {
    return Response.redirect(
      buildAuthErrorRedirectUrl(url.origin, redirectPath, "missing_code"),
      302,
    );
  }

  const supabase = await createSupabaseServerClient();
  const result = await exchangeAuthCode(supabase, code);

  if (!result.ok) {
    return Response.redirect(
      buildAuthErrorRedirectUrl(url.origin, redirectPath, result.reason),
      302,
    );
  }

  return Response.redirect(buildRedirectUrl(url.origin, redirectPath), 302);
}
