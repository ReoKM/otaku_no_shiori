import { describe, expect, it } from "vitest";
import { SPOT_MEMO_MAX_LENGTH, SPOT_NAME_MAX_LENGTH, validateSpotName } from "./spot-validation";

describe("validateSpotName", () => {
  it("空文字はエラー文言を返す", () => {
    expect(validateSpotName("")).toBe("スポット名を入れてください");
  });

  it("空白のみ(trim後に空)はエラー文言を返す", () => {
    expect(validateSpotName("   　  ")).toBe("スポット名を入れてください");
  });

  it("有効な名前はnullを返す", () => {
    expect(validateSpotName("○○神社")).toBeNull();
  });

  it("前後に空白があっても中身があればnullを返す", () => {
    expect(validateSpotName("  ○○神社  ")).toBeNull();
  });
});

describe("上限値", () => {
  it("スポット名は30文字", () => {
    expect(SPOT_NAME_MAX_LENGTH).toBe(30);
  });

  it("メモは100文字", () => {
    expect(SPOT_MEMO_MAX_LENGTH).toBe(100);
  });
});
