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

function fakeAdminClient(errorByTable: Partial<Record<string, { code?: string; message: string }>> = {}) {
  const calls: UpsertCall[] = [];
  const client = {
    from: (table: string) => ({
      upsert: (rows: Record<string, unknown>[], options: UpsertCall["options"]) => {
        calls.push({ table, rows, options });
        const error = errorByTable[table];
        return Promise.resolve({ error: error ?? null });
      },
    }),
  } as unknown as SupabaseClient;
  return { client, calls };
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
    expect(result.skipped).toEqual({ unknown_seed_spot: 0 });
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
});
