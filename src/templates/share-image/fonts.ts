/**
 * 共有画像テンプレート用の日本語フォント読み込み。
 *
 * 方式(完了報告に明記): 「フェッチ方式」を採用。Netlify Function実行時にGoogle Fonts CSS2 API
 * (`https://fonts.googleapis.com/css2?family=Noto+Sans+JP&text=...`)へ、実際に描画する文字だけを
 * `text` パラメータで渡して動的サブセットを取得する。
 *   - リポジトリにフォント同梱しない(数MB〜のOTF/TTFをgit管理しないためリポジトリを軽量に保てる)
 *   - 描画する文字だけを都度サブセット取得するため転送量が小さい(1回の生成で数十KB程度)
 *   - Netlify Functionsは外向きHTTPS通信が可能なため、生成時(=ユーザーが共有画像を作る操作をした
 *     タイミングのみ)にフェッチすれば足りる。ページ表示のたびにはフェッチしない
 * 注意点(完了報告に明記): Google Fonts CSS2 APIはUser-Agentに応じて配信フォーマットを出し分ける。
 * satoriはTTF/OTF/WOFFのみサポートし、WOFF2は非対応のため、WOFF形式を返す旧世代ブラウザの
 * User-Agentを指定してリクエストする(satori/vercel og-image系ライブラリで広く使われる手法)。
 */

/** satori の `fonts` オプションに渡す1エントリ */
export interface SatoriFontEntry {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700;
  style: "normal";
}

/** WOFF形式を配信させるための旧ブラウザUser-Agent(satori/vercel-og系で使われる既知の手法) */
const LEGACY_USER_AGENT =
  "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/536.11 (KHTML, like Gecko) Chrome/20.0.1132.57 Safari/536.11";

const FONT_FAMILY = "Noto Sans JP";

function extractFontUrl(css: string): string {
  const match = css.match(/src:\s*url\(([^)]+)\)/);
  if (!match) {
    throw new Error("Google Fonts CSSからフォントURLを取得できませんでした");
  }
  return match[1];
}

async function fetchNotoSansJpWeight(weight: 400 | 700, text: string): Promise<ArrayBuffer> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    FONT_FAMILY,
  )}:wght@${weight}&text=${encodeURIComponent(text)}`;

  const cssResponse = await fetch(cssUrl, {
    headers: { "User-Agent": LEGACY_USER_AGENT },
  });
  if (!cssResponse.ok) {
    throw new Error(`Google Fonts CSSの取得に失敗しました(status=${cssResponse.status})`);
  }
  const css = await cssResponse.text();
  const fontUrl = extractFontUrl(css);

  const fontResponse = await fetch(fontUrl);
  if (!fontResponse.ok) {
    throw new Error(`フォントファイルの取得に失敗しました(status=${fontResponse.status})`);
  }
  return fontResponse.arrayBuffer();
}

/**
 * 描画に使う全文字列から重複を除いた文字集合を作る。
 * fallback文字(URL・記号・半角英数)も必ず含めて呼び出すこと(render.tsのcollectRenderTextを参照)。
 */
export function toUniqueCharacterText(text: string): string {
  return Array.from(new Set(Array.from(text))).join("");
}

/**
 * 指定した文字を確実にカバーするNoto Sans JP(Regular/Bold)を取得する。
 * ネットワーク取得に失敗した場合は例外を投げる(呼び出し元でリトライ・エラー表示を行う想定)。
 */
export async function loadShareImageFonts(text: string): Promise<SatoriFontEntry[]> {
  const subsetText = toUniqueCharacterText(text);
  const [regular, bold] = await Promise.all([
    fetchNotoSansJpWeight(400, subsetText),
    fetchNotoSansJpWeight(700, subsetText),
  ]);

  return [
    { name: FONT_FAMILY, data: regular, weight: 400, style: "normal" },
    { name: FONT_FAMILY, data: bold, weight: 700, style: "normal" },
  ];
}
