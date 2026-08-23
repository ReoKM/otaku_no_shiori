"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * `beforeinstallprompt`イベント(Chrome/Edge/Android等)の型。
 * 標準のDOM libには含まれないため最小限だけ定義する。
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * ホーム画面から起動済み(インストール済み)かどうかを判定する。
 * 通常ブラウザは`display-mode: standalone`のmedia query、iOS Safariは
 * `navigator.standalone`(非標準プロパティ)で判定する。
 */
function computeIsStandalone(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const iosStandalone = (navigator as { standalone?: boolean }).standalone === true;
  return window.matchMedia("(display-mode: standalone)").matches || iosStandalone;
}

/** iOS判定(iPadOS 13+はUAがMacと区別できないためタッチ対応で補う)。マウント後に変わらない前提。 */
function computeIsIos(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  const ua = navigator.userAgent;
  const isIphoneOrIpod = /iphone|ipod/i.test(ua);
  const isIpad = /ipad/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return isIphoneOrIpod || isIpad;
}

/**
 * F10 PWAの「アプリをインストール」導線用フック。
 *
 * ブラウザによって対応状況が分かれるため、3つの状態を返す:
 * - `canInstall`: `beforeinstallprompt`に対応するブラウザ(Chrome/Edge/Android等)で、
 *   ネイティブのインストールダイアログを`promptInstall()`で呼び出せる状態
 * - `isIos`: iOS Safari(このイベントに非対応。共有ボタンからの手動追加のみ)
 * - `isStandalone`: 既にホーム画面から起動されている(インストール済み)状態。
 *   この場合は`canInstall`/`isIos`によらずインストール導線自体を隠す想定
 *
 * 例:
 * ```tsx
 * const { canInstall, isIos, isStandalone, promptInstall } = usePwaInstall();
 * if (isStandalone) return null;
 * if (canInstall) return <button onClick={promptInstall}>インストール</button>;
 * if (isIos) return <p>共有ボタンから「ホーム画面に追加」で追加できます</p>;
 * return null; // 対応していないブラウザでは導線ごと出さない
 * ```
 */
export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  // 初期値は遅延初期化で判定し、effect本体でのsetStateを避ける
  // (src/components/settings/LoggedOutSection.tsxのisOnline判定と同じ理由・同じパターン)
  const [isStandalone, setIsStandalone] = useState(() => computeIsStandalone());
  const [isIos] = useState(() => computeIsIos());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const standaloneQuery = window.matchMedia("(display-mode: standalone)");

    function handleBeforeInstallPrompt(event: Event) {
      // ブラウザ標準のミニインフォバーを止め、メニューから任意のタイミングで呼び出せるようにする
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      setDeferredPrompt(null);
      setIsStandalone(true);
    }

    function handleStandaloneChange(event: MediaQueryListEvent) {
      setIsStandalone(event.matches);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    standaloneQuery.addEventListener("change", handleStandaloneChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      standaloneQuery.removeEventListener("change", handleStandaloneChange);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      return;
    }
    // `prompt()`は1回のイベントにつき1度しか呼べないため、結果によらず必ず破棄する
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  return {
    canInstall: deferredPrompt !== null,
    isIos,
    isStandalone,
    promptInstall,
  };
}
