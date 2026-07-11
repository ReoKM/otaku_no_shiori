import { describe, expect, it } from "vitest";
import {
  firstShioriFormErrorField,
  hasShioriFormErrors,
  validateShioriForm,
  type ShioriFormValues,
} from "./shiori-validation";

function baseValues(overrides: Partial<ShioriFormValues> = {}): ShioriFormValues {
  return {
    title: "○○ちゃん生誕祭 東京遠征",
    startDate: "2026-08-01",
    endDate: "2026-08-02",
    tripType: "live",
    purpose: "",
    ...overrides,
  };
}

describe("validateShioriForm", () => {
  it("すべて正しい値の場合はエラーが無い", () => {
    const errors = validateShioriForm(baseValues());
    expect(errors).toEqual({});
    expect(hasShioriFormErrors(errors)).toBe(false);
  });

  it("タイトル未入力の場合はエラー文言を返す", () => {
    const errors = validateShioriForm(baseValues({ title: "" }));
    expect(errors.title).toBe("タイトルを入れてください");
  });

  it("タイトルが空白のみの場合も未入力扱いにする", () => {
    const errors = validateShioriForm(baseValues({ title: "   " }));
    expect(errors.title).toBe("タイトルを入れてください");
  });

  it("タイトルが30文字を超える場合はエラー文言を返す", () => {
    const errors = validateShioriForm(baseValues({ title: "あ".repeat(31) }));
    expect(errors.title).toBe("タイトルは30文字以内で入力してください");
  });

  it("タイトルがちょうど30文字の場合はエラーにならない", () => {
    const errors = validateShioriForm(baseValues({ title: "あ".repeat(30) }));
    expect(errors.title).toBeUndefined();
  });

  it("前後スペース込みで30文字を超えてもトリム後30文字以内ならエラーにならない", () => {
    const errors = validateShioriForm(baseValues({ title: ` ${"あ".repeat(30)} ` }));
    expect(errors.title).toBeUndefined();
  });

  it("目的が前後スペース込みで50文字を超えてもトリム後50文字以内ならエラーにならない", () => {
    const errors = validateShioriForm(baseValues({ purpose: ` ${"あ".repeat(50)} ` }));
    expect(errors.purpose).toBeUndefined();
  });

  it("開始日未入力の場合はエラー文言を返す", () => {
    const errors = validateShioriForm(baseValues({ startDate: "" }));
    expect(errors.startDate).toBe("開始日を選択してください");
  });

  it("終了日未入力の場合はエラー文言を返す(開始日のみ入力)", () => {
    const errors = validateShioriForm(baseValues({ endDate: "" }));
    expect(errors.endDate).toBe("終了日を選択してください");
  });

  it("終了日が開始日より前の場合はエラー文言を返す", () => {
    const errors = validateShioriForm(
      baseValues({ startDate: "2026-08-02", endDate: "2026-08-01" }),
    );
    expect(errors.endDate).toBe("終了日は開始日以降の日付にしてください");
  });

  it("開始日と終了日が同じ場合はエラーにならない", () => {
    const errors = validateShioriForm(
      baseValues({ startDate: "2026-08-01", endDate: "2026-08-01" }),
    );
    expect(errors.endDate).toBeUndefined();
  });

  it("遠征タイプ未選択の場合はエラー文言を返す", () => {
    const errors = validateShioriForm(baseValues({ tripType: null }));
    expect(errors.tripType).toBe("遠征タイプを選んでください");
  });

  it("目的が50文字を超える場合はエラー文言を返す", () => {
    const errors = validateShioriForm(baseValues({ purpose: "あ".repeat(51) }));
    expect(errors.purpose).toBe("目的は50文字以内で入力してください");
  });

  it("目的が未入力(任意項目)でもエラーにならない", () => {
    const errors = validateShioriForm(baseValues({ purpose: "" }));
    expect(errors.purpose).toBeUndefined();
  });

  it("複数項目が同時にエラーになる", () => {
    const errors = validateShioriForm(
      baseValues({ title: "", startDate: "", endDate: "", tripType: null }),
    );
    expect(hasShioriFormErrors(errors)).toBe(true);
    expect(Object.keys(errors).sort()).toEqual(
      ["endDate", "startDate", "title", "tripType"].sort(),
    );
  });
});

describe("firstShioriFormErrorField", () => {
  it("表示順で最初のエラー項目を返す", () => {
    const errors = validateShioriForm(
      baseValues({ title: "", tripType: null }),
    );
    expect(firstShioriFormErrorField(errors)).toBe("title");
  });

  it("エラーが無い場合はnullを返す", () => {
    expect(firstShioriFormErrorField({})).toBeNull();
  });
});
