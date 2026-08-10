import type { NextRequest } from "next/server";

import { updateSupabaseSession } from "@/lib/supabase/middleware";

/**
 * 全リクエストで走るミドルウェア。
 *
 * 目的はSupabaseセッションcookieの自動リフレッシュのみ(F8)。
 * ルーティングの制御(リダイレクト・認証必須化)はここでは行わない
 * (MVPの認証必須画面はまだ無いため。docs/01_service_spec.md 参照)。
 *
 * 実処理は `src/lib/supabase/middleware.ts` の `updateSupabaseSession` に委譲する
 * (テストしやすくするため。ここは薄いエントリーポイントに留める)。
 */
export async function middleware(request: NextRequest) {
  return await updateSupabaseSession(request);
}

export const config = {
  matcher: [
    /*
     * 次を除く全パスにマッチする:
     * - _next/static, _next/image(Next.jsの内部アセット)
     * - favicon.ico, sw.js, manifest.webmanifest(public/直下の静的ファイル)
     * - 画像拡張子で終わるパス
     * これらはSupabaseセッションと無関係で、毎回cookie読み書き処理を
     * 挟むとPWAのService Worker(F10)キャッシュ判定にも無駄な負荷になる。
     */
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
