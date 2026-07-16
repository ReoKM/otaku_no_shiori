/**
 * F6(写真とログ)のクライアント側リサイズ処理。
 * 参照: docs/design/screens/S3d_ログ.md 前提「写真は…長辺1600pxを超える場合のみ…縮小」、
 * CLAUDE.md無料枠ガードレール(画像は長辺1600pxにリサイズ済みであること)。
 *
 * `computeResizedDimensions` は縦横比計算のみを行う純粋関数で、ユニットテスト対象。
 * `resizeImageFile` はCanvas/ImageBitmapなどブラウザ専用APIに依存するため、
 * このリポジトリのvitest設定(environment: "node")ではテスト不能(完了報告に明記)。
 */

export interface Dimensions {
  width: number;
  height: number;
}

/** 長辺が1600pxを超える場合のみ、アスペクト比を維持して長辺1600pxに縮小する。 */
export const DEFAULT_MAX_DIMENSION = 1600;

/** JPEG変換時の品質(仕様に数値指定が無いため0.85を仮置き)。 */
export const DEFAULT_JPEG_QUALITY = 0.85;

/**
 * 元の画像サイズから、リサイズ後のサイズを計算する。
 * 長辺(width/heightの大きい方)が`maxDimension`以下ならリサイズしない(そのまま返す)。
 * 超える場合は長辺を`maxDimension`に縮小し、アスペクト比を維持して短辺を比例計算する(四捨五入)。
 */
export function computeResizedDimensions(
  original: Dimensions,
  maxDimension: number = DEFAULT_MAX_DIMENSION,
): Dimensions {
  const { width, height } = original;
  const longestSide = Math.max(width, height);
  if (longestSide <= maxDimension) {
    return { width, height };
  }
  const scale = maxDimension / longestSide;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

/**
 * 画像ファイルをCanvasで長辺1600pxにリサイズし、JPEG Blobとして返す。
 * ブラウザ専用API(`createImageBitmap`/`HTMLCanvasElement`)に依存するためNode環境ではテストできない。
 */
export async function resizeImageFile(
  file: File | Blob,
  options: { maxDimension?: number; quality?: number } = {},
): Promise<Blob> {
  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const quality = options.quality ?? DEFAULT_JPEG_QUALITY;

  const bitmap = await createImageBitmap(file);
  try {
    const { width, height } = computeResizedDimensions(
      { width: bitmap.width, height: bitmap.height },
      maxDimension,
    );

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("2Dコンテキストの取得に失敗しました");
    }
    ctx.drawImage(bitmap, 0, 0, width, height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("画像の変換に失敗しました"));
          }
        },
        "image/jpeg",
        quality,
      );
    });
  } finally {
    bitmap.close();
  }
}
