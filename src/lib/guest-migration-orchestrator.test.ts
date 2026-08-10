import { describe, expect, it, vi } from "vitest";

import {
  buildGuestMigrationRequestBody,
  runGuestMigration,
  type GuestMigrationApiClient,
  type GuestMigrationStoreDeps,
  type MigrationApiResult,
  type PhotoMigrationRequest,
} from "./guest-migration-orchestrator";
import type { GuestMigrationTextData } from "./guest-store";
import type { Photo } from "@/types/shiori";

function emptyTextData(): GuestMigrationTextData {
  return { shiori: [], packing_items: [], todos: [], itinerary_entries: [], spots: [], shiori_spots: [] };
}

function makeTextData(overrides: Partial<GuestMigrationTextData> = {}): GuestMigrationTextData {
  return {
    shiori: [
      {
        id: "11111111-1111-1111-1111-111111111111",
        title: "夏フェス遠征",
        start_date: null,
        end_date: null,
        trip_type: "live",
        purpose: null,
        cover: null,
        budget_total: 12000,
        budget_memo: "予算メモ",
        created_at: "2026-08-01T00:00:00.000Z",
        updated_at: "2026-08-01T00:00:00.000Z",
      },
    ],
    packing_items: [],
    todos: [],
    itinerary_entries: [],
    spots: [],
    shiori_spots: [],
    ...overrides,
  };
}

function makePhoto(id: string, shioriId = "11111111-1111-1111-1111-111111111111"): Photo {
  return {
    id,
    shiori_id: shioriId,
    day_date: null,
    caption: null,
    blob: new Blob(["dummy"], { type: "image/webp" }),
    created_at: "2026-08-01T00:00:00.000Z",
  };
}

/** テスト用のフェイクguestStore(状態はテスト側で自由に差し替えられる)。 */
function makeFakeGuestStore(overrides: Partial<GuestMigrationStoreDeps> = {}): GuestMigrationStoreDeps {
  return {
    getGuestMigrationState: vi.fn(async () => ({ migrated: false })),
    markGuestDataMigrated: vi.fn(async () => {}),
    collectAllGuestTextData: vi.fn(async () => emptyTextData()),
    listAllGuestPhotos: vi.fn(async () => []),
    ...overrides,
  };
}

/** テスト用のフェイクAPIクライアント。呼ばれた引数を記録する。 */
function makeFakeApiClient(overrides: Partial<GuestMigrationApiClient> = {}): GuestMigrationApiClient & {
  textCalls: unknown[];
  photoCalls: PhotoMigrationRequest[];
} {
  const textCalls: unknown[] = [];
  const photoCalls: PhotoMigrationRequest[] = [];
  const client: GuestMigrationApiClient & { textCalls: unknown[]; photoCalls: PhotoMigrationRequest[] } = {
    textCalls,
    photoCalls,
    migrateText: async (body): Promise<MigrationApiResult> => {
      textCalls.push(body);
      return { ok: true };
    },
    migratePhoto: async (request): Promise<MigrationApiResult> => {
      photoCalls.push(request);
      return { ok: true };
    },
    ...overrides,
  };
  return client;
}

describe("buildGuestMigrationRequestBody", () => {
  it("サーバーAPIが読み取るフィールドのみに絞り込む(budget_total/budget_memoは含めない)", () => {
    const body = buildGuestMigrationRequestBody(makeTextData());

    expect(body.shiori).toEqual([
      {
        id: "11111111-1111-1111-1111-111111111111",
        title: "夏フェス遠征",
        start_date: null,
        end_date: null,
        trip_type: "live",
        purpose: null,
        cover: null,
        created_at: "2026-08-01T00:00:00.000Z",
        updated_at: "2026-08-01T00:00:00.000Z",
      },
    ]);
    expect((body.shiori[0] as Record<string, unknown>)).not.toHaveProperty("budget_total");
    expect((body.shiori[0] as Record<string, unknown>)).not.toHaveProperty("budget_memo");
  });

  it("spotsはsource/statusを含めずid/name/description/category/area/created_atのみ送る", () => {
    const body = buildGuestMigrationRequestBody(
      makeTextData({
        spots: [
          {
            id: "22222222-2222-2222-2222-222222222222",
            name: "◯◯会場前カフェ",
            description: null,
            category: null,
            area: null,
            source: "ugc",
            status: "private",
            created_at: "2026-08-01T00:00:00.000Z",
          },
        ],
      }),
    );

    expect(body.spots).toEqual([
      {
        id: "22222222-2222-2222-2222-222222222222",
        name: "◯◯会場前カフェ",
        description: null,
        category: null,
        area: null,
        created_at: "2026-08-01T00:00:00.000Z",
      },
    ]);
  });
});

