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

const ORIGIN = "https://example.com";

describe("isSafeRedirectPath", () => {
  it("自サイト内の相対パスは許可する", () => {
    expect(isSafeRedirectPath("/", ORIGIN)).toBe(true);
    expect(isSafeRedirectPath("/shiori/abc123", ORIGIN)).toBe(true);
  });

  it("絶対URLは拒否する", () => {
    expect(isSafeRedirectPath("https://evil.example/", ORIGIN)).toBe(false);
    expect(isSafeRedirectPath("http://evil.example/", ORIGIN)).toBe(false);
  });

  it("プロトコル相対URL(//)は拒否する", () => {
    expect(isSafeRedirectPath("//evil.example/", ORIGIN)).toBe(false);
  });

  it("自サイト内のパスなら、クエリ値にスキームらしき文字列が含まれても許可する(originが自サイトのままのため)", () => {
    // 例: /redirect?to=javascript://evil はブラウザを example.com から動かさない。
    // 危険なのは「解決後のoriginが変わること」であり、クエリ文字列の中身ではない。
    expect(
      isSafeRedirectPath("/redirect?to=javascript://evil", ORIGIN),
    ).toBe(true);
  });

  it("バックスラッシュ経由のオープンリダイレクトは拒否する", () => {
    // WHATWG URL仕様では特別スキーム(http/https)においてバックスラッシュが
    // スラッシュと同等に扱われるため、`new URL("/\\evil.example", origin)` は
    // `https://evil.example/` に解決される。文字列チェック(`//`・`://`)だけでは
    // 検知できないため、origin比較で根本的に拒否できることを確認する。
    expect(isSafeRedirectPath("/\\evil.example", ORIGIN)).toBe(false);
    expect(isSafeRedirectPath("/\\\\evil.example", ORIGIN)).toBe(false);
    expect(isSafeRedirectPath("/\\/evil.example", ORIGIN)).toBe(false);
  });

  it("先頭がスラッシュでない値は拒否する", () => {
    expect(isSafeRedirectPath("evil.example", ORIGIN)).toBe(false);
  });

  it("空文字は拒否する", () => {
    expect(isSafeRedirectPath("", ORIGIN)).toBe(false);
  });

  it("異常に長い値は拒否する", () => {
    expect(isSafeRedirectPath("/" + "a".repeat(1000), ORIGIN)).toBe(false);
  });
});

describe("resolveRedirectPath", () => {
  it("未指定ならデフォルト(ホーム)にフォールバックする", () => {
    expect(resolveRedirectPath(null, ORIGIN)).toBe(DEFAULT_REDIRECT_PATH);
  });

  it("安全な相対パスはそのまま使う", () => {
    expect(resolveRedirectPath("/shiori/abc", ORIGIN)).toBe("/shiori/abc");
  });

  it("外部URLはデフォルトにフォールバックする(オープンリダイレクト対策)", () => {
    expect(resolveRedirectPath("https://evil.example/", ORIGIN)).toBe(
      DEFAULT_REDIRECT_PATH,
    );
    expect(resolveRedirectPath("//evil.example/", ORIGIN)).toBe(
      DEFAULT_REDIRECT_PATH,
    );
  });

  it("バックスラッシュ経由の外部URLもデフォルトにフォールバックする", () => {
    expect(resolveRedirectPath("/\\evil.example", ORIGIN)).toBe(
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
