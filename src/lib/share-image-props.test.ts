import { describe, expect, it } from "vitest";
import {
  buildHighlightItems,
  buildItineraryDigestItems,
  buildShareImageProps,
  blobToDataUrl,
  isSupportedPhotoDataUrl,
  resolveDateRangeLabel,
} from "./share-image-props";
import type { ItineraryDayInfo } from "@/lib/itinerary-days";
import type { ItineraryEntry } from "@/types/shiori";

function entry(overrides: Partial<ItineraryEntry> & Pick<ItineraryEntry, "id" | "day_date">): ItineraryEntry {
  return {
    shiori_id: "shiori-1",
    time: null,
    title: `title-${overrides.id}`,
    place_name: null,
    memo: null,
    sort_order: 0,
    ...overrides,
  };
}

const dayList: ItineraryDayInfo[] = [
  { date: "2026-08-01", dayIndex: 1, label: "1日目 8/1(土)" },
  { date: "2026-08-02", dayIndex: 2, label: "2日目 8/2(日)" },
];

describe("resolveDateRangeLabel", () => {
  it("整形済み日程文字列があればそのまま返す", () => {
    expect(resolveDateRangeLabel("2026/08/01〜2026/08/02")).toBe("2026/08/01〜2026/08/02");
  });

  it("nullの場合は既定文言「日程未定」を返す", () => {
    expect(resolveDateRangeLabel(null)).toBe("日程未定");
  });
});

describe("buildItineraryDigestItems", () => {
  it("day_date昇順→sort_order昇順で並べ、dayListからdayIndexを解決する", () => {
    const entries = [
      entry({ id: "b", day_date: "2026-08-01", sort_order: 1, title: "開場", place_name: "◯◯ホール" }),
      entry({ id: "a", day_date: "2026-08-01", sort_order: 0, title: "集合" }),
      entry({ id: "c", day_date: "2026-08-02", sort_order: 0, title: "解散", time: "18:00" }),
    ];

    const result = buildItineraryDigestItems(entries, dayList);

    expect(result).toEqual([
      { label: "1日目", text: "集合" },
      { label: "1日目", text: "◯◯ホール 開場" },
      { label: "2日目 18:00", text: "解散" },
    ]);
  });

  it("dayListに該当日が無い場合は日付表示にフォールバックする", () => {
    const entries = [entry({ id: "a", day_date: "2026-09-01", sort_order: 0, title: "予定" })];

    const result = buildItineraryDigestItems(entries, null);

    expect(result).toEqual([{ label: "9/1(火)", text: "予定" }]);
  });

  it("limitで件数を絞れる", () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      entry({ id: `e${i}`, day_date: "2026-08-01", sort_order: i, title: `entry-${i}` }),
    );

    expect(buildItineraryDigestItems(entries, dayList, 3)).toHaveLength(3);
  });

  it("上限(MAX_ITINERARY_DIGEST_ITEMS=10)を超えるlimitを渡しても10件までしか返さない", () => {
    const entries = Array.from({ length: 20 }, (_, i) =>
      entry({ id: `e${i}`, day_date: "2026-08-01", sort_order: i, title: `entry-${i}` }),
    );

    expect(buildItineraryDigestItems(entries, dayList, 999)).toHaveLength(10);
  });
});

describe("buildHighlightItems", () => {
  it("持ち物→スポットの順に連結する", () => {
    expect(buildHighlightItems(["カメラ", "モバイルバッテリー"], ["◯◯神社"])).toEqual([
      "カメラ",
      "モバイルバッテリー",
      "◯◯神社",
    ]);
  });

  it("limitで件数を絞れる", () => {
    expect(buildHighlightItems(["a", "b", "c"], ["d", "e"], 2)).toEqual(["a", "b"]);
  });
});

describe("isSupportedPhotoDataUrl", () => {
  it("jpeg/png/webpのdata URLを許可する", () => {
    expect(isSupportedPhotoDataUrl("data:image/jpeg;base64,AAAA")).toBe(true);
    expect(isSupportedPhotoDataUrl("data:image/png;base64,AAAA")).toBe(true);
    expect(isSupportedPhotoDataUrl("data:image/webp;base64,AAAA")).toBe(true);
  });

  it("許可外のMIMEタイプ・不正な形式は拒否する", () => {
    expect(isSupportedPhotoDataUrl("data:image/gif;base64,AAAA")).toBe(false);
    expect(isSupportedPhotoDataUrl("data:text/plain;base64,AAAA")).toBe(false);
    expect(isSupportedPhotoDataUrl("not-a-data-url")).toBe(false);
  });
});

describe("blobToDataUrl", () => {
  it("Blobをdata URLに変換する", async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: "image/jpeg" });
    const result = await blobToDataUrl(blob);
    expect(result).toMatch(/^data:image\/jpeg;base64,/);
  });

  it("許可外のMIMEタイプはnullを返す", async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: "image/gif" });
    expect(await blobToDataUrl(blob)).toBeNull();
  });
});

describe("buildShareImageProps", () => {
  it("入力からShareImagePropsを組み立てる(写真は許可MIMEのみ・最大3枚)", () => {
    const entries = [entry({ id: "a", day_date: "2026-08-01", sort_order: 0, title: "集合" })];

    const result = buildShareImageProps({
      templateId: "simple",
      title: "しおりタイトル",
      formattedDateRange: "2026/08/01",
      tripType: "live",
      itineraryEntries: entries,
      dayList,
      packingLabels: ["カメラ"],
      spotNames: ["◯◯神社"],
      photoDataUrls: [
        "data:image/jpeg;base64,AAAA",
        "data:image/png;base64,BBBB",
        "data:image/webp;base64,CCCC",
        "data:image/jpeg;base64,DDDD",
        "data:image/gif;base64,EEEE",
      ],
    });

    expect(result.templateId).toBe("simple");
    expect(result.title).toBe("しおりタイトル");
    expect(result.dateRangeLabel).toBe("2026/08/01");
    expect(result.tripType).toBe("live");
    expect(result.itineraryDigest).toEqual([{ label: "1日目", text: "集合" }]);
    expect(result.highlightItems).toEqual(["カメラ", "◯◯神社"]);
    expect(result.photos).toEqual([
      { dataUrl: "data:image/jpeg;base64,AAAA" },
      { dataUrl: "data:image/png;base64,BBBB" },
      { dataUrl: "data:image/webp;base64,CCCC" },
    ]);
  });
});