describe("runGuestMigration", () => {
  it("移行済みフラグが立っていれば何もせずno_dataを返す", async () => {
    const guestStore = makeFakeGuestStore({ getGuestMigrationState: vi.fn(async () => ({ migrated: true })) });
    const apiClient = makeFakeApiClient();

    const outcome = await runGuestMigration({ guestStore, apiClient });

    expect(outcome).toEqual({ phase: "no_data" });
    expect(guestStore.collectAllGuestTextData).not.toHaveBeenCalled();
    expect(apiClient.textCalls).toHaveLength(0);
  });

  it("ゲストしおりが0件・写真も0件ならno_dataを返し、移行済みフラグを立てる", async () => {
    const guestStore = makeFakeGuestStore();
    const apiClient = makeFakeApiClient();

    const outcome = await runGuestMigration({ guestStore, apiClient });

    expect(outcome).toEqual({ phase: "no_data" });
    expect(guestStore.markGuestDataMigrated).toHaveBeenCalledOnce();
    expect(apiClient.textCalls).toHaveLength(0);
  });

  it("テキスト成功→写真全件成功で移行済みフラグを立て、進捗を件数分通知する", async () => {
    const photos = [makePhoto("photo-1"), makePhoto("photo-2")];
    const guestStore = makeFakeGuestStore({
      collectAllGuestTextData: vi.fn(async () => makeTextData()),
      listAllGuestPhotos: vi.fn(async () => photos),
    });
    const apiClient = makeFakeApiClient();
    const progress: Array<[number, number]> = [];

    const outcome = await runGuestMigration({
      guestStore,
      apiClient,
      onProgress: (migratedCount, totalCount) => progress.push([migratedCount, totalCount]),
    });

    expect(outcome).toEqual({ phase: "success" });
    expect(guestStore.markGuestDataMigrated).toHaveBeenCalledOnce();
    expect(apiClient.textCalls).toHaveLength(1);
    expect(apiClient.photoCalls.map((p) => p.photoId)).toEqual(["photo-1", "photo-2"]);
    // 合計3件(テキスト1件+写真2件)。0→1→2→3の順で進捗が通知される。
    expect(progress).toEqual([
      [0, 3],
      [1, 3],
      [2, 3],
      [3, 3],
    ]);
  });

  it("テキスト送信が失敗したら写真は送らずpartial_failureを返し、移行済みフラグは立てない", async () => {
    const photos = [makePhoto("photo-1")];
    const guestStore = makeFakeGuestStore({
      collectAllGuestTextData: vi.fn(async () => makeTextData()),
      listAllGuestPhotos: vi.fn(async () => photos),
    });
    const apiClient = makeFakeApiClient({ migrateText: async () => ({ ok: false }) });

    const outcome = await runGuestMigration({ guestStore, apiClient });

    expect(outcome).toEqual({ phase: "partial_failure", failedPhotoIds: ["photo-1"], textFailed: true });
    expect(guestStore.markGuestDataMigrated).not.toHaveBeenCalled();
    expect(apiClient.photoCalls).toHaveLength(0);
  });

  it("写真の一部だけ失敗したら成功分は進め、失敗したidだけpartial_failureで返す", async () => {
    const photos = [makePhoto("photo-1"), makePhoto("photo-2"), makePhoto("photo-3")];
    const guestStore = makeFakeGuestStore({
      collectAllGuestTextData: vi.fn(async () => makeTextData()),
      listAllGuestPhotos: vi.fn(async () => photos),
    });
    const photoCalls: PhotoMigrationRequest[] = [];
    const apiClient = makeFakeApiClient({
      migratePhoto: async (request) => {
        photoCalls.push(request);
        return { ok: request.photoId !== "photo-2" };
      },
    });

    const outcome = await runGuestMigration({ guestStore, apiClient });

    expect(outcome).toEqual({ phase: "partial_failure", failedPhotoIds: ["photo-2"], textFailed: false });
    expect(guestStore.markGuestDataMigrated).not.toHaveBeenCalled();
    expect(photoCalls).toHaveLength(3);
  });

  it("再試行時(retryFailedPhotoIds指定)は移行済みチェックをせず、対象の写真のみ再送する", async () => {
    const photos = [makePhoto("photo-1"), makePhoto("photo-2"), makePhoto("photo-3")];
    const guestStore = makeFakeGuestStore({
      // 再試行時はno_data判定をしないため、この関数が呼ばれても結果に影響しないことを確認する。
      getGuestMigrationState: vi.fn(async () => ({ migrated: false })),
      collectAllGuestTextData: vi.fn(async () => makeTextData()),
      listAllGuestPhotos: vi.fn(async () => photos),
    });
    const apiClient = makeFakeApiClient();

    const outcome = await runGuestMigration({
      guestStore,
      apiClient,
      retryFailedPhotoIds: ["photo-2"],
    });

    expect(outcome).toEqual({ phase: "success" });
    // テキストは冪等なため丸ごと再送、写真は失敗していたphoto-2のみ再送する。
    expect(apiClient.textCalls).toHaveLength(1);
    expect(apiClient.photoCalls.map((p) => p.photoId)).toEqual(["photo-2"]);
    expect(guestStore.markGuestDataMigrated).toHaveBeenCalledOnce();
  });
});
