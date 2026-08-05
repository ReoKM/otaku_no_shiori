import { describe, expect, it } from "vitest";
import {
  BUDGET_AMOUNT_MAX,
  formatYen,
  isBudgetMemoTooLong,
  normalizeAmountInput,
  validateBudgetAmount,
  validateBudgetLabel,
} from "./budget-validation";

describe("validateBudgetLabel", () => {
  it("空文字の場合はエラー文言を返す", () => {
    expect(validateBudgetLabel("")).toBe("費目名を入れてください");
  });

  it("空白のみの場合もエラー文言を返す(trim後は未入力扱い)", () => {
    expect(validateBudgetLabel("   ")).toBe("費目名を入れてください");
  });

  it("有効な値の場合はnullを返す", () => {
    expect(validateBudgetLabel("交通費")).toBeNull();
  });

  it("前後に空白がある有効な値の場合もnullを返す", () => {
    expect(validateBudgetLabel("  交通費  ")).toBeNull();
  });
});

describe("validateBudgetAmount", () => {
  it("空文字の場合はエラー文言を返す", () => {
    expect(validateBudgetAmount("")).toBe("金額を数字で入れてください");
  });

  it("数字以外を含む場合はエラー文言を返す", () => {
    expect(validateBudgetAmount("12,800")).toBe("金額を数字で入れてください");
    expect(validateBudgetAmount("-100")).toBe("金額を数字で入れてください");
    expect(validateBudgetAmount("1.5")).toBe("金額を数字で入れてください");
  });

  it("上限(9,999,999)を超える場合は桁超過のエラー文言を返す", () => {
    expect(validateBudgetAmount(String(BUDGET_AMOUNT_MAX + 1))).toBe("金額は9,999,999円までです");
  });

  it("上限ちょうどの場合はnullを返す", () => {
    expect(validateBudgetAmount(String(BUDGET_AMOUNT_MAX))).toBeNull();
  });

  it("0円は有効な値としてnullを返す", () => {
    expect(validateBudgetAmount("0")).toBeNull();
  });

  it("有効な数字の場合はnullを返す", () => {
    expect(validateBudgetAmount("12800")).toBeNull();
  });
});

describe("isBudgetMemoTooLong", () => {
  it("200文字以内はfalse", () => {
    expect(isBudgetMemoTooLong("a".repeat(200))).toBe(false);
  });

  it("201文字以上はtrue", () => {
    expect(isBudgetMemoTooLong("a".repeat(201))).toBe(true);
  });
});

describe("normalizeAmountInput", () => {
  it("全角数字を半角に変換する", () => {
    expect(normalizeAmountInput("１２８００")).toBe("12800");
  });

  it("数字以外の文字を破棄する", () => {
    expect(normalizeAmountInput("¥12,800円")).toBe("12800");
  });

  it("半角数字と全角数字が混在していても正しく変換する", () => {
    expect(normalizeAmountInput("1２8００")).toBe("12800");
  });
});

describe("formatYen", () => {
  it("3桁カンマ区切りで¥を先頭に付ける", () => {
    expect(formatYen(12800)).toBe("¥12,800");
  });

  it("0円は¥0と表示する", () => {
    expect(formatYen(0)).toBe("¥0");
  });

  it("7桁でも桁区切りが正しい", () => {
    expect(formatYen(9999999)).toBe("¥9,999,999");
  });
});
