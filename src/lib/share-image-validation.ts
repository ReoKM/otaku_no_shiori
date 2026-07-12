/**
 * F7 共有画像生成Netlify Function(`netlify/functions/share-image.mts`)向けの入力検証ロジック。
 * `src/templates/share-image/types.ts`の`ShareImageProps`と同じ形状のJSONをリクエストボディとして
 * 受け取る前提で、型・長さ・必須項目・写真dataURL形式を検証する(CLAUDE.md「セキュリティ最低ライン」)。
 *
 * ネットワークやリクエスト固有の処理(JSON.parseやレスポンス生成)は行わない純粋関数のみを置く。
 * Function本体からはこのモジュールの`parseShareImageRequestBody`を呼び出す。
 *
 * 文字数上限・件数上限は仕様(docs/01_service_spec.md F7)に具体的な数値の指定が無いため、
 * テンプレート側の表示上限(旅程3件・持ち物等4件・写真3枚、`types.ts`のコメント参照)に
 * 余裕を持たせた値を仮置きした(完了報告に明記)。
 */
import type {
  ShareImageItineraryDigestItem,
  ShareImagePhoto,
  ShareImageProps,
  ShareImageTemplateId,
} from "@/templates/share-image/types";
import type { TripType } from "@/types/shiori";

/** リクエストボディ全体の最大バイト数(写真のdata URLを含む) */
export const MAX_PAYLOAD_BYTES = 5 * 1024 * 1024;

export const MAX_TITLE_LENGTH = 200;
export const MAX_DATE_RANGE_LABEL_LENGTH = 100;

export const MAX_ITINERARY_DIGEST_ITEMS = 10;
export const MAX_ITINERARY_LABEL_LENGTH = 50;
export const MAX_ITINERARY_TEXT_LENGTH = 100;

export const MAX_HIGHLIGHT_ITEMS = 20;
export const MAX_HIGHLIGHT_ITEM_LENGTH = 50;

/** F7「写真(任意1〜3枚)」のとおり最大3枚 */
export const MAX_PHOTOS = 3;

export const MAX_SERVICE_NAME_LENGTH = 50;
export const MAX_SERVICE_URL_LENGTH = 300;

const TEMPLATE_IDS: readonly ShareImageTemplateId[] = ["simple", "nigiyaka"];
const TRIP_TYPES: readonly TripType[] = ["live", "seichi", "stage", "other"];

/** `data:image/(jpeg|png|webp);base64,...` のみ許可する(セキュリティ最低ライン: MIME制限) */
const PHOTO_DATA_URL_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;

export interface ShareImageValidationErrors {
  payload?: string;
  templateId?: string;
  title?: string;
  dateRangeLabel?: string;
  tripType?: string;
  itineraryDigest?: string;
  highlightItems?: string;
  photos?: string;
  serviceName?: string;
  serviceUrl?: string;
}

export type ShareImageValidationResult =
  | { ok: true; data: ShareImageProps }
  | { ok: false; errors: ShareImageValidationErrors };

export function hasShareImageValidationErrors(errors: ShareImageValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/** リクエストボディの生バイト数を検証する。Function側でJSON.parse前に呼ぶ想定 */
export function validatePayloadSize(byteLength: number): ShareImageValidationErrors {
  if (byteLength > MAX_PAYLOAD_BYTES) {
    return { payload: `リクエストサイズが上限(${MAX_PAYLOAD_BYTES}バイト)を超えています` };
  }
  return {};
}

function validateItineraryDigest(
  value: unknown,
  errors: ShareImageValidationErrors,
): ShareImageItineraryDigestItem[] {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    errors.itineraryDigest = "itineraryDigestは配列である必要があります";
    return [];
  }
  if (value.length > MAX_ITINERARY_DIGEST_ITEMS) {
    errors.itineraryDigest = `itineraryDigestは${MAX_ITINERARY_DIGEST_ITEMS}件以内にしてください`;
    return [];
  }
  const items: ShareImageItineraryDigestItem[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) {
      errors.itineraryDigest = "itineraryDigestの各要素はオブジェクトである必要があります";
      return [];
    }
    const record = item as Record<string, unknown>;
    if (!isNonEmptyString(record.label) || record.label.length > MAX_ITINERARY_LABEL_LENGTH) {
      errors.itineraryDigest = `itineraryDigest.labelは1〜${MAX_ITINERARY_LABEL_LENGTH}文字の文字列である必要があります`;
      return [];
    }
    if (!isNonEmptyString(record.text) || record.text.length > MAX_ITINERARY_TEXT_LENGTH) {
      errors.itineraryDigest = `itineraryDigest.textは1〜${MAX_ITINERARY_TEXT_LENGTH}文字の文字列である必要があります`;
      return [];
    }
    items.push({ label: record.label, text: record.text });
  }
  return items;
}

