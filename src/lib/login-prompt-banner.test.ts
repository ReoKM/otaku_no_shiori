import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  consumeShioriJustCreated,
  dismissLoginPromptBannerForever,
  isLoginPromptBannerDismissed,
  markShioriJustCreated,
} from "./login-prompt-banner";

/** テスト環境(node)にはwindowが無いため、storageだけを持つ最小のwindowを注入する。 */
function makeStorage(store: Map<string, string>, throwOnAccess = false) {
  return {
    getItem: (key: string) => {
      if (throwOnAccess) {
        throw new Error("storage is disabled");
      }
      return store.get(key) ?? null;
    },
    setItem: (key: string, value: string) => {
      if (throwOnAccess) {
        throw new Error("storage is disabled");
      }
      store.set(key, value);
    },
    removeItem: (key: string) => {
      if (throwOnAccess) {
        throw new Error("storage is disabled");
      }
      store.delete(key);
    },
  };
}

function stubWindow(
  sessionStore: Map<string, string>,
  localStore: Map<string, string>,
  throwOnAccess = false,
) {
  vi.stubGlobal("window", {
    sessionStorage: makeStorage(sessionStore, throwOnAccess),
    localStorage: makeStorage(localStore, throwOnAccess),
  });
}

describe("markShioriJustCreated / consumeShioriJustCreated", () => {
  let sessionStore: Map<string, string>;
  let localStore: Map<string, string>;

  beforeEach(() => {
    sessionStore = new Map();
    localStore = new Map();
    stubWindow(sessionStore, localStore);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("markした直後はconsumeがtrueを返す", () => {
    markShioriJustCreated("shiori-1");
    expect(consumeShioriJustCreated("shiori-1")).toBe(true);
  });

  it("consumeは一度読んだら消費し、2回目以降はfalseを返す(再訪問で再表示しない)", () => {
    markShioriJustCreated("shiori-1");
    expect(consumeShioriJustCreated("shiori-1")).toBe(true);
    expect(consumeShioriJustCreated("shiori-1")).toBe(false);
  });

  it("markしていないしおりはfalseを返す", () => {
    expect(consumeShioriJustCreated("shiori-unknown")).toBe(false);
  });

  it("しおりごとに独立している", () => {
    markShioriJustCreated("shiori-1");
    expect(consumeShioriJustCreated("shiori-2")).toBe(false);
    expect(consumeShioriJustCreated("shiori-1")).toBe(true);
  });

  it("storageが使えない環境でも例外を投げずfalse扱いになる", () => {
    stubWindow(sessionStore, localStore, true);
    expect(() => markShioriJustCreated("shiori-1")).not.toThrow();
    expect(consumeShioriJustCreated("shiori-1")).toBe(false);
  });

  it("windowが無い環境(SSR)ではfalseを返し例外も投げない", () => {
    vi.unstubAllGlobals();
    expect(() => markShioriJustCreated("shiori-1")).not.toThrow();
    expect(consumeShioriJustCreated("shiori-1")).toBe(false);
  });
});

describe("isLoginPromptBannerDismissed / dismissLoginPromptBannerForever", () => {
  let sessionStore: Map<string, string>;
  let localStore: Map<string, string>;

  beforeEach(() => {
    sessionStore = new Map();
    localStore = new Map();
    stubWindow(sessionStore, localStore);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("初期状態はfalse(未クローズ)", () => {
    expect(isLoginPromptBannerDismissed()).toBe(false);
  });

  it("dismissを呼ぶとtrueになる", () => {
    dismissLoginPromptBannerForever();
    expect(isLoginPromptBannerDismissed()).toBe(true);
  });

  it("一度dismissしたら、別のしおりのjust-createdフラグがあっても既読フラグ自体は独立して残る", () => {
    markShioriJustCreated("shiori-1");
    dismissLoginPromptBannerForever();
    expect(isLoginPromptBannerDismissed()).toBe(true);
    // just-createdの消費自体は引き続き機能する(表示するかどうかは呼び出し側がdismissedを見て判断)
    expect(consumeShioriJustCreated("shiori-1")).toBe(true);
  });

  it("storageが使えない環境でも例外を投げずfalse扱いになる", () => {
    stubWindow(sessionStore, localStore, true);
    expect(() => dismissLoginPromptBannerForever()).not.toThrow();
    expect(isLoginPromptBannerDismissed()).toBe(false);
  });

  it("windowが無い環境(SSR)ではfalseを返し例外も投げない", () => {
    vi.unstubAllGlobals();
    expect(() => dismissLoginPromptBannerForever()).not.toThrow();
    expect(isLoginPromptBannerDismissed()).toBe(false);
  });
});
