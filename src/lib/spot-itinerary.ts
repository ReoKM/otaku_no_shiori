/**
 * S3c「行きたい場所」の SpotRow「旅程に追加」ピッカーが確定した際の、
 * `itinerary_entries`作成用パラメータの組み立てロジック。
 * 参照: docs/design/screens/S3c_旅程スポット.md
 * 「SpotRow(旅程に追加ピッカー表示中)」保存成功時の挙動
 *
 * 「選択した日の`itinerary_entries`に`title=スポット名`・`place_name=スポット名`・
 * `time=入力値(任意)`・`memo=shiori_spots.memoがあれば流用`で末尾に追加する」をそのまま実装する。
 */
import type { CreateItineraryEntryInput } from "./guest-store";

export interface BuildAddToItineraryEntryParams {
  shioriId: string;
  dayDate: string;
  /** ピッカーで入力した時刻(任意)。未入力は空文字または null。 */
  time: string | null;
  spotName: string;
  /** `shiori_spots.memo`(設定時のみ流用)。 */
  spotMemo: string | null;
}

/** `createItineraryEntry`にそのまま渡せる入力を組み立てる。 */
export function buildAddToItineraryEntryInput(
  params: BuildAddToItineraryEntryParams,
): CreateItineraryEntryInput {
  const trimmedTime = params.time?.trim() ?? "";
  return {
    shiori_id: params.shioriId,
    day_date: params.dayDate,
    title: params.spotName,
    place_name: params.spotName,
    time: trimmedTime.length > 0 ? trimmedTime : null,
    memo: params.spotMemo ?? null,
  };
}