function validateHighlightItems(value: unknown, errors: ShareImageValidationErrors): string[] {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    errors.highlightItems = "highlightItemsは配列である必要があります";
    return [];
  }
  if (value.length > MAX_HIGHLIGHT_ITEMS) {
    errors.highlightItems = `highlightItemsは${MAX_HIGHLIGHT_ITEMS}件以内にしてください`;
    return [];
  }
  const items: string[] = [];
  for (const item of value) {
    if (!isNonEmptyString(item) || item.length > MAX_HIGHLIGHT_ITEM_LENGTH) {
      errors.highlightItems = `highlightItemsの各要素は1〜${MAX_HIGHLIGHT_ITEM_LENGTH}文字の文字列である必要があります`;
      return [];
    }
    items.push(item);
  }
  return items;
}

function validatePhotos(value: unknown, errors: ShareImageValidationErrors): ShareImagePhoto[] {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    errors.photos = "photosは配列である必要があります";
    return [];
  }
  if (value.length > MAX_PHOTOS) {
    errors.photos = `photosは${MAX_PHOTOS}枚以内にしてください`;
    return [];
  }
  const items: ShareImagePhoto[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) {
      errors.photos = "photosの各要素はオブジェクトである必要があります";
      return [];
    }
    const record = item as Record<string, unknown>;
    if (!isNonEmptyString(record.dataUrl) || !PHOTO_DATA_URL_PATTERN.test(record.dataUrl)) {
      errors.photos = "photos.dataUrlはimage/jpeg・png・webpのbase64 data URLである必要があります";
      return [];
    }
    items.push({ dataUrl: record.dataUrl });
  }
  return items;
}

/**
 * リクエストボディ(JSON.parse済みの値)を検証し、`ShareImageProps`相当のデータに変換する。
 * 不正な値が1つでもあれば `ok: false` と項目ごとのエラーメッセージを返す(400応答に使う)。
 */
export function parseShareImageRequestBody(body: unknown): ShareImageValidationResult {
  const errors: ShareImageValidationErrors = {};

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, errors: { payload: "リクエストボディはJSONオブジェクトである必要があります" } };
  }
  const record = body as Record<string, unknown>;

  let templateId: ShareImageTemplateId = "simple";
  if (
    !isNonEmptyString(record.templateId) ||
    !TEMPLATE_IDS.includes(record.templateId as ShareImageTemplateId)
  ) {
    errors.templateId = `templateIdは${TEMPLATE_IDS.join("または")}のいずれかが必須です`;
  } else {
    templateId = record.templateId as ShareImageTemplateId;
  }

  let title = "";
  if (!isNonEmptyString(record.title)) {
    errors.title = "titleは1文字以上の文字列が必須です";
  } else if (record.title.length > MAX_TITLE_LENGTH) {
    errors.title = `titleは${MAX_TITLE_LENGTH}文字以内にしてください`;
  } else {
    title = record.title;
  }

  let dateRangeLabel = "";
  if (!isNonEmptyString(record.dateRangeLabel)) {
    errors.dateRangeLabel = "dateRangeLabelは1文字以上の文字列が必須です";
  } else if (record.dateRangeLabel.length > MAX_DATE_RANGE_LABEL_LENGTH) {
    errors.dateRangeLabel = `dateRangeLabelは${MAX_DATE_RANGE_LABEL_LENGTH}文字以内にしてください`;
  } else {
    dateRangeLabel = record.dateRangeLabel;
  }

  let tripType: TripType = "other";
  if (!isNonEmptyString(record.tripType) || !TRIP_TYPES.includes(record.tripType as TripType)) {
    errors.tripType = `tripTypeは${TRIP_TYPES.join("/")}のいずれかが必須です`;
  } else {
    tripType = record.tripType as TripType;
  }

  const itineraryDigest = validateItineraryDigest(record.itineraryDigest, errors);
  const highlightItems = validateHighlightItems(record.highlightItems, errors);
  const photos = validatePhotos(record.photos, errors);

  let serviceName: string | undefined;
  if (record.serviceName !== undefined) {
    if (!isNonEmptyString(record.serviceName) || record.serviceName.length > MAX_SERVICE_NAME_LENGTH) {
      errors.serviceName = `serviceNameは1〜${MAX_SERVICE_NAME_LENGTH}文字の文字列である必要があります`;
    } else {
      serviceName = record.serviceName;
    }
  }

  let serviceUrl: string | undefined;
  if (record.serviceUrl !== undefined) {
    if (!isNonEmptyString(record.serviceUrl) || record.serviceUrl.length > MAX_SERVICE_URL_LENGTH) {
      errors.serviceUrl = `serviceUrlは1〜${MAX_SERVICE_URL_LENGTH}文字の文字列である必要があります`;
    } else {
      try {
        new URL(record.serviceUrl);
        serviceUrl = record.serviceUrl;
      } catch {
        errors.serviceUrl = "serviceUrlは有効なURLである必要があります";
      }
    }
  }

  if (hasShareImageValidationErrors(errors)) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      templateId,
      title,
      dateRangeLabel,
      tripType,
      itineraryDigest,
      highlightItems,
      photos,
      ...(serviceName !== undefined ? { serviceName } : {}),
      ...(serviceUrl !== undefined ? { serviceUrl } : {}),
    },
  };
}
