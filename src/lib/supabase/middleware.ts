import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabasePublicEnv } from "./env";

/**
 * middleware.ts から呼ぶ、Supabaseセッションcookieの更新処理。
 *
 * `@supabase/ssr` 公式パターンに従う(Next.js App Router向け)。
 * ログイン中のユーザーはアクセストークンが期限切れに近いとリフレッシュされ、
 * 新しいcookieがレスポンスに書き込まれる。未ログイン(ゲスト利用)時は
 * cookieが存在しないため何もせず、素通しのレスポンスを返す。
 *
 * `supabase.auth.getUser()` を呼ぶ理由(`getSession()`ではない):
 * `getUser()` はSupabase Authサーバーにトークンを問い合わせて検証し直すため、
 * 期限切れトークンのリフレッシュが確実に走る。`getSession()`はcookieの中身を
 * 信じるだけで検証しないため、ここでは使わない(公式ドキュメント推奨)。
 *
 * 環境変数未設定など(`MissingSupabaseEnvError`含む)で失敗した場合は、
 * 例外を投げず素通しのレスポンスを返す。ゲスト利用者(未ログイン)まで
 * ミドルウェアの都合で巻き込んで全ルートを止めないため
 * (完了条件「未ログイン時の既存ルートが従来通り動作する」を満たす多層防御)。
 *
 * 使用例:
 * ```ts
 * // middleware.ts
 * import { updateSupabaseSession } from "@/lib/supabase/middleware";
 *
 * export async function middleware(request: NextRequest) {
 *   return await updateSupabaseSession(request);
 * }
 * ```
 */
export async function updateSupabaseSession(
  request: NextRequest,
): Promise<NextResponse> {
  // このレスポンスは`supabase`が発行したcookieの書き込み先として使う。
  // 差し替えたら書き込んだcookieが消えるため、最後は必ずこのインスタンスを返す。
  let response = NextResponse.next({ request });

  try {
    const { url, anonKey } = getSupabasePublicEnv();

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // リクエスト側にも反映しないと、同じミドルウェア実行内で後段が
          // 古いcookieを読んでしまう(公式パターン通り)。
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });

    // createServerClientとgetUser()の間に他の処理を挟まない。
    // 挟むとリフレッシュ漏れでユーザーが不可解にログアウトされる不具合の
    // 原因になりやすい(公式ドキュメントの注意事項)。
    await supabase.auth.getUser();
  } catch {
    // 環境変数未設定・Supabase側の一時的な障害などはここに来る。
    // 秘密情報を含む可能性があるためログには詳細を出さず、素通しにとどめる。
    return NextResponse.next({ request });
  }

  return response;
}
