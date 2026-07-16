import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_MAX_PHOTOS_PER_SHIORI,
  computeAcceptableCount,
  getMaxPhotosPerShiori,
} from "./photo-limit";

describe("getMaxPhotosPerShiori", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_MAX_PHOTOS_PER_SHIORI;
  });

  it("環境変数が未設定なら既定値20を返す", () => {
    expect(getMaxPhotosPerShiori()).toBe(DEFAULT_MAX_PHOTOS_PER_SHIORI);
    expect(getMaxPhotosPerShiori()).toBe(20);
  });

  it("環境変数が正の整数ならその値を返す", () => {
    process.env.NEXT_PUBLIC_MAX_PHOTOS_PER_SHIORI = "5";
    expect(getMaxPhotosPerShiori()).toBe(5);
  });

  it("環境変数が0以下なら既定値にフォールバックする", () => {
    process.env.NEXT_PUBLIC_MAX_PHOTOS_PER_SHIORI = "0";
    expect(getMaxPhotosPerShiori()).toBe(DEFAULT_MAX_PHOTOS_PER_SHIORI);
    process.env.NEXT_PUBLIC_MAX_PHOTOS_PER_SHIORI = "-3";
    expect(getMaxPhotosPerShiori()).toBe(DEFAULT_MAX_PHOTOS_PER_SHIORI);
  });

  it("環境変数が数値でないなら既定値にフォールバックする", () => {
    process.env.NEXT_PUBLIC_MAX_PHOTOS_PER_SHIORI = "abc";
    expect(getMaxPhotosPerShiori()).toBe(DEFAULT_MAX_PHOTOS_PER_SHIORI);
  });
});

describe("computeAcceptableCount", () => {
  it("残り枠内に収まる場合は全て受け入れる", () => {
    expect(computeAcceptableCount(10, 5, 20)).toEqual({ accepted: 5, rejected: 0 });
  });

  it("残り枠を超える場合は残り枠分のみ受け入れ、超過分をrejectedで返す", () => {
    expect(computeAcceptableCount(18, 5, 20)).toEqual({ accepted: 2, rejected: 3 });
  });

  it("既に上限に達している場合は0枚受け入れる", () => {
    expect(computeAcceptableCount(20, 3, 20)).toEqual({ accepted: 0, rejected: 3 });
  });

  it("currentUsedが上限を超えていても残り枠を負数にしない", () => {
    expect(computeAcceptableCount(25, 3, 20)).toEqual({ accepted: 0, rejected: 3 });
  });

  it("選択枚数が0なら受け入れ・超過とも0", () => {
    expect(computeAcceptableCount(0, 0, 20)).toEqual({ accepted: 0, rejected: 0 });
  });
});
