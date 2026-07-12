/**
 * share-image-validation.ts のユニットテスト。
 * Netlify Function本体(netlify/functions/share-image.mts)はローカルのfunctions serve実行で
 * 動作確認する(作業ログ参照)。ここでは純粋関数の入力検証ロジックのみを対象にする。
 */
import { describe, expect, it } from "vitest";
import {
  MAX_DATE_RANGE_LABEL_LENGTH,
  MAX_HIGHLIGHT_ITEMS,
  MAX_ITINERARY_DIGEST_ITEMS,
  MAX_PAYLOAD_BYTES,
  MAX_PHOTOS,
  MAX_TITLE_LENGTH,
  parseShareImageRequestBody,
  validatePayloadSize,
} from "./share-image-validation";

const VALID_PHOTO_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

const VALID_BODY = {
  templateId: "simple",
  title: "初めての遠征のしおり",
  dateRangeLabel: "2026/08/01 - 2026/08/03",
  tripType: "live",
  itineraryDigest: [{ label: "1日目 12:00", text: "会場入り" }],
  highlightItems: ["ペンライト", "うちわ"],
  photos: [{ dataUrl: VALID_PHOTO_DATA_URL }],
};

describe("validatePayloadSize", () => {
  it("上限以下ならエラーなし", () => {
    expect(validatePayloadSize(MAX_PAYLOAD_BYTES)).toEqual({});
  });

  it("上限を超えるとpayloadエラーを返す", () => {
    const errors = validatePayloadSize(MAX_PAYLOAD_BYTES + 1);
    expect(errors.payload).toBeDefined();
  });
});

