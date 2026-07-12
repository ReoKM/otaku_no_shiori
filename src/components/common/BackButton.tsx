"use client";

import { useRouter } from "next/navigation";

/**
 * ヘッダー左の戻るボタン(44×44pxタップ領域)。
 * S2/S3共通。既定は`router.back()`、`href`指定時はそちらへ遷移する。
 *
 * `fallbackHref`(S5で使用): `href`未指定時のみ有効。直接アクセス等でブラウザ履歴が
 * 無い場合(`window.history.length <= 1`)は`router.back()`の代わりにこちらへ遷移する。
 * 参照: docs/design/screens/S5_共有画像プレビュー.md「戻るボタン」
 * (`window.history.length`はブラウザ全体の履歴長のため厳密な「アプリ内履歴の有無」判定ではない
 * 簡易ヒューリスティックだが、仕様が求める「履歴が無い場合のフォールバック」を満たす仮置きの実装とする)
 */
export function BackButton({ href, fallbackHref }: { href?: string; fallbackHref?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label="戻る"
      onClick={() => {
        if (href) {
          router.push(href);
          return;
        }
        if (fallbackHref && typeof window !== "undefined" && window.history.length <= 1) {
          router.push(fallbackHref);
          return;
        }
        router.back();
      }}
      className="flex h-11 w-11 shrink-0 items-center justify-center text-neutral-900"
    >
      <span aria-hidden="true" className="text-xl leading-none">
        ‹
      </span>
    </button>
  );
}
