import { describe, expect, it } from "vitest";
import {
  DEFAULT_COVER,
  buildColorCover,
  buildEmojiCover,
  parseCover,
  resolveCoverOrDefault,
} from "./cover";

describe("buildColorCover / buildEmojiCover", () => {
  it("色カバーは color: プレフィックス付きで生成する", () => {
    expect(buildColorCover("#F472B6")).toBe("color:#F472B6");
  });

  it("絵文字カバーは emoji: プレフィックス付きで生成する", () => {
    expect(buildEmojiCover("🎫")).toBe("emoji:🎫");
  });
});

describe("parseCover", () => {
  it("color: プレフィックスを解釈する", () => {
    expect(parseCover("color:#38BDF8")).toEqual({ type: "color", value: "#38BDF8" });
  });

  it("emoji: プレフィックスを解釈する", () => {
    expect(parseCover("emoji:🎤")).toEqual({ type: "emoji", value: "🎤" });
  });

  it("nullやundefinedはnullを返す", () => {
    expect(parseCover(null)).toBeNull();
    expect(parseCover(undefined)).toBeNull();
  });

  it("空文字はnullを返す", () => {
    expect(parseCover("")).toBeNull();
  });

  it("プレフィックスが無い不正な形式はnullを返す", () => {
    expect(parseCover("#F472B6")).toBeNull();
  });
});

describe("resolveCoverOrDefault", () => {
  it("値があればそのまま返す", () => {
    expect(resolveCoverOrDefault("emoji:⭐")).toBe("emoji:⭐");
  });

  it("nullの場合はデフォルトカバーを返す", () => {
    expect(resolveCoverOrDefault(null)).toBe(DEFAULT_COVER);
  });
});
