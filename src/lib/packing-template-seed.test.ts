import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createShiori, listPackingItemsByShiori } from "./guest-store";
import {
  isPackingTemplateSeeded,
  markPackingTemplateSeeded,
  seedPackingTemplate,
} from "./packing-template-seed";
import { getPackingTemplateItems } from "../templates/packing-templates";

/** テスト用の最小限のlocalStorageスタブ(メモリ実装)。 */
function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  } as Storage;
}

describe("packing-template-seed: フラグ管理", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createMemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("初期状態は未投入(false)", () => {
    expect(isPackingTemplateSeeded("shiori-1")).toBe(false);
  });

  it("markPackingTemplateSeeded後はtrueになる", () => {
    markPackingTemplateSeeded("shiori-1");
    expect(isPackingTemplateSeeded("shiori-1")).toBe(true);
  });

  it("しおりごとに独立してフラグを管理する", () => {
    markPackingTemplateSeeded("shiori-1");
    expect(isPackingTemplateSeeded("shiori-1")).toBe(true);
    expect(isPackingTemplateSeeded("shiori-2")).toBe(false);
  });

  it("localStorageが使えない環境では常にfalseを返す(例外にしない)", () => {
    vi.unstubAllGlobals();
    expect(() => isPackingTemplateSeeded("shiori-1")).not.toThrow();
    expect(isPackingTemplateSeeded("shiori-1")).toBe(false);
    expect(() => markPackingTemplateSeeded("shiori-1")).not.toThrow();
  });
});

describe("seedPackingTemplate", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createMemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("trip_typeに対応するテンプレート一式をsort_order 0番から追加し、投入済みフラグを立てる", async () => {
    const shiori = await createShiori({ title: "ライブ遠征", trip_type: "live" });

    const created = await seedPackingTemplate(shiori.id, "live");

    const expectedLabels = getPackingTemplateItems("live");
    expect(created.map((item) => item.label)).toEqual([...expectedLabels]);
    expect(created.map((item) => item.sort_order)).toEqual(expectedLabels.map((_, i) => i));
    expect(created.every((item) => item.is_checked === false)).toBe(true);

    const listed = await listPackingItemsByShiori(shiori.id);
    expect(listed.map((item) => item.label)).toEqual([...expectedLabels]);

    expect(isPackingTemplateSeeded(shiori.id)).toBe(true);
  });

  it("遠征タイプが変わればテンプレート内容も変わる(seichi)", async () => {
    const shiori = await createShiori({ title: "聖地巡礼", trip_type: "seichi" });

    const created = await seedPackingTemplate(shiori.id, "seichi");

    expect(created.map((item) => item.label)).toEqual([...getPackingTemplateItems("seichi")]);
  });
});
