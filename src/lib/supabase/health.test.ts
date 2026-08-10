import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  HEALTH_CHECK_TABLE,
  checkSupabaseConnection,
  toHealthHint,
} from "./health";

/**
 * 疎通チェックの結果整形ロジックのテスト。
 * 実際のSupabaseへは接続せず、クライアントの応答を差し替えて検証する。
 */

type ProbeResponse = {
  count?: number | null;
  error?: { code?: string; message: string } | null;
};

/** `from(...).select(...)` が指定の応答を返すだけの偽クライアントを作る。 */
function fakeClient(response: ProbeResponse | (() => never)): SupabaseClient {
  return {
    from: () => ({
      select: () => {
        if (typeof response === "function") {
          return response();
        }
        return Promise.resolve({
          count: response.count ?? null,
          error: response.error ?? null,
        });
      },
    }),
  } as unknown as SupabaseClient;
}

describe("checkSupabaseConnection", () => {
  it("クエリが通れば ok:true と可視行数を返す", async () => {
    const result = await checkSupabaseConnection(fakeClient({ count: 3 }));

    expect(result).toEqual({
      ok: true,
      table: HEALTH_CHECK_TABLE,
      visibleRowCount: 3,
    });
  });

  it("行が0件でも疎通は成功と判定する", async () => {
    const result = await checkSupabaseConnection(fakeClient({ count: 0 }));

    expect(result.ok).toBe(true);
  });

  it("件数が取れなくても疎通は成功と判定する", async () => {
    const result = await checkSupabaseConnection(fakeClient({ count: null }));

    expect(result).toEqual({
      ok: true,
      table: HEALTH_CHECK_TABLE,
      visibleRowCount: null,
    });
  });

  it("PostgRESTエラーは code/message/hint に整形して返す", async () => {
    const result = await checkSupabaseConnection(
      fakeClient({
        error: { code: "PGRST205", message: "Could not find the table" },
      }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toEqual({
      code: "PGRST205",
      message: "Could not find the table",
    });
    expect(result.hint).toContain("0001_initial_schema.sql");
  });

  it("codeが無いエラーでも落ちずに ok:false を返す", async () => {
    const result = await checkSupabaseConnection(
      fakeClient({ error: { message: "unknown failure" } }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBeNull();
  });

  it("codeが空文字のエラーはnullに正規化する", async () => {
    const result = await checkSupabaseConnection(
      fakeClient({ error: { code: "", message: "TypeError: fetch failed" } }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBeNull();
  });

  it("例外(環境変数未設定・ネットワーク断)も握って ok:false を返す", async () => {
    const result = await checkSupabaseConnection(
      fakeClient(() => {
        throw new Error("fetch failed");
      }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toBe("fetch failed");
    expect(result.hint).toContain("NEXT_PUBLIC_SUPABASE_URL");
  });
});

describe("toHealthHint", () => {
  it("テーブル未作成はマイグレーション実行を案内する", () => {
    expect(toHealthHint("42P01", "relation does not exist")).toContain(
      "supabase/migrations/0001_initial_schema.sql",
    );
  });

  it("APIキー不正はanonキーの確認を案内する", () => {
    expect(toHealthHint(null, "Invalid API key")).toContain(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  });

  it("到達不能はURLとネットワークの確認を案内する", () => {
    expect(toHealthHint(null, "getaddrinfo ENOTFOUND example")).toContain(
      "NEXT_PUBLIC_SUPABASE_URL",
    );
  });

  it("該当しないエラーはREADMEへ誘導する", () => {
    expect(toHealthHint(null, "something else")).toContain("supabase/README.md");
  });
});
