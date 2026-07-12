import { describe, expect, it } from "vitest";
import { buildGoogleMapsSearchUrl } from "./googleMapsUrl";

describe("buildGoogleMapsSearchUrl", () => {
  it("URLエンコードした場所名でGoogleマップ検索URLを作る", () => {
    expect(buildGoogleMapsSearchUrl("東京ドーム")).toBe(
      "https://www.google.com/maps/search/?api=1&query=%E6%9D%B1%E4%BA%AC%E3%83%89%E3%83%BC%E3%83%A0",
    );
  });

  it("記号を含む場所名も安全にエンコードする", () => {
    expect(buildGoogleMapsSearchUrl("A&B café")).toBe(
      "https://www.google.com/maps/search/?api=1&query=A%26B%20caf%C3%A9",
    );
  });
});
