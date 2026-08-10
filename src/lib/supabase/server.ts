import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabasePublicEnv } from "./env";

/**
 * サーバー(Server Component / Route Handler / Server Action)用のSupabaseクライアント。
 *
 * anonキー + Cookieのセッションで動く。つまり「ログイン中のユーザー本人」として
 * クエリが実行され、RLSがそのまま効く。RLSを回避したい管理者操作は
 * `src/lib/supabase/admin.ts` を使う(用途は限定すること)。
 *
 * リクエストごとにCookieが違うためインスタンスはキャッシュせず、毎回生成する。
 *
 * 使用例:
 * ```ts
 * // src/app/api/shiori/route.ts
 * import { createSupabaseServerClient } from "@/lib/supabase/server";
 *
 * export async function GET() {
 *   const supabase = await createSupabaseServerClient();
 *   const { data } = await supabase.from("shiori").select("id, title");
 *   return Response.json(data);
 * }
 * ```
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const { url, anonKey } = getSupabasePublicEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server ComponentからはCookieを書き換えられない(Next.jsの制約)。
          // セッション更新はmiddlewareかRoute Handler側で行うため、ここでは無視してよい。
        }
      },
    },
  });
}
