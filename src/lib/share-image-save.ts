/**
 * S5「SaveButton(保存ボタン、機能分岐)」の判定ロジック。
 * 参照: docs/design/screens/S5_共有画像プレビュー.md「SaveButton」
 *
 * `navigator.share`/`navigator.canShare`の実際の呼び出しはブラウザ専用APIのため、
 * ここでは「与えられたnavigator相当のオブジェクトからどちらの保存方式を使うべきか」を
 * 判定する部分だけを純粋関数として切り出し、ユニットテスト(share-image-save.test.ts)で担保する。
 */

/** テスト・呼び出し側で使う、Web Share APIの必要最小限の型(実ブラウザの`Navigator`のサブセット)。 */
export interface ShareCapableNavigator {
  share?: (data: { files?: File[] }) => Promise<void>;
  canShare?: (data?: { files?: File[] }) => boolean;
}

/**
 * S5仕様「SaveButton」の分岐条件どおり、ファイル付きWeb Share APIが使えるかを判定する。
 * - `navigator.share`が存在しない場合は使えない
 * - `navigator.canShare`が無い場合は使えるとみなす(仕様「`navigator.canShare`が無いか…」)
 * - `navigator.canShare`がある場合は`canShare({ files: [file] })`の結果に従う
 * - `canShare`呼び出しが例外を投げる環境(仕様に無い異常系)は「使えない」側にフォールバックする
 */
export function canUseWebShareFiles(nav: ShareCapableNavigator | undefined, file: File): boolean {
  if (!nav || typeof nav.share !== "function") {
    return false;
  }
  if (typeof nav.canShare !== "function") {
    return true;
  }
  try {
    return nav.canShare({ files: [file] });
  } catch {
    return false;
  }
}

/**
 * Web Share APIのキャンセル(`AbortError`)かどうかを判定する。
 * 参照: S5仕様「ユーザーが共有シートをキャンセルすると`AbortError`でrejectされるため…
 * キャンセル時は状態を変えない」
 */
export function isShareAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}
