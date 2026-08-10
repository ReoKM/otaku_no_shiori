import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * `updateSupabaseSession` のテスト。
 * 実際のSupabaseへは接続せず、`@supabase/ssr`の`createServerClient`を
 * 差し替えて検証する(CIでSecretsを不要にするため。health.test.tsと同じ方針)。
 */

const { createServerClientMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: createServerClientMock,
}));

const { updateSupabaseSession } = await import("./middleware");

const ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

const originalEnv: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};

beforeEach(() => {
  for (const key of ENV_KEYS) {
    originalEnv[key] = process.env[key];
  }
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example-project.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-for-test";
  createServerClientMock.mockReset();
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = originalEnv[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

describe("updateSupabaseSession", () => {
  it("ログイン中でリフレッシュが起きた場合、新しいcookieをレスポンスに書き込む", async () => {
    createServerClientMock.mockImplementation((_url, _anonKey, options) => {
      return {
        auth: {
          getUser: async () => {
            // 期限切れトークンがリフレッシュされ、新しいcookieが発行された想定。
            options.cookies.setAll([
              {
                name: "sb-access-token",
                value: "refreshed-token",
                options: { path: "/" },
              },
            ]);
            return { data: { user: { id: "user-1" } }, error: null };
          },
        },
      };
    });

    const request = new NextRequest("https://app.example.com/shiori/new");
    request.cookies.set("sb-access-token", "old-token");

    const response = await updateSupabaseSession(request);

    expect(response.cookies.get("sb-access-token")?.value).toBe(
      "refreshed-token",
    );
  });

  it("未ログイン(ゲスト利用)ではcookieを書き換えず素通しする", async () => {
    createServerClientMock.mockImplementation(() => ({
      auth: {
        getUser: async () => {
          // cookieが無いためリフレッシュ対象が無く、setAllは呼ばれない。
          return {
            data: { user: null },
            error: { message: "Auth session missing!" },
          };
        },
      },
    }));

    const request = new NextRequest("https://app.example.com/shiori/new");

    const response = await updateSupabaseSession(request);

    expect(response.cookies.get("sb-access-token")).toBeUndefined();
    // 素通し(NextResponse.next相当)であることの確認。
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("環境変数が未設定でも例外を投げず素通しレスポンスを返す", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const request = new NextRequest("https://app.example.com/");

    const response = await updateSupabaseSession(request);

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(createServerClientMock).not.toHaveBeenCalled();
  });

  it("Supabase呼び出しが例外を投げても、握って素通しレスポンスを返す", async () => {
    createServerClientMock.mockImplementation(() => ({
      auth: {
        getUser: async () => {
          throw new Error("fetch failed");
        },
      },
    }));

    const request = new NextRequest("https://app.example.com/");

    await expect(updateSupabaseSession(request)).resolves.toBeDefined();
  });

  it("URL・anonキーを環境変数から渡してcreateServerClientを呼ぶ", async () => {
    createServerClientMock.mockImplementation(() => ({
      auth: { getUser: async () => ({ data: { user: null }, error: null }) },
    }));

    const request = new NextRequest("https://app.example.com/");
    await updateSupabaseSession(request);

    expect(createServerClientMock).toHaveBeenCalledWith(
      "https://example-project.supabase.co",
      "anon-key-for-test",
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      }),
    );
  });
});
