"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** 追従ボタンの高さ相当。追加行がこの分だけ画面下に隠れていたら追従ボタンを出す。 */
const BOTTOM_MARGIN_PX = 24;

export interface UseFollowFabResult {
  /** 追従ボタンを表示するか。 */
  visible: boolean;
  /** リスト末尾の「追加」行に付けるref。 */
  anchorRef: (el: HTMLElement | null) => void;
}

/**
 * リスト末尾の「追加」行が画面外にある間だけ追従ボタンを出すためのフック。
 * 参照: docs/design/screens/S3a_持ち物.md「追従ボタン」
 *
 * 追加行が画面内に見えている時は追従ボタンを出さない(同じ操作の導線を二重に置かない)。
 * `enabled`がfalseの間は常に非表示にする(空状態・並べ替えモード中など)。
 */
export function useFollowFab(enabled: boolean): UseFollowFabResult {
  const [visible, setVisible] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  const check = useCallback(() => {
    const el = elementRef.current;
    if (!enabled || !el) {
      setVisible(false);
      return;
    }
    const rect = el.getBoundingClientRect();
    setVisible(rect.top > window.innerHeight - BOTTOM_MARGIN_PX);
  }, [enabled]);

  const anchorRef = useCallback(
    (el: HTMLElement | null) => {
      elementRef.current = el;
      check();
    },
    [check],
  );

  useEffect(() => {
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [check]);

  return { visible, anchorRef };
}
