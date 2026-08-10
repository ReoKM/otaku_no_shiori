import { describe, expect, it } from "vitest";

import { getProviderLoginLabel, resolveOAuthProvider } from "./auth-provider";

describe("resolveOAuthProvider", () => {
  it("app_metadata.providerがtwitterなら'twitter'を返す", () => {
    expect(resolveOAuthProvider({ app_metadata: { provider: "twitter" } })).toBe("twitter");
  });

  it("app_metadata.providerがgoogleなら'google'を返す", () => {
    expect(resolveOAuthProvider({ app_metadata: { provider: "google" } })).toBe("google");
  });

  it("未対応のプロバイダ値はnullを返す", () => {
    expect(resolveOAuthProvider({ app_metadata: { provider: "email" } })).toBeNull();
  });

  it("app_metadataが無い場合はnullを返す", () => {
    expect(resolveOAuthProvider({ app_metadata: {} })).toBeNull();
  });

  it("userがnull/undefinedならnullを返す(未ログイン)", () => {
    expect(resolveOAuthProvider(null)).toBeNull();
    expect(resolveOAuthProvider(undefined)).toBeNull();
  });
});

describe("getProviderLoginLabel", () => {
  it("twitterは「Xでログイン中」を返す", () => {
    expect(getProviderLoginLabel("twitter")).toBe("Xでログイン中");
  });

  it("googleは「Googleでログイン中」を返す", () => {
    expect(getProviderLoginLabel("google")).toBe("Googleでログイン中");
  });
});
