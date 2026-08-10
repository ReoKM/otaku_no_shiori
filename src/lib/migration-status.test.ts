import { describe, expect, it } from "vitest";

import { calculateMigrationProgressPercent, formatMigrationProgressLabel } from "./migration-status";

describe("formatMigrationProgressLabel", () => {
  it("移行中の件数を文言一覧どおりの書式で組み立てる", () => {
    expect(formatMigrationProgressLabel(3, 5)).toBe("しおりを移行しています…(3/5件)");
  });

  it("0件移行済みでも書式が崩れない", () => {
    expect(formatMigrationProgressLabel(0, 5)).toBe("しおりを移行しています…(0/5件)");
  });
});

describe("calculateMigrationProgressPercent", () => {
  it("移行済み件数と合計件数からパーセンテージを計算する", () => {
    expect(calculateMigrationProgressPercent(3, 5)).toBe(60);
  });

  it("合計0件のときは0除算せず0を返す", () => {
    expect(calculateMigrationProgressPercent(0, 0)).toBe(0);
  });

  it("全件完了時は100を返す", () => {
    expect(calculateMigrationProgressPercent(5, 5)).toBe(100);
  });
});
