"use client";

import { useRouter } from "next/navigation";

/**
 * ヘッダー左の戻るボタン(44×44pxタップ領域)。
 * S2/S3共通。既定は`router.back()`、`href`指定時はそちらへ遷移する。
 */
export function BackButton({ href }: { href?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label="戻る"
      onClick={() => {
        if (href) {
          router.push(href);
        } else {
          router.back();
        }
      }}
      className="flex h-11 w-11 shrink-0 items-center justify-center text-neutral-900"
    >
      <span aria-hidden="true" className="text-xl leading-none">
        ‹
      </span>
    </button>
  );
}
