import { describe, expect, it } from "vitest";

import { seedSpotDbId } from "./seed-spot-db-id";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("seedSpotDbId", () => {
  it("uuid v5形式の文字列を返す", () => {
    const id = seedSpotDbId("seed-hinatafes-001");
    expect(id).toMatch(UUID_RE);
  });

  it("同じ入力からは常に同じUUIDを返す(決定論的)", () => {
    const first = seedSpotDbId("seed-hinatafes-001");
    const second = seedSpotDbId("seed-hinatafes-001");
    expect(first).toBe(second);
  });

  it("異なる入力からは異なるUUIDを返す", () => {
    const a = seedSpotDbId("seed-hinatafes-001");
    const b = seedSpotDbId("seed-hinatafes-002");
    expect(a).not.toBe(b);
  });
});
