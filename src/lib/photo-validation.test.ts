import { describe, expect, it } from "vitest";
import { PHOTO_CAPTION_MAX_LENGTH, sanitizeCaption } from "./photo-validation";

describe("sanitizeCaption", () => {
  it("前後の空白をtrimする", () => {
    expect(sanitizeCaption("  開演前の様子  ")).toBe("開演前の様子");
  });

  it("空文字ならnullを返す(任意項目のため必須エラーにはしない)", () => {
    expect(sanitizeCaption("")).toBeNull();
  });

  it("空白のみならnullを返す", () => {
    expect(sanitizeCaption("   ")).toBeNull();
  });

  it("50文字を超える分は切り詰める", () => {
    const longValue = "あ".repeat(60);
    const result = sanitizeCaption(longValue);
    expect(result).toHaveLength(PHOTO_CAPTION_MAX_LENGTH);
    expect(result).toBe("あ".repeat(50));
  });

  it("ちょうど50文字はそのまま返す", () => {
    const value = "あ".repeat(50);
    expect(sanitizeCaption(value)).toBe(value);
  });

  it("上限は50文字である", () => {
    expect(PHOTO_CAPTION_MAX_LENGTH).toBe(50);
  });
});
