import { describe, expect, it } from "vitest";
import { buildAddToItineraryEntryInput } from "./spot-itinerary";

describe("buildAddToItineraryEntryInput", () => {
  it("title/place_nameはスポット名を流用する", () => {
    const input = buildAddToItineraryEntryInput({
      shioriId: "shiori-1",
      dayDate: "2026-08-01",
      time: null,
      spotName: "日向坂",
      spotMemo: null,
    });
    expect(input.title).toBe("日向坂");
    expect(input.place_name).toBe("日向坂");
    expect(input.shiori_id).toBe("shiori-1");
    expect(input.day_date).toBe("2026-08-01");
  });

  it("時刻未入力(null)はtime=nullになる", () => {
    const input = buildAddToItineraryEntryInput({
      shioriId: "shiori-1",
      dayDate: "2026-08-01",
      time: null,
      spotName: "スポット",
      spotMemo: null,
    });
    expect(input.time).toBeNull();
  });

  it("時刻の空文字はtime=nullになる", () => {
    const input = buildAddToItineraryEntryInput({
      shioriId: "shiori-1",
      dayDate: "2026-08-01",
      time: "",
      spotName: "スポット",
      spotMemo: null,
    });
    expect(input.time).toBeNull();
  });

  it("時刻を入力した場合はそのまま反映する", () => {
    const input = buildAddToItineraryEntryInput({
      shioriId: "shiori-1",
      dayDate: "2026-08-01",
      time: "10:00",
      spotName: "スポット",
      spotMemo: null,
    });
    expect(input.time).toBe("10:00");
  });

  it("shiori_spots.memoがあればmemoに流用する", () => {
    const input = buildAddToItineraryEntryInput({
      shioriId: "shiori-1",
      dayDate: "2026-08-01",
      time: null,
      spotName: "スポット",
      spotMemo: "開演前に寄る",
    });
    expect(input.memo).toBe("開演前に寄る");
  });

  it("memoが無い場合はnull", () => {
    const input = buildAddToItineraryEntryInput({
      shioriId: "shiori-1",
      dayDate: "2026-08-01",
      time: null,
      spotName: "スポット",
      spotMemo: null,
    });
    expect(input.memo).toBeNull();
  });
});
