/**
 * F2 持ち物テンプレート定数(遠征タイプ別、1種ずつ)。
 * 参照: docs/01_service_spec.md「F2. 持ち物リスト」/ docs/design/screens/S3a_持ち物.md
 *
 * live(ライブ/イベント参戦)・seichi(聖地巡礼)は仕様書に記載の例をそのまま使う。
 * stage(舞台/観劇)・other(その他)は仕様書に例が無いため仮置き(完了報告に明記)。
 */
import type { TripType } from "@/types/shiori";

export const PACKING_TEMPLATES: Readonly<Record<TripType, readonly string[]>> = {
  live: [
    "チケット",
    "ペンライト",
    "うちわ",
    "推しタオル",
    "トレカケース",
    "モバイルバッテリー",
    "双眼鏡",
    "銀テ入れ",
  ],
  seichi: ["モバイルバッテリー", "カメラ", "作品グッズ(撮影用)", "歩きやすい靴", "日焼け止め"],
  // 仮置き: 観劇で定番とされる持ち物(仕様書に例の記載が無いため)
  stage: ["チケット", "オペラグラス", "モバイルバッテリー", "パンフレット代の現金", "防寒具"],
  // 仮置き: 遠征全般で汎用的な持ち物(仕様書に例の記載が無いため)
  other: ["モバイルバッテリー", "現金", "身分証", "常備薬", "折りたたみ傘"],
};

/** 指定した遠征タイプのテンプレート項目一覧(表示順)を返す。 */
export function getPackingTemplateItems(tripType: TripType): readonly string[] {
  return PACKING_TEMPLATES[tripType];
}
