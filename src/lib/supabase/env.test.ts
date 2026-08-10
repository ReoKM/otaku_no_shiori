import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  MissingSupabaseEnvError,
  getSupabasePublicEnv,
  getSupabaseServiceRoleKey,
} from "./env";

/**
 * 環境変数の検証ロジックのテスト。
 * 実際のSupabaseへは接続しない(CIでSecretsを不要にするため)。
 */

const TARGET_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const originalEnv: Partial<Record<(typeof TARGET_KEYS)[number], string | undefined>> = {};

beforeEach(() => {
  for (const key of TARGET_KEYS) {
    originalEnv[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of TARGET_KEYS) {
    const value = originalEnv[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

describe("getSupabasePublicEnv", () => {
  it("URLとanonキーが揃っていれば両方を返す", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "sb_publishable_test";

    expect(getSupabasePublicEnv()).toEqual({
      url: "https://example.supabase.co",
      anonKey: "sb_publishable_test",
    });
  });

  it("前後の空白を取り除く(.env.localの書き方ゆれを吸収する)", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "  https://example.supabase.co  ";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = " sb_publishable_test ";

    expect(getSupabasePublicEnv().url).toBe("https://example.supabase.co");
    expect(getSupabasePublicEnv().anonKey).toBe("sb_publishable_test");
  });

  it("URLが未設定なら変数名付きの例外を投げる", () => {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "sb_publishable_test";

    expect(() => getSupabasePublicEnv()).toThrow(MissingSupabaseEnvError);
    expect(() => getSupabasePublicEnv()).toThrow("NEXT_PUBLIC_SUPABASE_URL");
  });

  it("anonキーが空白のみなら未設定として扱う", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "   ";

    expect(() => getSupabasePublicEnv()).toThrow("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  });

  it("例外メッセージに鍵の値そのものを含めない", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";

    try {
      getSupabasePublicEnv();
      expect.unreachable("例外が投げられるはず");
    } catch (error) {
      expect((error as Error).message).not.toContain("https://example.supabase.co");
    }
  });
});

describe("getSupabaseServiceRoleKey", () => {
  it("サーバー環境で設定済みなら値を返す", () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_secret_test";

    expect(getSupabaseServiceRoleKey()).toBe("sb_secret_test");
  });

  it("未設定なら例外を投げる", () => {
    expect(() => getSupabaseServiceRoleKey()).toThrow("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("ブラウザ環境(windowあり)からは値を返さず例外を投げる", () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_secret_test";
    // Node環境のテストなのでwindowを一時的に生やしてブラウザを模す。
    (globalThis as { window?: unknown }).window = {};

    try {
      expect(() => getSupabaseServiceRoleKey()).toThrow("サーバー専用");
    } finally {
      delete (globalThis as { window?: unknown }).window;
    }
  });
});
