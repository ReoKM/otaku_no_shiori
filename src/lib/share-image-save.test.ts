import { describe, expect, it } from "vitest";
import { canUseWebShareFiles, isShareAbortError } from "./share-image-save";

function fakeFile(): File {
  return new File([new Uint8Array([1, 2, 3])], "share.png", { type: "image/png" });
}

describe("canUseWebShareFiles", () => {
  it("navigatorが無い場合は使えない", () => {
    expect(canUseWebShareFiles(undefined, fakeFile())).toBe(false);
  });

  it("shareが無い場合は使えない", () => {
    expect(canUseWebShareFiles({}, fakeFile())).toBe(false);
  });

  it("shareのみあり canShareが無い場合は使える(仕様どおり)", () => {
    expect(canUseWebShareFiles({ share: async () => {} }, fakeFile())).toBe(true);
  });

  it("canShareがtrueを返す場合は使える", () => {
    expect(
      canUseWebShareFiles({ share: async () => {}, canShare: () => true }, fakeFile()),
    ).toBe(true);
  });

  it("canShareがfalseを返す場合は使えない(PC版ブラウザ等)", () => {
    expect(
      canUseWebShareFiles({ share: async () => {}, canShare: () => false }, fakeFile()),
    ).toBe(false);
  });

  it("canShareが例外を投げる場合は使えない側にフォールバックする", () => {
    expect(
      canUseWebShareFiles(
        {
          share: async () => {},
          canShare: () => {
            throw new Error("boom");
          },
        },
        fakeFile(),
      ),
    ).toBe(false);
  });
});

describe("isShareAbortError", () => {
  it("AbortErrorはtrue", () => {
    const error = new Error("cancelled");
    error.name = "AbortError";
    expect(isShareAbortError(error)).toBe(true);
  });

  it("それ以外のErrorはfalse", () => {
    expect(isShareAbortError(new Error("network"))).toBe(false);
  });

  it("Error以外の値はfalse", () => {
    expect(isShareAbortError("plain string")).toBe(false);
  });
});
