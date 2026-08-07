import { describe, expect, it } from "vitest";
import { decideFetchStrategy } from "./sw-routing";

function input(overrides: Partial<Parameters<typeof decideFetchStrategy>[0]> = {}) {
  return {
    method: "GET",
    mode: "no-cors",
    sameOrigin: true,
    pathname: "/",
    ...overrides,
  };
}

describe("decideFetchStrategy", () => {
  it("非GETは素通しする(POST等をキャッシュしない)", () => {
    expect(decideFetchStrategy(input({ method: "POST", mode: "navigate" }))).toBe("passthrough");
  });

  it("クロスオリジンは素通しする", () => {
    expect(decideFetchStrategy(input({ sameOrigin: false, mode: "navigate" }))).toBe("passthrough");
  });

  it("ページナビゲーションはstale-while-revalidate", () => {
    expect(decideFetchStrategy(input({ mode: "navigate", pathname: "/shiori/abc/packing" }))).toBe(
      "stale-while-revalidate-page",
    );
  });

  it("/_next/static/ 配下はcache-first", () => {
    expect(decideFetchStrategy(input({ pathname: "/_next/static/chunks/main.js" }))).toBe("cache-first");
  });

  it("その他の同一オリジンGET(非ナビゲーション)は素通しする", () => {
    expect(decideFetchStrategy(input({ pathname: "/api/health" }))).toBe("passthrough");
    expect(decideFetchStrategy(input({ pathname: "/_next/image" }))).toBe("passthrough");
  });
});
