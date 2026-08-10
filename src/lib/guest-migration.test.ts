import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { GuestMigrationStageError, migrateGuestData } from "./guest-migration";
import { seedSpotDbId } from "./seed-spot-db-id";
import type { ValidatedGuestMigrationPayload } from "./guest-migration-validation";

/**
 * ゲスト移行の一括INSERTロジックのテスト。
 * 実際のSupabaseへは接続せず、`upsert`呼び出しを記録するだけの偽クライアントで検証する。
 */

interface UpsertCall {
  table: string;
  rows: Record<string, unknown>[];
  options: { onConflict: string; ignoreDuplicates: boolean };
}

interface OwnershipSelectCall {
  table: string;
  ids: string[];
}

/**
 * `admin.from("shiori").select("id").in("id", ids).eq("user_id", userId)`(IDOR対策の
 * 所有権確認クエリ)を模擬する。
 *
 * `ownedShioriIds`:
 * - `"all"`(デフォルト): 問い合わせたidはすべて「このユーザー所有」として返す。
 *   所有権チェック自体を検証しないテストの挙動を変えないための既定値。
 * - `string[]`: このリストに含まれるidだけを「所有」として返す。
 *   IDOR(他人のshiori_idを参照する子データの注入)シナリオの検証に使う。
 */
function fakeAdminClient(
  errorByTable: Partial<Record<string, { code?: string; message: string }>> = {},
  options: { ownedShioriIds?: string[] | "all"; shioriSelectError?: { code?: string; message: string } } = {},
) {
  const { ownedShioriIds = "all", shioriSelectError } = options;
  const calls: UpsertCall[] = [];
  const selectCalls: OwnershipSelectCall[] = [];
  const client = {
    from: (table: string) => {
      const upsert = (rows: Record<string, unknown>[], upsertOptions: UpsertCall["options"]) => {
        calls.push({ table, rows, options: upsertOptions });
        const error = errorByTable[table];
        return Promise.resolve({ error: error ?? null });
      };
      if (table !== "shiori") {
        return { upsert };
      }
      return {
        upsert,
        select: () => ({
          in: (_column: string, ids: string[]) => ({
            eq: () => {
              selectCalls.push({ table, ids });
              if (shioriSelectError) {
                return Promise.resolve({ data: null, error: shioriSelectError });
              }
              const owned = ownedShioriIds === "all" ? ids : ids.filter((id) => ownedShioriIds.includes(id));
              return Promise.resolve({ data: owned.map((id) => ({ id })), error: null });
            },
          }),
        }),
      };
    },
  } as unknown as SupabaseClient;
  return { client, calls, selectCalls };
}

function emptyPayload(overrides: Partial<ValidatedGuestMigrationPayload> = {}): ValidatedGuestMigrationPayload {
  return {
    shiori: [],
    packing_items: [],
    todos: [],
    itinerary_entries: [],
    spots: [],
    shiori_spots: [],
    referenced_seed_spots: [],
    skipped_unknown_seed_spot_count: 0,
    ...overrides,
  };
}

const USER_ID = "u-1234";
const SHIORI_ID = "s-1234";

