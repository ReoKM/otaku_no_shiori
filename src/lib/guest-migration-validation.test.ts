import { describe, expect, it } from "vitest";

import {
  MAX_SHIORI_COUNT,
  validateGuestMigrationPayload,
} from "./guest-migration-validation";

/**
 * ゲスト移行APIの入力検証テスト。
 * DBやネットワークには一切触れない純粋関数のテスト。
 */

const SHIORI_ID = "11111111-1111-4111-8111-111111111111";
const PACKING_ID = "22222222-2222-4222-8222-222222222222";
const TODO_ID = "33333333-3333-4333-8333-333333333333";
const ITINERARY_ID = "44444444-4444-4444-8444-444444444444";
const SPOT_ID = "55555555-5555-4555-8555-555555555555";

function baseShiori(overrides: Record<string, unknown> = {}) {
  return {
    id: SHIORI_ID,
    title: "夏フェス遠征",
    start_date: "2026-08-01",
    end_date: "2026-08-02",
    trip_type: "live",
    purpose: "参戦",
    cover: "color:#FFAA00",
    created_at: "2026-07-01T00:00:00.000Z",
    updated_at: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

function emptyPayload(overrides: Record<string, unknown> = {}) {
  return {
    shiori: [],
    packing_items: [],
    todos: [],
    itinerary_entries: [],
    spots: [],
    shiori_spots: [],
    ...overrides,
  };
}

describe("validateGuestMigrationPayload", () => {
  it("全て空配列なら成功する(0件移行)", () => {
    const result = validateGuestMigrationPayload(emptyPayload());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.shiori).toEqual([]);
    expect(result.data.skipped_unknown_seed_spot_count).toBe(0);
  });

  it("しおり1件+子データ一式が揃った正常系を検証できる", () => {
    const result = validateGuestMigrationPayload(
      emptyPayload({
        shiori: [baseShiori()],
        packing_items: [
          { id: PACKING_ID, shiori_id: SHIORI_ID, label: "うちわ", is_checked: false, sort_order: 0 },
        ],
        todos: [
          {
            id: TODO_ID,
            shiori_id: SHIORI_ID,
            label: "チケット確認",
            due_date: "2026-07-30",
            is_done: false,
            sort_order: 0,
          },
        ],
        itinerary_entries: [
          {
            id: ITINERARY_ID,
            shiori_id: SHIORI_ID,
            day_date: "2026-08-01",
            time: "10:00",
            title: "開場",
            place_name: "会場",
            memo: null,
            sort_order: 0,
          },
        ],
        spots: [
          {
            id: SPOT_ID,
            name: "自由入力スポット",
            description: null,
            category: null,
            area: null,
            created_at: "2026-07-01T00:00:00.000Z",
          },
        ],
        shiori_spots: [{ shiori_id: SHIORI_ID, spot_id: SPOT_ID, memo: "行きたい", is_visited: false }],
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.shiori).toHaveLength(1);
    expect(result.data.packing_items).toHaveLength(1);
    expect(result.data.todos).toHaveLength(1);
    expect(result.data.itinerary_entries).toHaveLength(1);
    expect(result.data.spots).toHaveLength(1);
    expect(result.data.shiori_spots).toHaveLength(1);
  });

  it("ボディがオブジェクトでなければ失敗する", () => {
    const result = validateGuestMigrationPayload("not-an-object");
    expect(result.ok).toBe(false);
  });

  it("配列であるべきキーが配列でなければ失敗する", () => {
    const result = validateGuestMigrationPayload(emptyPayload({ shiori: {} }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((e) => e.includes("shiori"))).toBe(true);
  });

  it("shiori.idがUUID形式でなければ失敗する", () => {
    const result = validateGuestMigrationPayload(
      emptyPayload({ shiori: [baseShiori({ id: "not-a-uuid" })] }),
    );
    expect(result.ok).toBe(false);
  });

  it("shiori.idが重複していれば失敗する", () => {
    const result = validateGuestMigrationPayload(
      emptyPayload({ shiori: [baseShiori(), baseShiori()] }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((e) => e.includes("重複"))).toBe(true);
  });

  it("shiori.titleが空なら失敗する", () => {
    const result = validateGuestMigrationPayload(
      emptyPayload({ shiori: [baseShiori({ title: "  " })] }),
    );
    expect(result.ok).toBe(false);
  });

  it("shiori.titleが30文字を超えると失敗する", () => {
    const result = validateGuestMigrationPayload(
      emptyPayload({ shiori: [baseShiori({ title: "あ".repeat(31) })] }),
    );
    expect(result.ok).toBe(false);
  });

  it("trip_typeが不正な値なら失敗する", () => {
    const result = validateGuestMigrationPayload(
      emptyPayload({ shiori: [baseShiori({ trip_type: "concert" })] }),
    );
    expect(result.ok).toBe(false);
  });

  it("coverの形式が不正なら失敗する", () => {
    const result = validateGuestMigrationPayload(
      emptyPayload({ shiori: [baseShiori({ cover: "blue" })] }),
    );
    expect(result.ok).toBe(false);
  });

  it("shiori件数が上限を超えると失敗する", () => {
    const many = Array.from({ length: MAX_SHIORI_COUNT + 1 }, (_, i) =>
      baseShiori({ id: `${String(i).padStart(8, "0")}-1111-4111-8111-111111111111` }),
    );
    const result = validateGuestMigrationPayload(emptyPayload({ shiori: many }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((e) => e.includes("50件以内"))).toBe(true);
  });

  it("packing_items.shiori_idが存在しないshioriを指すと失敗する", () => {
    const result = validateGuestMigrationPayload(
      emptyPayload({
        shiori: [baseShiori()],
        packing_items: [
          {
            id: PACKING_ID,
            shiori_id: "99999999-9999-4999-8999-999999999999",
            label: "うちわ",
            is_checked: false,
            sort_order: 0,
          },
        ],
      }),
    );
    expect(result.ok).toBe(false);
  });

  it("todos.labelが31文字以上なら失敗する", () => {
    const result = validateGuestMigrationPayload(
      emptyPayload({
        shiori: [baseShiori()],
        todos: [
          {
            id: TODO_ID,
            shiori_id: SHIORI_ID,
            label: "あ".repeat(31),
            due_date: null,
            is_done: false,
            sort_order: 0,
          },
        ],
      }),
    );
    expect(result.ok).toBe(false);
  });

  it("itinerary_entries.day_dateがYYYY-MM-DD形式でなければ失敗する", () => {
    const result = validateGuestMigrationPayload(
      emptyPayload({
        shiori: [baseShiori()],
        itinerary_entries: [
          {
            id: ITINERARY_ID,
            shiori_id: SHIORI_ID,
            day_date: "2026/08/01",
            time: null,
            title: "開場",
            place_name: null,
            memo: null,
            sort_order: 0,
          },
        ],
      }),
    );
    expect(result.ok).toBe(false);
  });

  it("spots.nameが31文字以上なら失敗する", () => {
    const result = validateGuestMigrationPayload(
      emptyPayload({
        spots: [
          {
            id: SPOT_ID,
            name: "あ".repeat(31),
            description: null,
            category: null,
            area: null,
            created_at: "2026-07-01T00:00:00.000Z",
          },
        ],
      }),
    );
    expect(result.ok).toBe(false);
  });

  it("shiori_spots.spot_idがUGCスポット一覧に存在しないと失敗する", () => {
    const result = validateGuestMigrationPayload(
      emptyPayload({
        shiori: [baseShiori()],
        shiori_spots: [
          { shiori_id: SHIORI_ID, spot_id: "99999999-9999-4999-8999-999999999999", memo: null, is_visited: false },
        ],
      }),
    );
    expect(result.ok).toBe(false);
  });

  it("shiori_spots.spot_idが同梱シードスポットのIDなら成功し、referenced_seed_spotsに載る", () => {
    const result = validateGuestMigrationPayload(
      emptyPayload({
        shiori: [baseShiori()],
        shiori_spots: [
          { shiori_id: SHIORI_ID, spot_id: "seed-hinatazaka-slope", memo: null, is_visited: false },
        ],
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.shiori_spots).toHaveLength(1);
    expect(result.data.referenced_seed_spots.map((s) => s.id)).toContain("seed-hinatazaka-slope");
    expect(result.data.skipped_unknown_seed_spot_count).toBe(0);
  });

  it("shiori_spots.spot_idが同梱データに無いseed-IDなら、その1件だけをスキップし全体は成功する", () => {
    const result = validateGuestMigrationPayload(
      emptyPayload({
        shiori: [baseShiori()],
        shiori_spots: [
          { shiori_id: SHIORI_ID, spot_id: "seed-does-not-exist", memo: null, is_visited: false },
        ],
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.shiori_spots).toHaveLength(0);
    expect(result.data.skipped_unknown_seed_spot_count).toBe(1);
  });

  it("shiori_spotsが重複していれば失敗する", () => {
    const link = { shiori_id: SHIORI_ID, spot_id: SPOT_ID, memo: null, is_visited: false };
    const result = validateGuestMigrationPayload(
      emptyPayload({
        shiori: [baseShiori()],
        spots: [
          {
            id: SPOT_ID,
            name: "自由入力スポット",
            description: null,
            category: null,
            area: null,
            created_at: "2026-07-01T00:00:00.000Z",
          },
        ],
        shiori_spots: [link, link],
      }),
    );
    expect(result.ok).toBe(false);
  });
});
