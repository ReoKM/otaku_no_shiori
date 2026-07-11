import { describe, expect, it } from "vitest";
import { formatDateRange, formatYmd } from "./format-date";

describe("formatYmd", () => {
  it("ハイフン区切りをスラッシュ区切りに変換する", () => {
    expect(formatYmd("2026-08-01")).toBe("2026/08/01");
  });
});

describe("formatDateRange", () => {
  it("開始日と終了日が異なる場合は範囲表記にする", () => {
    expect(formatDateRange("2026-08-01", "2026-08-02")).toBe("2026/08/01〜2026/08/02");
  });

  it("開始日=終了日の場合は単一日付のみ表示する", () => {
    expect(formatDateRange("2026-08-01", "2026-08-01")).toBe("2026/08/01");
  });

  it("終了日のみ設定されている場合はその日付のみ返す", () => {
    expect(formatDateRange(null, "2026-08-02")).toBe("2026/08/02");
  });

  it("開始日のみ設定されている場合はその日付のみ返す", () => {
    expect(formatDateRange("2026-08-01", null)).toBe("2026/08/01");
  });

  it("両方未設定の場合はnullを返す", () => {
    expect(formatDateRange(null, null)).toBeNull();
  });
});
