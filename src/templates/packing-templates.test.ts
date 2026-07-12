import { describe, expect, it } from "vitest";
import { getPackingTemplateItems, PACKING_TEMPLATES } from "./packing-templates";
import type { TripType } from "@/types/shiori";

const TRIP_TYPES: TripType[] = ["live", "seichi", "stage", "other"];

describe("PACKING_TEMPLATES", () => {
  it("4種類の遠征タイプすべてにテンプレートが定義されている", () => {
    expect(Object.keys(PACKING_TEMPLATES).sort()).toEqual([...TRIP_TYPES].sort());
  });

  it.each(TRIP_TYPES)("%s のテンプレートは空でなく、空文字/重複を含まない", (tripType) => {
    const items = getPackingTemplateItems(tripType);
    expect(items.length).toBeGreaterThan(0);
    for (const label of items) {
      expect(label.trim().length).toBeGreaterThan(0);
    }
    expect(new Set(items).size).toBe(items.length);
  });

  it("live(ライブ/イベント参戦)は仕様書(docs/01_service_spec.md F2)の例と一致する", () => {
    expect(getPackingTemplateItems("live")).toEqual([
      "チケット",
      "ペンライト",
      "うちわ",
      "推しタオル",
      "トレカケース",
      "モバイルバッテリー",
      "双眼鏡",
      "銀テ入れ",
    ]);
  });

  it("seichi(聖地巡礼)は仕様書(docs/01_service_spec.md F2)の例と一致する", () => {
    expect(getPackingTemplateItems("seichi")).toEqual([
      "モバイルバッテリー",
      "カメラ",
      "作品グッズ(撮影用)",
      "歩きやすい靴",
      "日焼け止め",
    ]);
  });
});
