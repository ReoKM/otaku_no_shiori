import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabasePublicEnv, getSupabaseServiceRoleKey } from "./env";

/**
 * service_roleキーを使う管理者用クライアント。**サーバー専用**。
 *
 * このクライアントはRLSを無視して全行を読み書きできる。
 * したがって次のルールを守ること:
 *
 * 1. Client Component・`"use client"`が付いたファイルからimportしない
 * 2. 「ログイン中のユーザーとしての操作」には使わない(`server.ts`を使う)
 * 3. 使う場合はRoute Handler内で、対象ユーザーのIDをサーバー側で確定させてから使う
 *
 * 想定用途はゲスト→ログインのデータ移行(F8)のような、
 * RLS越しでは書けない一括INSERTに限る。
 */
let adminClient: SupabaseClient | undefined;

/**
 * 管理者用クライアントを返す。
 *
 * ブラウザから呼ばれた場合は`getSupabaseServiceRoleKey()`が例外を投げる。
 * セッションを持たないクライアントとして生成する(トークンの自動更新・
 * セッション永続化を切り、サーバー間通信専用にする)。
 */
export function getSupabaseAdminClient(): SupabaseClient {
  if (!adminClient) {
    const { url } = getSupabasePublicEnv();
    const serviceRoleKey = getSupabaseServiceRoleKey();
    adminClient = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return adminClient;
}
