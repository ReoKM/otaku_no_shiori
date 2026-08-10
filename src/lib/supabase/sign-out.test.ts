import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { signOut } from "./sign-out";

/**
 * S6ログアウトボタンのログアウト処理ロジックのテスト。
 * 実際のSupabaseへは接続せず、クライアントの応答を差し替えて検証する
 * (`src/lib/supabase/oauth-login.test.ts`と同じ方針)。
 */

type SignOutResponse = { error?: { message: string } | null } | (() => never);

function fakeClient(response: SignOutResponse) {
  const signOutMock = vi.fn(() => {
    if (typeof response === "function") {
      return response();
    }
    return Promise.resolve({ error: response.error ?? null });
  });
  return {
    client: { auth: { signOut: signOutMock } } as unknown as SupabaseClient,
    signOutMock,
  };
}

describe("signOut", () => {
  it("成功時はauth.signOut()を1回呼び、{ ok: true }を返す", async () => {
    const { client, signOutMock } = fakeClient({ error: null });

    const result = await signOut(client);

    expect(result).toEqual({ ok: true });
    expect(signOutMock).toHaveBeenCalledTimes(1);
  });

  it("Supabaseがエラーを返したら{ ok: false, message }を返す", async () => {
    const { client } = fakeClient({ error: { message: "network error" } });

    const result = await signOut(client);

    expect(result).toEqual({ ok: false, message: "network error" });
  });

  it("signOut()が例外を投げても呼び出し元へは投げ返さずok: falseで返す", async () => {
    const { client } = fakeClient(() => {
      throw new Error("boom");
    });

    const result = await signOut(client);

    expect(result).toEqual({ ok: false, message: "boom" });
  });
});
