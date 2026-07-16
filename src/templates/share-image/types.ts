/**
 * F7 共有画像生成のテンプレートに渡すProps定義。
 * 参照: docs/01_service_spec.md F7(画像に含む内容)、docs/04_growth_monetization.md(UGC流入動線)。
 *
 * 日付・遠征タイプラベルなどの整形はテンプレの責務にせず、呼び出し側(Netlify Function/S5画面)で
 * 表示用文字列に整形してから渡す(テンプレ側はロケール・書式ロジックを持たない)。
 */
import type { TripType } from "@/types/shiori";

/** MVPで用意するテンプレート種別(F7: シンプル/にぎやかの2種) */
export type ShareImageTemplateId = "simple" | "nigiyaka";

/** 旅程ダイジェストの1件(旅程タブの内容から抜粋して渡す) */
export interface ShareImageItineraryDigestItem {
  /** 例: "1日目 12:00" のような短いラベル。時刻が無い場合は日付のみでもよい */
  label: string;
  /** 例: "◯◯ホール 開場"(エントリーのタイトル+場所名を呼び出し側で結合したもの) */
  text: string;
}

/** 共有画像に載せる写真1枚分。F6でクライアント側リサイズ済み(長辺1600px以下)のdata URLを渡す前提 */
export interface ShareImagePhoto {
  dataUrl: string;
}

export interface ShareImageProps {
  /** どちらのテンプレートで描画するか */
  templateId: ShareImageTemplateId;
  /** しおりタイトル。30文字程度の長文でもレイアウトが崩れないことをテンプレ側で保証する */
  title: string;
  /** 表示用に整形済みの日程文字列。例: "2026/08/01 - 2026/08/03" */
  dateRangeLabel: string;
  /** 遠征タイプ(F1) */
  tripType: TripType;
  /** 旅程ダイジェスト。テンプレ側は先頭3件までしか表示しないため、呼び出し側は多くても4〜5件程度渡せば十分 */
  itineraryDigest: ShareImageItineraryDigestItem[];
  /** 持ち物・スポットの一部。テンプレ側は先頭4件までしか表示しない */
  highlightItems: string[];
  /** 写真0〜3枚。4枚目以降はテンプレ側で無視する */
  photos: ShareImagePhoto[];
  /** サービス名の表示テキスト。省略時は `DEFAULT_SERVICE_NAME` */
  serviceName?: string;
  /** 画像内に必ず表示するURL。省略時は `DEFAULT_SERVICE_URL`(?via=share付き) */
  serviceUrl?: string;
}

/** サービス名のデフォルト表示テキスト */
export const DEFAULT_SERVICE_NAME = "オタクのしおり";

/**
 * 画像内URLのデフォルト値。
 * 本番ドメイン未確定のため `otaku-no-shiori.netlify.app` を仮置き(オーナー承認後にNetlify Function側で
 * 本番ドメインへ差し替え可能。Propsの`serviceUrl`で上書きできる)。
 * `?via=share` は流入計測用(docs/04_growth_monetization.md / docs/03_tech_stack.md)。
 */
export const DEFAULT_SERVICE_URL = "https://otaku-no-shiori.netlify.app/?via=share";

/** 共有画像の固定サイズ(F7: X縦長表示・Instagramストーリー対応) */
export const SHARE_IMAGE_WIDTH = 1080;
export const SHARE_IMAGE_HEIGHT = 1920;
