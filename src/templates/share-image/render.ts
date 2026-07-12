/**
 * F7 共有画像テンプレート → SVG文字列 変換。
 * satoriでのSVG生成までがこのモジュールの責務。SVG→PNG化(resvg)はNetlify Function側
 * (W2週次計画タスク11・backend-dev)の責務であり、ここでは行わない。
 */
import satori from "satori";
import { getTripTypeLabel } from "@/lib/trip-type";
import { loadShareImageFonts, type SatoriFontEntry } from "./fonts";
import { NigiyakaTemplate } from "./nigiyaka";
import { SimpleTemplate } from "./simple";
import {
  DEFAULT_SERVICE_NAME,
  DEFAULT_SERVICE_URL,
  SHARE_IMAGE_HEIGHT,
  SHARE_IMAGE_WIDTH,
  type ShareImageProps,
} from "./types";

/**
 * テンプレート内に固定で出てくる文字(見出し・ロゴマーク・プレースホルダー等)。
 * フォントサブセット取得時にこれらも含めないと、固定文言がフォント欠落で表示崩れする。
 */
const STATIC_TEMPLATE_TEXT = [
  "旅程ダイジェスト",
  "持ち物・行きたい場所",
  "持ち物・スポット",
  "旅程はこれから登録します",
  "栞",
  DEFAULT_SERVICE_NAME,
  DEFAULT_SERVICE_URL,
  // 半角英数・記号・コロン・スラッシュ等(URL・日付表記で使われる可能性がある文字を広めに含める)
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.:/?-_=&()~〜() 、。・",
  // 省略記号(U+2026)。LogoUrlBar(common.tsx)のURL表示に textOverflow: "ellipsis" を指定しており、
  // satoriがはみ出したテキストをこの1文字に置き換えて描画する。フォントサブセットに含めないと
  // その置換後のグリフだけがtofu(notdef)になり、URL末尾が壊れて見える(Issue #60)
  "…",
].join("");

/**
 * 実際に描画される全テキストを収集する(純粋関数)。
 * `loadShareImageFonts`にこの戻り値を渡すことで、描画に使う文字だけを漏れなくフォントサブセットへ含める。
 * デフォルト値(serviceName/serviceUrl省略時)や省略記号などの「Propsの値ではなく描画時に
 * 追加で必要になる文字」を取りこぼさないことが本関数の責務(Issue #60の再発防止のためexport)。
 */
export function collectRenderText(props: ShareImageProps): string {
  const itineraryText = props.itineraryDigest.map((item) => `${item.label}${item.text}`).join("");
  const highlightText = props.highlightItems.join("");
  return [
    STATIC_TEMPLATE_TEXT,
    props.title,
    props.dateRangeLabel,
    getTripTypeLabel(props.tripType),
    itineraryText,
    highlightText,
    props.serviceName ?? "",
    props.serviceUrl ?? "",
  ].join("");
}

export interface RenderShareImageOptions {
  /**
   * satoriに渡すフォント一式。省略時は`loadShareImageFonts`でGoogle Fontsから動的取得する。
   * テスト・オフライン環境ではこのオプションでフォントデータを注入できる。
   */
  fonts?: SatoriFontEntry[];
}

/**
 * Props+テンプレ種別からsatoriでSVG文字列を生成する。
 * 呼び出し側(Netlify Function)はこのSVG文字列をresvgでPNG化する。
 */
export async function renderShareImageToSvg(
  props: ShareImageProps,
  options: RenderShareImageOptions = {},
): Promise<string> {
  const element =
    props.templateId === "nigiyaka" ? NigiyakaTemplate(props) : SimpleTemplate(props);

  const fonts = options.fonts ?? (await loadShareImageFonts(collectRenderText(props)));

  return satori(element, {
    width: SHARE_IMAGE_WIDTH,
    height: SHARE_IMAGE_HEIGHT,
    fonts,
  });
}