describe("parseShareImageRequestBody", () => {
  it("正しい入力はok:trueでShareImagePropsを返す", () => {
    const result = parseShareImageRequestBody(VALID_BODY);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.templateId).toBe("simple");
      expect(result.data.title).toBe(VALID_BODY.title);
      expect(result.data.photos).toHaveLength(1);
    }
  });

  it("必須項目(title等)を省略したフルの最小構成でも通る(itineraryDigest/highlightItems/photosは空配列扱い)", () => {
    const result = parseShareImageRequestBody({
      templateId: "nigiyaka",
      title: "タイトル",
      dateRangeLabel: "2026/08/01",
      tripType: "seichi",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.itineraryDigest).toEqual([]);
      expect(result.data.highlightItems).toEqual([]);
      expect(result.data.photos).toEqual([]);
    }
  });

  it("bodyがオブジェクトでない場合はエラー", () => {
    const result = parseShareImageRequestBody("not-an-object");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.payload).toBeDefined();
    }
  });

  it("bodyがnullの場合はエラー", () => {
    const result = parseShareImageRequestBody(null);
    expect(result.ok).toBe(false);
  });

  it("bodyが配列の場合はエラー", () => {
    const result = parseShareImageRequestBody([VALID_BODY]);
    expect(result.ok).toBe(false);
  });

  it("templateIdが不正な値だとエラー", () => {
    const result = parseShareImageRequestBody({ ...VALID_BODY, templateId: "unknown" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.templateId).toBeDefined();
    }
  });

  it("templateIdが欠落しているとエラー", () => {
    const rest: Record<string, unknown> = { ...VALID_BODY };
    delete rest.templateId;
    const result = parseShareImageRequestBody(rest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.templateId).toBeDefined();
    }
  });

  it("titleが空文字だとエラー", () => {
    const result = parseShareImageRequestBody({ ...VALID_BODY, title: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.title).toBeDefined();
    }
  });

  it("titleが上限文字数を超えるとエラー", () => {
    const result = parseShareImageRequestBody({
      ...VALID_BODY,
      title: "あ".repeat(MAX_TITLE_LENGTH + 1),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.title).toBeDefined();
    }
  });

  it("titleが数値など文字列以外だとエラー", () => {
    const result = parseShareImageRequestBody({ ...VALID_BODY, title: 12345 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.title).toBeDefined();
    }
  });

  it("dateRangeLabelが上限文字数を超えるとエラー", () => {
    const result = parseShareImageRequestBody({
      ...VALID_BODY,
      dateRangeLabel: "あ".repeat(MAX_DATE_RANGE_LABEL_LENGTH + 1),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.dateRangeLabel).toBeDefined();
    }
  });

  it("tripTypeが不正な値だとエラー", () => {
    const result = parseShareImageRequestBody({ ...VALID_BODY, tripType: "invalid" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.tripType).toBeDefined();
    }
  });

  it("itineraryDigestが配列でない場合はエラー", () => {
    const result = parseShareImageRequestBody({ ...VALID_BODY, itineraryDigest: "not-array" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.itineraryDigest).toBeDefined();
    }
  });

  it("itineraryDigestが上限件数を超えるとエラー", () => {
    const items = Array.from({ length: MAX_ITINERARY_DIGEST_ITEMS + 1 }, (_, i) => ({
      label: `${i}日目`,
      text: "テスト",
    }));
    const result = parseShareImageRequestBody({ ...VALID_BODY, itineraryDigest: items });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.itineraryDigest).toBeDefined();
    }
  });

  it("itineraryDigestの要素にlabel/textが無いとエラー", () => {
    const result = parseShareImageRequestBody({
      ...VALID_BODY,
      itineraryDigest: [{ label: "1日目" }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.itineraryDigest).toBeDefined();
    }
  });

  it("highlightItemsが上限件数を超えるとエラー", () => {
    const items = Array.from({ length: MAX_HIGHLIGHT_ITEMS + 1 }, (_, i) => `item${i}`);
    const result = parseShareImageRequestBody({ ...VALID_BODY, highlightItems: items });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.highlightItems).toBeDefined();
    }
  });

  it("highlightItemsの要素が文字列以外だとエラー", () => {
    const result = parseShareImageRequestBody({ ...VALID_BODY, highlightItems: [123] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.highlightItems).toBeDefined();
    }
  });

  it("photosが上限枚数(3枚)を超えるとエラー", () => {
    const photos = Array.from({ length: MAX_PHOTOS + 1 }, () => ({ dataUrl: VALID_PHOTO_DATA_URL }));
    const result = parseShareImageRequestBody({ ...VALID_BODY, photos });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.photos).toBeDefined();
    }
  });

  it("photosのdataUrlがdata URL形式でないとエラー", () => {
    const result = parseShareImageRequestBody({
      ...VALID_BODY,
      photos: [{ dataUrl: "https://example.com/photo.png" }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.photos).toBeDefined();
    }
  });

  it("photosのdataUrlが許可外MIME(image/gif)だとエラー", () => {
    const result = parseShareImageRequestBody({
      ...VALID_BODY,
      photos: [{ dataUrl: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==" }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.photos).toBeDefined();
    }
  });

  it("photosのdataUrlがSVG(スクリプト実行リスクのある形式)だとエラー", () => {
    const result = parseShareImageRequestBody({
      ...VALID_BODY,
      photos: [{ dataUrl: "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=" }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.photos).toBeDefined();
    }
  });

  it("serviceName/serviceUrlは任意項目で、指定すれば検証される", () => {
    const okResult = parseShareImageRequestBody({
      ...VALID_BODY,
      serviceName: "テストサービス",
      serviceUrl: "https://example.com/?via=share",
    });
    expect(okResult.ok).toBe(true);
    if (okResult.ok) {
      expect(okResult.data.serviceName).toBe("テストサービス");
      expect(okResult.data.serviceUrl).toBe("https://example.com/?via=share");
    }

    const ngResult = parseShareImageRequestBody({ ...VALID_BODY, serviceUrl: "not-a-url" });
    expect(ngResult.ok).toBe(false);
    if (!ngResult.ok) {
      expect(ngResult.errors.serviceUrl).toBeDefined();
    }
  });

  it("複数項目が同時に不正な場合、該当する全項目のエラーを返す", () => {
    const result = parseShareImageRequestBody({
      templateId: "invalid",
      title: "",
      dateRangeLabel: "",
      tripType: "invalid",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.templateId).toBeDefined();
      expect(result.errors.title).toBeDefined();
      expect(result.errors.dateRangeLabel).toBeDefined();
      expect(result.errors.tripType).toBeDefined();
    }
  });
});
