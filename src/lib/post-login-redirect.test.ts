import { describe, expect, it } from "vitest";

import { shouldAutoRedirectToHome } from "./post-login-redirect";

describe("shouldAutoRedirectToHome", () => {
  it("OAuthログイン直後(justLoggedIn=true)かつログイン確認済みならtrue", () => {
    expect(shouldAutoRedirectToHome(true, "loggedIn")).toBe(true);
  });

  it("justLoggedInが無い(既にログイン済みの状態で/settingsを手動で開いた)場合はfalse", () => {
    expect(shouldAutoRedirectToHome(false, "loggedIn")).toBe(false);
  });

  it("ログイン状態の判定が確定する前(loading)はfalse", () => {
    expect(shouldAutoRedirectToHome(true, "loading")).toBe(false);
  });

  it("ログインに失敗した(loggedOut)場合はfalse", () => {
    expect(shouldAutoRedirectToHome(true, "loggedOut")).toBe(false);
  });
});
