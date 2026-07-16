/**
 * F7 共有画像生成 Netlify Function。
 * 対応: docs/plans/2026-W29.md タスク#11(Issue #43)。
 *
 * しおりデータ(ShareImageProps相当のJSON)をPOSTで受け取り、
 * `src/templates/share-image/render.ts`の`renderShareImageToSvg`でSVGを生成し、
 * `@resvg/resvg-js`で1080×1920のPNGに変換して返す。
 *
 * 入力検証(型・長さ・必須・写真dataURL形式・ペイロードサイズ)は
 * `src/lib/share-image-validation.ts`の純粋関数で行う(このファイルではHTTPの
 * リクエスト/レスポンス変換のみを担当し、ユニットテストは検証ロジック側に寄せている)。
 *
 * Netlify Functions v2形式(Web標準のRequest/Responseを使うESM関数)。
 * `netlify.toml`の`[functions] external_node_modules = ["@resvg/resvg-js"]`により
 * ネイティブバイナリを含むこのパッケージがバンドル時に外部化される前提。
 *
 * ローカル動作確認手順(PR本文にも記載):
 *   1. `npx netlify-cli dev` を起動する
 *   2. `curl -X POST http://localhost:8888/api/share-image -H "Content-Type: application/json" \
 *        -d '{...ShareImageProps相当のJSON...}' -o /tmp/out.png`
 *   3. `/tmp/out.png` のファイルサイズが0より大きく、PNGマジックバイト(89 50 4E 47)で
 *      始まることを確認する
 *
 * S5画面(docs/design/screens/S5_共有画像プレビュー.md)は「生成中」「生成失敗」の状態を持つため、
 * エラー時は必ずJSON(`{ error: string }`)を返し、画面側が失敗を判定できるようにする。
 */
import { Resvg } from "@resvg/resvg-js";
import { renderShareImageToSvg } from "../../src/templates/share-image/render";
import {
  parseShareImageRequestBody,
  validatePayloadSize,
} from "../../src/lib/share-image-validation";

function jsonErrorResponse(status: number, message: string, details?: unknown): Response {
  return new Response(
    JSON.stringify({
      error: message,
      ...(details !== undefined ? { details } : {}),
    }),
    {
      status,
      headers: { "content-type": "application/json; charset=utf-8" },
    },
  );
}

async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return jsonErrorResponse(405, "POSTのみ許可されています");
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return jsonErrorResponse(400, "Content-Typeはapplication/jsonである必要があります");
  }

  // ボディをメモリへ読み込む前にContent-Lengthでサイズ超過を弾く(巨大ボディによるOOM対策)。
  // ヘッダーは偽装できるため、読み込み後の実サイズ検証も従来どおり行う(二段構え)。
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const declaredBytes = Number.parseInt(contentLength, 10);
    if (Number.isFinite(declaredBytes)) {
      const declaredSizeErrors = validatePayloadSize(declaredBytes);
      if (declaredSizeErrors.payload) {
        return jsonErrorResponse(400, "入力値が不正です", declaredSizeErrors);
      }
    }
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return jsonErrorResponse(400, "リクエストボディの読み込みに失敗しました");
  }

  const sizeErrors = validatePayloadSize(new TextEncoder().encode(rawBody).length);
  if (sizeErrors.payload) {
    return jsonErrorResponse(400, "入力値が不正です", sizeErrors);
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return jsonErrorResponse(400, "リクエストボディはJSONである必要があります");
  }

  const validation = parseShareImageRequestBody(parsedBody);
  if (!validation.ok) {
    return jsonErrorResponse(400, "入力値が不正です", validation.errors);
  }

  try {
    const svg = await renderShareImageToSvg(validation.data);
    const resvg = new Resvg(svg);
    const png = resvg.render().asPng();

    return new Response(new Uint8Array(png), {
      status: 200,
      headers: {
        "content-type": "image/png",
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    console.error("[share-image] 画像生成に失敗しました", error);
    return jsonErrorResponse(500, "画像の生成に失敗しました");
  }
}

export default handler;

export const config = {
  path: "/api/share-image",
};
