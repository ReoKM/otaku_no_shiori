import { describe, expect, it } from "vitest";
import { validateTodoLabel } from "./todo-validation";

describe("validateTodoLabel", () => {
  it("空文字の場合はエラー文言を返す", () => {
    expect(validateTodoLabel("")).toBe("TODOの名前を入れてください");
  });

  it("空白のみの場合もエラー文言を返す(trim後は未入力扱い)", () => {
    expect(validateTodoLabel("   ")).toBe("TODOの名前を入れてください");
  });

  it("全角スペースのみの場合もエラー文言を返す", () => {
    expect(validateTodoLabel("　　")).toBe("TODOの名前を入れてください");
  });

  it("有効な値の場合はnullを返す", () => {
    expect(validateTodoLabel("チケット当落確認")).toBeNull();
  });

  it("前後に空白がある有効な値の場合もnullを返す", () => {
    expect(validateTodoLabel("  チケット当落確認  ")).toBeNull();
  });
});