describe("migrateGuestData", () => {
  it("空ペイロードでは1件もupsertを呼ばず、件数はすべて0", async () => {
    const { client, calls } = fakeAdminClient();

    const result = await migrateGuestData(client, USER_ID, emptyPayload());

    expect(calls).toHaveLength(0);
    expect(result.inserted).toEqual({
      shiori: 0,
      spots: 0,
      packing_items: 0,
      todos: 0,
      itinerary_entries: 0,
      shiori_spots: 0,
    });
    expect(result.skipped).toEqual({ unknown_seed_spot: 0, unauthorized_shiori_id: 0 });
  });

  it("shioriにuser_idを強制付与してupsertする(onConflict=id, ignoreDuplicates=true)", async () => {
    const { client, calls } = fakeAdminClient();
    const payload = emptyPayload({
      shiori: [
        {
          id: SHIORI_ID,
          title: "夏フェス",
          start_date: null,
          end_date: null,
          trip_type: "live",
          purpose: null,
          cover: null,
          created_at: "2026-07-01T00:00:00.000Z",
          updated_at: "2026-07-01T00:00:00.000Z",
        },
      ],
    });

    const result = await migrateGuestData(client, USER_ID, payload);

    const shioriCall = calls.find((c) => c.table === "shiori");
    expect(shioriCall).toBeDefined();
    expect(shioriCall?.rows[0]).toMatchObject({ id: SHIORI_ID, user_id: USER_ID });
    expect(shioriCall?.options).toEqual({ onConflict: "id", ignoreDuplicates: true });
    expect(result.inserted.shiori).toBe(1);
  });

  it("UGCスポットにcreated_by/source=ugc/status=privateを強制付与する", async () => {
    const { client, calls } = fakeAdminClient();
    const payload = emptyPayload({
      spots: [
        {
          id: "spot-1",
          name: "自由入力スポット",
          description: null,
          category: null,
          area: null,
          created_at: "2026-07-01T00:00:00.000Z",
        },
      ],
    });

    await migrateGuestData(client, USER_ID, payload);

    const spotsCall = calls.find((c) => c.table === "spots");
    expect(spotsCall?.rows).toEqual([
      {
        id: "spot-1",
        name: "自由入力スポット",
        description: null,
        category: null,
        area: null,
        source: "ugc",
        status: "private",
        created_by: USER_ID,
        created_at: "2026-07-01T00:00:00.000Z",
      },
    ]);
  });

  it("シードスポット参照をseedSpotDbIdで決定論的UUIDに変換してspots/shiori_spots両方をupsertする", async () => {
    const { client, calls } = fakeAdminClient();
    const seedSpot = {
      id: "seed-hinatazaka-slope",
      name: "日向坂",
      description: "説明",
      category: "seichi" as const,
      area: "東京都港区",
      map_query: "日向坂",
      source: "seed" as const,
      refs: [],
    };
    const payload = emptyPayload({
      shiori_spots: [{ shiori_id: SHIORI_ID, spot_id: seedSpot.id, memo: null, is_visited: false }],
      referenced_seed_spots: [seedSpot],
    });

    await migrateGuestData(client, USER_ID, payload);

    const derivedId = seedSpotDbId(seedSpot.id);
    const spotsCall = calls.find((c) => c.table === "spots");
    expect(spotsCall?.rows).toEqual([
      {
        id: derivedId,
        name: "日向坂",
        description: "説明",
        category: "seichi",
        area: "東京都港区",
        source: "seed",
        status: "public",
        created_by: null,
      },
    ]);

    const shioriSpotsCall = calls.find((c) => c.table === "shiori_spots");
    expect(shioriSpotsCall?.rows).toEqual([
      { shiori_id: SHIORI_ID, spot_id: derivedId, memo: null, is_visited: false },
    ]);
    expect(shioriSpotsCall?.options).toEqual({ onConflict: "shiori_id,spot_id", ignoreDuplicates: true });
  });

  it("いずれかのテーブルでエラーが起きるとGuestMigrationStageErrorを投げ、以降のテーブルは呼ばない", async () => {
    const { client, calls } = fakeAdminClient({
      todos: { code: "23505", message: "duplicate key" },
    });
    const payload = emptyPayload({
      shiori: [
        {
          id: SHIORI_ID,
          title: "夏フェス",
          start_date: null,
          end_date: null,
          trip_type: "live",
          purpose: null,
          cover: null,
          created_at: "2026-07-01T00:00:00.000Z",
          updated_at: "2026-07-01T00:00:00.000Z",
        },
      ],
      todos: [
        { id: "todo-1", shiori_id: SHIORI_ID, label: "確認", due_date: null, is_done: false, sort_order: 0 },
      ],
      itinerary_entries: [
        {
          id: "it-1",
          shiori_id: SHIORI_ID,
          day_date: "2026-08-01",
          time: null,
          title: "開場",
          place_name: null,
          memo: null,
          sort_order: 0,
        },
      ],
    });

    await expect(migrateGuestData(client, USER_ID, payload)).rejects.toThrow(GuestMigrationStageError);

    const tables = calls.map((c) => c.table);
    expect(tables).toEqual(["shiori", "todos"]);
    expect(tables).not.toContain("itinerary_entries");
  });

  it("skipped.unknown_seed_spotをペイロードの値からそのまま返す", async () => {
    const { client } = fakeAdminClient();
    const result = await migrateGuestData(
      client,
      USER_ID,
      emptyPayload({ skipped_unknown_seed_spot_count: 3 }),
    );
    expect(result.skipped.unknown_seed_spot).toBe(3);
  });

  // IDOR(Insecure Direct Object Reference)対策: 攻撃者が他人の既存しおりの実UUIDを
  // 自分のリクエストの`shiori[]`に紛れ込ませても、そのshiori_idを参照する子データが
  // service_role経由でそのままINSERTされてはならない。
  describe("IDOR対策(所有していないshiori_idを参照する子データを書き込まない)", () => {
    const OTHER_USERS_SHIORI_ID = "s-victim-0001";

    function idorPayload(): ValidatedGuestMigrationPayload {
      return emptyPayload({
        // 攻撃者が「新規作成のつもり」で他人の実しおりUUIDを混入させたケースを模す。
        shiori: [
          {
            id: OTHER_USERS_SHIORI_ID,
            title: "なりすまし",
            start_date: null,
            end_date: null,
            trip_type: "live",
            purpose: null,
            cover: null,
            created_at: "2026-07-01T00:00:00.000Z",
            updated_at: "2026-07-01T00:00:00.000Z",
          },
        ],
        packing_items: [
          {
            id: "pk-1",
            shiori_id: OTHER_USERS_SHIORI_ID,
            label: "注入アイテム",
            is_checked: false,
            sort_order: 0,
          },
        ],
        todos: [
          {
            id: "todo-1",
            shiori_id: OTHER_USERS_SHIORI_ID,
            label: "注入TODO",
            due_date: null,
            is_done: false,
            sort_order: 0,
          },
        ],
        itinerary_entries: [
          {
            id: "it-1",
            shiori_id: OTHER_USERS_SHIORI_ID,
            day_date: "2026-08-01",
            time: null,
            title: "注入旅程",
            place_name: null,
            memo: null,
            sort_order: 0,
          },
        ],
        shiori_spots: [
          {
            shiori_id: OTHER_USERS_SHIORI_ID,
            spot_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            memo: null,
            is_visited: false,
          },
        ],
      });
    }

    it("DB上でuser_id一致が確認できないshiori_idを参照する子データは1件もupsertされない", async () => {
      // ownedShioriIds: [] → 「このユーザー所有として確認できたshiori_idは無い」を模す
      // (=攻撃者が混入させたshiori_idはDB上では被害者のuser_idのまま)。
      const { client, calls, selectCalls } = fakeAdminClient({}, { ownedShioriIds: [] });

      const result = await migrateGuestData(client, USER_ID, idorPayload());

      const childTables = calls
        .map((c) => c.table)
        .filter((t) => t !== "shiori" && t !== "spots");
      expect(childTables).toEqual([]);

      // 所有権確認クエリ自体は、注入された子データが参照するshiori_id一式で呼ばれている。
      expect(selectCalls).toEqual([{ table: "shiori", ids: [OTHER_USERS_SHIORI_ID] }]);

      expect(result.inserted).toMatchObject({
        packing_items: 0,
        todos: 0,
        itinerary_entries: 0,
        shiori_spots: 0,
      });
      expect(result.skipped.unauthorized_shiori_id).toBe(4);
    });

    it("DB上でuser_id一致が確認できたshiori_idを参照する子データは通常どおりupsertされる", async () => {
      // 正規の新規作成(または再送によるリトライ)ではDB上も自分のuser_idで一致するはず。
      const { client, calls } = fakeAdminClient({}, { ownedShioriIds: [OTHER_USERS_SHIORI_ID] });

      const result = await migrateGuestData(client, USER_ID, idorPayload());

      const childTables = calls.map((c) => c.table);
      expect(childTables).toEqual(["shiori", "packing_items", "todos", "itinerary_entries", "shiori_spots"]);
      expect(result.inserted).toMatchObject({
        packing_items: 1,
        todos: 1,
        itinerary_entries: 1,
        shiori_spots: 1,
      });
      expect(result.skipped.unauthorized_shiori_id).toBe(0);
    });

    it("shiori_idを参照する子データが無ければ所有権確認クエリ自体を呼ばない", async () => {
      const { client, selectCalls } = fakeAdminClient();

      await migrateGuestData(client, USER_ID, emptyPayload());

      expect(selectCalls).toEqual([]);
    });
  });
});
