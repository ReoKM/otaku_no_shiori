/**
 * S5(共有画像プレビュー)向け、しおりデータ→`ShareImageProps`の組み立てロジック。
 * 参照: docs/design/screens/S5_共有画像プレビュー.md「前提」
 * 「画像に含む非写真コンテンツ…はしおりデータから自動抽出し、本画面上でユーザーが個別に選ぶUIは設けない」
 *
 * UIから独立した純粋関数として切り出し、ユニットテスト(share-image-props.test.ts)で担保する。
 * 件数・文字数の上限は`src/lib/share-image-validation.ts`(Netlify Function側の検証)の定数を
 * そのまま再利用し、画面側で先に安全な範囲へ切り詰めてから送信する(数値を重複定義しない)。
 */
import {
  MAX_HIGHLIGHT_ITEM_LENGTH,
  MAX_HIGHLIGHT_ITEMS,
  MAX_ITINERARY_DIGEST_ITEMS,
  MAX_ITINERARY_LABEL_LENGTH,
  MAX_ITINERARY_TEXT_LENGTH,
} from "@/lib/share-image-validation";
import { formatDueDate } from "@/lib/todo-sort";
import type { ItineraryDayInfo } from "@/lib/itinerary-days";
import type {
  ShareImageItineraryDigestItem,
  ShareImagePhoto,
  ShareImageProps,
  ShareImageTemplateId,
} from "@/templates/share-image/types";
import type { ItineraryEntry, TripType } from "@/types/shiori";

/** 旅程ダイジェストに含める件数(呼び出し側デフォルト。テンプレ側の表示上限は先頭3件)。 */
export const DEFAULT_ITINERARY_DIGEST_LIMIT = 5;

/** 持ち物・スポットのハイライトに含める件数(呼び出し側デフォルト。テンプレ側の表示上限は先頭4件)。 */
export const DEFAULT_HIGHLIGHT_ITEMS_LIMIT = 8;

/** しおりの日程が未設定の場合の`dateRangeLabel`表示(`ShareImageProps.dateRangeLabel`は必須文字列のため)。 */
export const UNSET_DATE_RANGE_LABEL = "日程未定";

/** 許可するphoto data URLのMIMEタイプ(`share-image-validation.ts`のパターンと同じ範囲)。 */
const SUPPORTED_PHOTO_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

/**
 * 日程文字列を整形する。`formatDateRange`(`src/lib/format-date.ts`)の結果が`null`
 * (日程未設定)の場合は`ShareImageProps.dateRangeLabel`が必須のため既定文言に差し替える。
 */
export function resolveDateRangeLabel(formattedDateRange: string | null): string {
  return formattedDateRange ?? UNSET_DATE_RANGE_LABEL;
}

/**
 * 旅程エントリー一覧から、共有画像に載せる旅程ダイジェストを組み立てる。
 * - 日付(`day_date`)昇順→`sort_order`昇順で並べ、先頭`limit`件のみ使う
 * - `label`: `dayList`から該当日の`dayIndex`が引ければ「{n}日目」、引けなければ日付表示(「8/15(土)」形式)。
 *   `time`が設定されていれば末尾に付与する(例: 「1日目 12:00」)
 * - `text`: `place_name`があれば「{place_name} {title}」、無ければ`title`のみ
 */
export function buildItineraryDigestItems(
  entries: ItineraryEntry[],
  dayList: ItineraryDayInfo[] | null,
  limit: number = DEFAULT_ITINERARY_DIGEST_LIMIT,
): ShareImageItineraryDigestItem[] {
  const dayIndexByDate = new Map((dayList ?? []).map((day) => [day.date, day.dayIndex]));

  const sorted = [...entries].sort((a, b) => {
    if (a.day_date !== b.day_date) {
      return a.day_date < b.day_date ? -1 : 1;
    }
    return a.sort_order - b.sort_order;
  });

  return sorted.slice(0, Math.min(limit, MAX_ITINERARY_DIGEST_ITEMS)).map((entry) => {
    const dayIndex = dayIndexByDate.get(entry.day_date);
    const dayLabel = dayIndex !== undefined ? `${dayIndex}日目` : formatDueDate(entry.day_date);
    const label = entry.time ? `${dayLabel} ${entry.time}` : dayLabel;
    const text = entry.place_name ? `${entry.place_name} ${entry.title}` : entry.title;
    return {
      label: truncate(label, MAX_ITINERARY_LABEL_LENGTH),
      text: truncate(text, MAX_ITINERARY_TEXT_LENGTH),
    };
  });
}

/**
 * 持ち物ラベル・行きたいスポット名から、共有画像に載せるハイライト一覧を組み立てる。
 * 持ち物→スポットの順に連結し、先頭`limit`件のみ使う(順序・件数とも仕様に指定が無いため仮置き。
 * 完了報告に明記)。
 */
export function buildHighlightItems(
  packingLabels: string[],
  spotNames: string[],
  limit: number = DEFAULT_HIGHLIGHT_ITEMS_LIMIT,
): string[] {
  return [...packingLabels, ...spotNames]
    .slice(0, Math.min(limit, MAX_HIGHLIGHT_ITEMS))
    .map((item) => truncate(item, MAX_HIGHLIGHT_ITEM_LENGTH));
}

/** data URLの先頭`data:image/xxx;base64,`部分からMIMEタイプが許可対象かを判定する。 */
export function isSupportedPhotoDataUrl(dataUrl: string): boolean {
  const match = /^data:(image\/[a-z]+);base64,/.exec(dataUrl);
  return match !== null && SUPPORTED_PHOTO_MIME_TYPES.has(match[1]);
}

/**
 * 写真Blob(IndexedDB `photos`ストア由来、常にクライアント側リサイズ済み)をdata URLへ変換する。
 * `FileReader`はNode環境(vitest)に無いため使わず、`Blob.arrayBuffer`+`Buffer`で変換する
 * (ブラウザ・Node両方で動作しユニットテスト可能にするため)。
 * 許可外のMIMEタイプ(Netlify Function側の検証と同じ範囲)の場合は`null`を返す。
 */
export async function blobToDataUrl(blob: Blob): Promise<string | null> {
  const mime = blob.type || "image/jpeg";
  if (!SUPPORTED_PHOTO_MIME_TYPES.has(mime)) {
    return null;
  }
  const buffer = await blob.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return `data:${mime};base64,${base64}`;
}

export interface BuildShareImagePropsInput {
  templateId: ShareImageTemplateId;
  title: string;
  formattedDateRange: string | null;
  tripType: TripType;
  itineraryEntries: ItineraryEntry[];
  dayList: ItineraryDayInfo[] | null;
  packingLabels: string[];
  spotNames: string[];
  /** 選択済み写真のdata URL(0〜3枚。事前に`blobToDataUrl`等で変換済みのもの)。 */
  photoDataUrls: string[];
}

/** `ShareImageProps`(Netlify Functionへ渡すリクエストボディ)を組み立てる。 */
export function buildShareImageProps(input: BuildShareImagePropsInput): ShareImageProps {
  const photos: ShareImagePhoto[] = input.photoDataUrls
    .filter(isSupportedPhotoDataUrl)
    .slice(0, 3)
    .map((dataUrl) => ({ dataUrl }));

  return {
    templateId: input.templateId,
    title: input.title,
    dateRangeLabel: resolveDateRangeLabel(input.formattedDateRange),
    tripType: input.tripType,
    itineraryDigest: buildItineraryDigestItems(input.itineraryEntries, input.dayList),
    highlightItems: buildHighlightItems(input.packingLabels, input.spotNames),
    photos,
  };
}
