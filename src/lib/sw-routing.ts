/**
 * Service Worker(public/sw.js)のfetchイベントの振り分けロジック(F10 PWA)。
 *
 * public/sw.js はビルドを通らない素のJSでsrc/からimportできないため、
 * 同一ロジックの関数を sw.js 側にも定義している(二重管理)。
 * **このファイルを変更したら public/sw.js の decideFetchStrategy も必ず同じ内容に更新すること。**
 * 単体テストは sw-routing.test.ts にあり、この関数を正としてロジックを担保する。
 */

export type SwFetchStrategy = "passthrough" | "cache-first" | "network-first-page";

export interface SwFetchInput {
  /** HTTPメソッド(Request.method)。 */
  method: string;
  /** リクエストモード(Request.mode)。ページ遷移は "navigate"。 */
  mode: string;
  /** リクエスト先がSWと同一オリジンかどうか。 */
  sameOrigin: boolean;
  /** リクエストURLのパス名。 */
  pathname: string;
}

/**
 * fetchイベントの処理方針を決める。
 * - 非GET・クロスオリジンはSWで扱わずブラウザに素通しする(passthrough)
 * - ページナビゲーションは network-first(オフライン時のみキャッシュへフォールバック。
 *   Issue #61「オフライン時に白画面」の解消)
 * - `/_next/static/` はコンテンツハッシュ付きの不変アセットのため cache-first
 * - それ以外の同一オリジンGET(API等)は素通し(プリキャッシュ済みのmanifest/iconは
 *   sw.js側でキャッシュ照合されるためここでは分類しない)
 */
export function decideFetchStrategy(input: SwFetchInput): SwFetchStrategy {
  if (input.method !== "GET") {
    return "passthrough";
  }
  if (!input.sameOrigin) {
    return "passthrough";
  }
  if (input.mode === "navigate") {
    return "network-first-page";
  }
  if (input.pathname.startsWith("/_next/static/")) {
    return "cache-first";
  }
  return "passthrough";
}
