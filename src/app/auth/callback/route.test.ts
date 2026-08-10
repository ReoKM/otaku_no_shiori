import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `GET /auth/callback` の結線テスト。
 *
 * `createSupabaseServerClient`(cookieを読む=Next.jsのリクエストスコープが要る)を
 * モックに差し替え、実プロバイダ・実DBには接続せずクエリパラメータの分岐だけを検証する。
 * 個々の判定ロジック(安全なリダイレクト先の判定・コード交換の結果整形)の網羅的なケースは
 * `src/lib/supabase/auth-callback.test.ts` を参照。
 */

const exchangeCodeForSession = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { exchangeCodeForSession },
  })),
}));

const { GET } = await import("./route");

describe("GET /auth/callback", () => {
  beforeEach(() => {
    exchangeCodeForSession.mockReset();
  });

  it("codeの交換に成功したらホーム(S1)へリダイレクトする", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });

    const res = await GET(
      new Request("https://example.com/auth/callback?code=abc123"),
    );

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://example.com/");
    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc123");
  });

  it("nextパラメータがあれば成功時にそこへリダイレクトする", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });

    const res = await GET(
      new Request(
        "https://example.com/auth/callback?code=abc123&next=%2Fshiori%2F1",
      ),
    );

    expect(res.headers.get("location")).toBe("https://example.com/shiori/1");
  });

  it("codeが無ければmissing_codeエラーでリダイレクトし、交換処理は呼ばない", async () => {
    const res = await GET(new Request("https://example.com/auth/callback"));

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(
      "https://example.com/?authError=missing_code",
    );
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("プロバイダがerrorを返したらprovider_deniedエラーでリダイレクトする(同意拒否など)", async () => {
    const res = await GET(
      new Request(
        "https://example.com/auth/callback?error=access_denied&error_description=denied",
      ),
    );

    expect(res.headers.get("location")).toBe(
      "https://example.com/?authError=provider_denied",
    );
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("コード交換に失敗したらexchange_failedエラーでリダイレクトする", async () => {
    exchangeCodeForSession.mockResolvedValue({
      error: { message: "invalid grant" },
    });

    const res = await GET(
      new Request("https://example.com/auth/callback?code=abc123"),
    );

    expect(res.headers.get("location")).toBe(
      "https://example.com/?authError=exchange_failed",
    );
  });

  it("交換処理が例外を投げてもexchange_failedエラーでリダイレクトする", async () => {
    exchangeCodeForSession.mockRejectedValue(new Error("fetch failed"));

    const res = await GET(
      new Request("https://example.com/auth/callback?code=abc123"),
    );

    expect(res.headers.get("location")).toBe(
      "https://example.com/?authError=exchange_failed",
    );
  });

  it("nextが外部URLなら無視してホームへフォールバックする(オープンリダイレクト対策)", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });

    const res = await GET(
      new Request(
        "https://example.com/auth/callback?code=abc123&next=https%3A%2F%2Fevil.example",
      ),
    );

    expect(res.headers.get("location")).toBe("https://example.com/");
  });

  it("nextがバックスラッシュ経由の外部URLなら無視してホームへフォールバックする(オープンリダイレクト対策)", async () => {
    // /\evil.example は startsWith("/") ・ startsWith("//") ・ includes("://") の
    // 文字列チェックをすべて回避するが、`new URL("/\\evil.example", origin)` は
    // WHATWG URL仕様(特別スキームでのバックスラッシュ→スラッシュ正規化)により
    // `https://evil.example/` に解決される。ここではその値が実際にホームへ
    // フォールバックすることを確認する(code-reviewer指摘の再発防止)。
    exchangeCodeForSession.mockResolvedValue({ error: null });

    const res = await GET(
      new Request(
        "https://example.com/auth/callback?code=abc123&next=%2F%5Cevil.example",
      ),
    );

    expect(res.headers.get("location")).toBe("https://example.com/");
  });
});
