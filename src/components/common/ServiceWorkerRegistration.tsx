"use client";

import { useEffect } from "react";

/**
 * Service Worker(public/sw.js)の登録のみを行う不可視コンポーネント(F10 PWA)。
 * root layoutに配置する。開発時はキャッシュが邪魔になるため本番ビルドのみ登録する。
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }
    if (!("serviceWorker" in navigator)) {
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // 登録失敗(プライベートブラウジング等)はオンライン利用に影響しないため無視する
    });
  }, []);

  return null;
}
