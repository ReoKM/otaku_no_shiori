import { afterEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * POST /api/migration/guest のルートハンドラーのテスト。
 * Supabaseへは接続しない。`createSupabaseServerClient`(認証)と
 * `getSupabaseAdminClient`(書き込み)をモックし、配線(認証→検証→移行→レスポンス)を検証する。
 */

const mockCreateSupabaseServerClient = vi.fn();
const mockGetSupabaseAdminClient = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => mockCreateSupabaseServerClient(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => mockGetSupabaseAdminClient(),
}));

const { POST } = await import("./route");

interface UpsertCall {
  table: string;
  rows: unknown[];
}

function fakeAuthedServerClient(userId: string | null) {
  return {
    auth: {
      getUser: () =>
        Promise.resolve(
          userId
            ? { data: { user: { id: userId } }, error: null }
            : { data: { user: null }, error: { message: "not authenticated" } },
        ),
    },
  };
}

function fakeAdminClient(errorTable?: string) {
  const calls: UpsertCall[] = [];
  const client = {
    from: (table: string) => ({
      upsert: (rows: unknown[]) => {
        calls.push({ table, rows });
        if (table === errorTable) {
          return Promise.resolve({ error: { code: "23505", message: "duplicate key" } });
        }
        return Promise.resolve({ error: null });
      },
    }),
  } as unknown as SupabaseClient;
  return { client, calls };
}

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/migration/guest", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  shiori: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      title: "夏フェス遠征",
      start_date: null,
      end_date: null,
      trip_type: "live",
      purpose: null,
      cover: null,
      created_at: "2026-07-01T00:00:00.000Z",
      updated_at: "2026-07-01T00:00:00.000Z",
    },
  ],
  packing_items: [],
  todos: [],
  itinerary_entries: [],
  spots: [],
  shiori_spots: [],
};

afterEach(() => {
  vi.resetAllMocks();
});

describe("POST /api/migration/guest", () => {
  it("未ログインなら401を返す", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue(fakeAuthedServerClient(null));

    const res = await POST(jsonRequest(VALID_BODY));

    expect(res.status).toBe(401);
    expect(mockGetSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it("JSONとして解析できないボディは400を返す", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue(fakeAuthedServerClient("user-1"));
    const req = new Request("http://localhost/api/migration/guest", {
      method: "POST",
      body: "not-json",
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("入力検証に失敗したら400とdetailsを返す", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue(fakeAuthedServerClient("user-1"));

    const res = await POST(jsonRequest({ ...VALID_BODY, shiori: [{ title: "" }] }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(Array.isArray(body.error.details)).toBe(true);
    expect(mockGetSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it("認証済み+有効なボディなら200と挿入件数を返し、service_roleクライアントでuser_idを付与する", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue(fakeAuthedServerClient("user-1"));
    const { client, calls } = fakeAdminClient();
    mockGetSupabaseAdminClient.mockReturnValue(client);

    const res = await POST(jsonRequest(VALID_BODY));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.inserted.shiori).toBe(1);
    const shioriCall = calls.find((c) => c.table === "shiori");
    expect((shioriCall?.rows[0] as { user_id: string }).user_id).toBe("user-1");
  });

  it("DB書き込みが失敗したら502とstageを返す", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue(fakeAuthedServerClient("user-1"));
    const { client } = fakeAdminClient("shiori");
    mockGetSupabaseAdminClient.mockReturnValue(client);

    const res = await POST(jsonRequest(VALID_BODY));
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.ok).toBe(false);
    expect(body.error.stage).toBe("shiori");
  });
});
