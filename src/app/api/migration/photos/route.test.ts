import { afterEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * POST /api/migration/photos のルートハンドラーのテスト。
 * Supabaseへは接続しない。`createSupabaseServerClient`(認証)と
 * `getSupabaseAdminClient`(所有権確認・Storage・DB書き込み)をモックし、
 * 配線(認証→検証→所有権確認→アップロード→レスポンス)を検証する。
 * IDOR拒否(他人のshiori_idへのアップロード試行)は必須のテストケースとして含める。
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

const SHIORI_ID = "11111111-1111-4111-8111-111111111111";
const PHOTO_ID = "22222222-2222-4222-8222-222222222222";

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

interface FakeAdminOptions {
  /** trueなら`shiori_id`をこのユーザー所有として扱う。falseなら他人/存在しない扱い(IDOR拒否)。 */
  isOwnedByUser?: boolean;
  uploadError?: { message: string } | null;
  upsertError?: { code?: string; message: string } | null;
}

function fakeAdminClient(options: FakeAdminOptions = {}) {
  const { isOwnedByUser = true, uploadError = null, upsertError = null } = options;
  const uploadCalls: { path: string }[] = [];
  const upsertCalls: { rows: unknown[] }[] = [];

  const client = {
    from: (table: string) => {
      if (table === "shiori") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: () =>
                  Promise.resolve({
                    data: isOwnedByUser ? { id: SHIORI_ID } : null,
                    error: null,
                  }),
              }),
            }),
          }),
        };
      }
      if (table === "photos") {
        return {
          upsert: (rows: unknown[]) => {
            upsertCalls.push({ rows });
            if (upsertError) {
              return Promise.resolve({ error: upsertError });
            }
            return Promise.resolve({ error: null });
          },
        };
      }
      throw new Error(`unexpected table: ${table}`);
    },
    storage: {
      from: () => ({
        upload: (path: string) => {
          uploadCalls.push({ path });
          if (uploadError) {
            return Promise.resolve({ data: null, error: uploadError });
          }
          return Promise.resolve({ data: { path }, error: null });
        },
      }),
    },
  } as unknown as SupabaseClient;

  return { client, uploadCalls, upsertCalls };
}

function jpegFile(sizeBytes = 100): File {
  return new File([new Uint8Array(sizeBytes)], "photo.jpg", { type: "image/jpeg" });
}

function multipartRequest(fields: Record<string, string | File | null> = {}): Request {
  const form = new FormData();
  const defaults: Record<string, string | File | null> = {
    shiori_id: SHIORI_ID,
    photo_id: PHOTO_ID,
    day_date: "2026-08-10",
    caption: "開演前",
    file: jpegFile(),
    ...fields,
  };
  for (const [key, value] of Object.entries(defaults)) {
    if (value === null) continue;
    form.set(key, value as string | File);
  }
  return new Request("http://localhost/api/migration/photos", {
    method: "POST",
    body: form,
  });
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("POST /api/migration/photos", () => {
  it("未ログインなら401を返す", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue(fakeAuthedServerClient(null));

    const res = await POST(multipartRequest());

    expect(res.status).toBe(401);
    expect(mockGetSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it("入力検証に失敗したら400とdetailsを返す(shiori_idが無い)", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue(fakeAuthedServerClient("user-1"));

    const res = await POST(multipartRequest({ shiori_id: null }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(Array.isArray(body.error.details)).toBe(true);
    expect(mockGetSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it("2MBを超えるファイルは400を返す(サーバー側でも検証する)", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue(fakeAuthedServerClient("user-1"));

    const res = await POST(multipartRequest({ file: jpegFile(2 * 1024 * 1024 + 1) }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(mockGetSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it("許可されていないMIMEタイプは400を返す", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue(fakeAuthedServerClient("user-1"));
    const gifFile = new File([new Uint8Array(10)], "photo.gif", { type: "image/gif" });

    const res = await POST(multipartRequest({ file: gifFile }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.ok).toBe(false);
  });

  it("他人(または存在しない)のshiori_idへのアップロードは404で拒否する(IDOR対策)", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue(fakeAuthedServerClient("user-1"));
    const { client, uploadCalls } = fakeAdminClient({ isOwnedByUser: false });
    mockGetSupabaseAdminClient.mockReturnValue(client);

    const res = await POST(multipartRequest());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.ok).toBe(false);
    expect(body.error.reason).toBe("shiori_not_owned");
    expect(uploadCalls).toHaveLength(0);
  });

  it("認証済み+所有権あり+有効なボディなら200とstorage_pathを返す", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue(fakeAuthedServerClient("user-1"));
    const { client, uploadCalls, upsertCalls } = fakeAdminClient();
    mockGetSupabaseAdminClient.mockReturnValue(client);

    const res = await POST(multipartRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.photo_id).toBe(PHOTO_ID);
    expect(body.storage_path).toBe(`user-1/${SHIORI_ID}/${PHOTO_ID}.jpg`);
    expect(uploadCalls).toHaveLength(1);
    expect(upsertCalls).toHaveLength(1);
  });

  it("Storageアップロードが失敗したら502を返す", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue(fakeAuthedServerClient("user-1"));
    const { client } = fakeAdminClient({ uploadError: { message: "quota exceeded" } });
    mockGetSupabaseAdminClient.mockReturnValue(client);

    const res = await POST(multipartRequest());
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.ok).toBe(false);
    expect(body.error.reason).toBe("storage_upload_failed");
  });

  it("photosテーブルへの書き込みが失敗したら502を返す", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue(fakeAuthedServerClient("user-1"));
    const { client } = fakeAdminClient({ upsertError: { code: "23503", message: "fk violation" } });
    mockGetSupabaseAdminClient.mockReturnValue(client);

    const res = await POST(multipartRequest());
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.ok).toBe(false);
    expect(body.error.reason).toBe("db_insert_failed");
  });

  it("同じphoto_idの再送は成功として扱える(冪等な再送)", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue(fakeAuthedServerClient("user-1"));
    const { client } = fakeAdminClient();
    mockGetSupabaseAdminClient.mockReturnValue(client);

    const first = await POST(multipartRequest());
    const second = await POST(multipartRequest());

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    const secondBody = await second.json();
    expect(secondBody.storage_path).toBe(`user-1/${SHIORI_ID}/${PHOTO_ID}.jpg`);
  });
});
