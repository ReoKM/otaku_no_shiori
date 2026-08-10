"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabasePublicEnv } from "./env";

/**
 * ブラウザ(Client Component)用のSupabaseクライアント。
 *
 * anonキーのみを使い、アクセス制御はDB側のRLSに任せる。
 * ログインセッションはCookieに保存され、`src/lib/supabase/server.ts`の
 * サーバー用クライアントと同じセッションを共有する(F8のOAuth用)。
 *
 * 使用例:
 * ```tsx
 * "use client";
 * import { getSupabaseBrowserClient } from "@/lib/supabase/client";
 *
 * const supabase = getSupabaseBrowserClient();
 * const { data } = await supabase.from("spots").select("id, name");
 * ```
 */
let browserClient: SupabaseClient | undefined;

/**
 * ブラウザ用クライアントを返す。
 *
 * 1タブにつき1インスタンスを使い回す(セッション監視の多重登録と
 * 再レンダリングごとの生成を避けるため)。
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    const { url, anonKey } = getSupabasePublicEnv();
    browserClient = createBrowserClient(url, anonKey);
  }
  return browserClient;
}
