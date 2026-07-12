import { describe, expect, it } from "vitest";
import { validateItineraryTitle } from "./itinerary-validation";

describe("validateItineraryTitle", () => {
  it("空でないタイトルはnullを返す(問題なし)", () => {
    expect(validateItineraryTitle("会場入り")).toBeNull();
  });

  it("空文字はエラー文言を返す", () => {
    expect(validateItineraryTitle("")).toBe("予定のタイトルを入れてください");
  });

  it("半角スペースのみはtrim後空としてエラーになる", () => {
    expect(validateItineraryTitle("   ")).toBe("予定のタイトルを入れてください");
  });

  it("全角スペースのみはtrim後空としてエラーになる", () => {
    expect(validateItineraryTitle("　　")).toBe("予定のタイトルを入れてください");
  });

  it("前後に空白を含むタイトルは問題なし判定になる", () => {
    expect(validateItineraryTitle("  会場入り  ")).toBeNull();
  });
});
