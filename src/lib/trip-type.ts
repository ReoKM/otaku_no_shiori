/**
 * 遠征タイプ(`trip_type`)の選択肢・表示ラベル。
 * 参照: docs/design/screens/S2_しおり作成.md「3. FieldTripType」/ S1「遠征タイプバッジ」
 */
import type { TripType } from "@/types/shiori";

export interface TripTypeOption {
  value: TripType;
  label: string;
}

export const TRIP_TYPE_OPTIONS: readonly TripTypeOption[] = [
  { value: "live", label: "ライブ/イベント参戦" },
  { value: "seichi", label: "聖地巡礼" },
  { value: "stage", label: "舞台/観劇" },
  { value: "other", label: "その他" },
];

const TRIP_TYPE_LABEL_MAP: Record<TripType, string> = Object.fromEntries(
  TRIP_TYPE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<TripType, string>;

export function getTripTypeLabel(tripType: TripType): string {
  return TRIP_TYPE_LABEL_MAP[tripType];
}
