import { describe, expect, it } from "vitest";
import { PACKING_LABEL_REQUIRED_ERROR, validatePackingLabel } from "./packing-validation";

describe("validatePackingLabel", () => {
  it("空文字はエラー文言を返す", () => {
    expect(validatePackingLabel("")).toBe(PACKING_LABEL_REQUIRED_ERROR);
  });

  it("半角スペースのみはエラー文言を返す", () => {
    expect(validatePackingLabel("   ")).toBe(PACKING_LABEL_REQUIRED_ERROR);
  });

  it("全角スペースのみはエラー文言を返す", () => {
    expect(validatePackingLabel("　　")).toBe(PACKING_LABEL_REQUIRED_ERROR);
  });

  it("前後に空白を含む有効な文字列はエラーにならない", () => {
    expect(validatePackingLabel("  モバイルバッテリー  ")).toBeNull();
  });

  it("通常の文字列はエラーにならない", () => {
    expect(validatePackingLabel("ペンライト")).toBeNull();
  });
});
