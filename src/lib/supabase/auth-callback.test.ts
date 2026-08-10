import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  DEFAULT_REDIRECT_PATH,
  buildAuthErrorRedirectUrl,
  buildRedirectUrl,
  exchangeAuthCode,
  isSafeRedirectPath,
  resolveRedirectPath,
} from "./auth-callback";

/**
 * `/auth/callback`の判定ロジックのテスト。
 * 実際のSupabase/OAuthプロバイダへは接続せず、クライアントの応答を差し替えて検証する。
 */

type ExchangeResponse =
  | { error?: { message: string } | null }
  | (() => never);

/** `auth.exchangeCodeForSession(...)` が指定の応答を返すだけの偽クライアントを作る。 */
function fakeClient(response: ExchangeResponse): SupabaseClient {
  return {
    auth: {
      exchangeCodeForSession: () => {
        if (typeof response === "function") {
          return response();
        }
        return Promise.resolve({ error: response.error ?? null });
      },
    },
  } as unknown as SupabaseClient;
}

describe("isSafeRedirectPath", () => {
  it("自サイト内の相対パスは許可する", () => {
    expect(isSafeRedirectPath("/")).toBe(true);
    expect(isSafeRedirectPath("/shiori/abc123")).toBe(true);
  });

  it("絶対URLは拒否する", () => {
    expect(isSafeRedirectPath("https://evil.example/")).toBe(false);
    expect(isSafeRedirectPath("http://evil.example/")).toBe(false);
  });

  it("プロトコル相対URL(//)は拒否する", () => {
    expect(isSafeRedirectPath("//evil.example/")).toBe(false);
  });

  it("スキームを含む値は拒否する", () => {
    expect(isSafeRedirectPath("/redirect?to=javascript://evil")).toBe(false);
  });

  it("先頭がスラッシュでない値は拒否する", () => {
    expect(isSafeRedirectPath("evil.example")).toBe(false);
  });

  it("空文字は拒否する", () => {
    expect(isSafeRedirectPath("")).toBe(false);
  });

  it("異常に長い値は拒否する", () => {
    expect(isSafeRedirectPath("/" + "a".repeat(1000))).toBe(false);
  });
});

describe("resolveRedirectPath", () => {
  it("未指定ならデフォルト(ホーム)にフォールバックする", () => {
    expect(resolveRedirectPath(null)).toBe(DEFAULT_REDIRECT_PATH);
  });

  it("安全な相対パスはそのまま使う", () => {
    expect(resolveRedirectPath("/shiori/abc")).toBe("/shiori/abc");
  });

  it("外部URLはデフォルトにフォールバックする(オープンリダイレクト対策)", () => {
    expect(resolveRedirectPath("https://evil.example/")).toBe(
      DEFAULT_REDIRECT_PATH,
    );
    expect(resolveRedirectPath("//evil.example/")).toBe(
      DEFAULT_REDIRECT_PATH,
    );
  });
});

describe("buildRedirectUrl / buildAuthErrorRedirectUrl", () => {
  it("成功時はoriginとパスを連結したURLを返す", () => {
    const url = buildRedirectUrl("https://example.com", "/");
    expect(url.toString()).toBe("https://example.com/");
  });

  it("失敗時はauthErrorパラメータを付与する", () => {
    const url = buildAuthErrorRedirectUrl(
      "https://example.com",
      "/",
      "missing_code",
    );
    expect(url.pathname).toBe("/");
    expect(url.searchParams.get("authError")).toBe("missing_code");
  });

  it("nextで指定した遷移先にもauthErrorを付与する", () => {
    const url = buildAuthErrorRedirectUrl(
      "https://example.com",
      "/shiori/abc",
      "exchange_failed",
    );
    expect(url.pathname).toBe("/shiori/abc");
    expect(url.searchParams.get("authError")).toBe("exchange_failed");
  });
});

describe("exchangeAuthCode", () => {
  it("成功時はok:trueを返す", async () => {
    const result = await exchangeAuthCode(fakeClient({ error: null }), "code-123");
    expect(result).toEqual({ ok: true });
  });

  it("Supabaseがエラーを返したらok:falseとメッセージを返す", async () => {
    const result = await exchangeAuthCode(
      fakeClient({ error: { message: "invalid grant" } }),
      "code-123",
    );
    expect(result).toEqual({
      ok: false,
      reason: "exchange_failed",
      message: "invalid grant",
    });
  });

  it("例外(ネットワーク断など)も握ってok:falseを返す", async () => {
    const result = await exchangeAuthCode(
      fakeClient(() => {
        throw new Error("fetch failed");
      }),
      "code-123",
    );
    expect(result).toEqual({
      ok: false,
      reason: "exchange_failed",
      message: "fetch failed",
    });
  });
});
