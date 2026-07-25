"use client";

import { useEffect, useState } from "react";

/** これ以上スクロールしたらヘッダーを縮める閾値(px)。 */
const COMPACT_THRESHOLD = 36;
/** 閾値付近での往復によるちらつきを防ぐための戻し閾値(px)。 */
const EXPAND_THRESHOLD = 12;

/**
 * 縦スクロール量に応じてヘッダーをコンパクト表示に切り替えるかを返す。
 * 参照: docs/design/screens/S3_しおり詳細.md「1. ヘッダー」
 *
 * 縮める/戻すで閾値を分けている(36px超で縮め、12px未満で戻す)。
 * 同一閾値だと境界上のわずかなスクロールで拡大縮小を繰り返しちらつくため。
 */
export function useCompactHeader(): boolean {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    function handleScroll() {
      const y = window.scrollY;
      setCompact((prev) => {
        if (prev) {
          return y >= EXPAND_THRESHOLD;
        }
        return y > COMPACT_THRESHOLD;
      });
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return compact;
}
