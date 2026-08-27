import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { buildOAuthRedirectTo, signInWithProvider } from "./oauth-login";

/**
 * S6 X/GoogleログインボタンのOAuth起動ロジックのテスト。
 * 実際のSupabase/OAuthプロバイダへは接続せず、クライアントの応答を差し替えて検証する。
 */

type SignInResponse = { error?: { message: string } | null } | (() => never);

/** `auth.signInWithOAuth(...)` が指定の応答を返すだけの偽クライアントを作る。 */
function fakeClient(response: SignInResponse) {
  const signInWithOAuth = vi.fn(() => {
    if (typeof response === "function") {
      return response();
    }
    return Promise.resolve({ data: { provider: "twitter", url: "" }, error: response.error ?? null });
  });
  return {
    client: { auth: { signInWithOAuth } } as unknown as SupabaseClient,
    signInWithOAuth,
  };
}

const ORIGIN = "https://example.com";

describe("buildOAuthRedirectTo", () => {
  it("originに/auth/callbackとnext=/settings?justLoggedIn=1を付けたURLを返す", () => {
    expect(buildOAuthRedirectTo(ORIGIN)).toBe(
      "https://example.com/auth/callback?next=%2Fsettings%3FjustLoggedIn%3D1",
    );
  });

  it("末尾スラッシュ付きoriginでも二重スラッシュにならない", () => {
    expect(buildOAuthRedirectTo("https://example.com/")).toBe(
      "https://example.com/auth/callback?next=%2Fsettings%3FjustLoggedIn%3D1",
    );
  });
});

describe("signInWithProvider", () => {
  it("Xボタン押下でprovider: twitter、redirectToは自オリジンのコールバックURLでsignInWithOAuthを呼ぶ", async () => {
    const { client, signInWithOAuth } = fakeClient({ error: null });

    const result = await signInWithProvider(client, "twitter", ORIGIN);

    expect(result).toEqual({ ok: true });
    expect(signInWithOAuth).toHaveBeenCalledTimes(1);
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "twitter",
      options: { redirectTo: "https://example.com/auth/callback?next=%2Fsettings%3FjustLoggedIn%3D1" },
    });
  });

  it("Googleボタン押下でprovider: googleでsignInWithOAuthを呼ぶ", async () => {
    const { client, signInWithOAuth } = fakeClient({ error: null });

    const result = await signInWithProvider(client, "google", ORIGIN);

    expect(result).toEqual({ ok: true });
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: "https://example.com/auth/callback?next=%2Fsettings%3FjustLoggedIn%3D1" },
    });
  });

  it("Supabaseがエラーを返したらok:falseとメッセージを返す(LoginErrorNotice表示のトリガー)", async () => {
    const { client } = fakeClient({ error: { message: "provider is not enabled" } });

    const result = await signInWithProvider(client, "google", ORIGIN);

    expect(result).toEqual({ ok: false, message: "provider is not enabled" });
  });

  it("例外(ネットワーク断など)も握ってok:falseを返す", async () => {
    const { client } = fakeClient(() => {
      throw new Error("fetch failed");
    });

    const result = await signInWithProvider(client, "twitter", ORIGIN);

    expect(result).toEqual({ ok: false, message: "fetch failed" });
  });

  it("呼び出し元がどんなoriginを渡しても、redirectToは常にそのoriginのままになる(オープンリダイレクト対策の確認)", async () => {
    const { client, signInWithOAuth } = fakeClient({ error: null });

    await signInWithProvider(client, "twitter", "https://good.example");

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "twitter",
      options: { redirectTo: "https://good.example/auth/callback?next=%2Fsettings%3FjustLoggedIn%3D1" },
    });
  });
});
