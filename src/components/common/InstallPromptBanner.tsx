"use client";

import { useEffect, useState } from "react";

import { listShiori } from "@/lib/guest-store";
import {
  isInstallPromptBannerSnoozed,
  snoozeInstallPromptBanner,
} from "@/lib/install-prompt-banner";
import { usePwaInstall } from "@/lib/use-pwa-install";

/**
 * F10「アプリをインストール」自前バナー。root layoutに常設し、全画面で一貫した見た目にする
 * (オーナー指示。ブラウザ標準の`beforeinstallprompt`ミニインフォバーは常時止めており、
 * 本バナーがその代わりになる)。
 *
 * 表示条件(すべて満たす場合のみ):
 * - インストール未実施(`!isStandalone`)
 * - インストール可能(`canInstall`、対応ブラウザ)またはiOS Safari(`isIos`、手動案内のみ表示)
 * - しおりを1件以上作成済み(初回訪問者にいきなり勧めない)
 * - スヌーズ期間中でない(`src/lib/install-prompt-banner.ts`、閉じてから14日は再表示しない)
 *
 * `LoginPromptBanner`(`src/components/shiori-detail/LoginPromptBanner.tsx`)と同じ
 * カード見た目(`sakura-soft`背景の角丸カード+閉じるボタン)を踏襲する。
 */
export function InstallPromptBanner() {
  const { canInstall, isIos, isStandalone, promptInstall } = usePwaInstall();
  const [hasShiori, setHasShiori] = useState(false);
  // 初期値は遅延初期化で判定し、effect本体でのsetStateを避ける
  // (src/components/settings/LoggedOutSection.tsxのisOnline判定と同じ理由・同じパターン)
  const [snoozed, setSnoozed] = useState(() => isInstallPromptBannerSnoozed());

  useEffect(() => {
    let cancelled = false;
    listShiori()
      .then((list) => {
        if (!cancelled) {
          setHasShiori(list.length > 0);
        }
      })
      .catch(() => {
        // 読み込めなくても致命的ではない(バナーが出ないだけ)。
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = !isStandalone && (canInstall || isIos) && hasShiori && !snoozed;

  if (!visible) {
    return null;
  }

  function handleClose() {
    snoozeInstallPromptBanner();
    setSnoozed(true);
  }

  async function handleInstall() {
    await promptInstall();
    handleClose();
  }

  return (
    <div
      role="status"
      className="mx-6 mt-4 flex items-start gap-3 rounded-xl border border-paper-border bg-sakura-soft px-4 py-3.5"
    >
      <span aria-hidden="true" className="text-base leading-none">
        📲
      </span>
      <div className="flex flex-1 flex-col gap-2">
        <p className="text-[13px] leading-[1.6] text-ink-sub">
          ホーム画面に追加すると、アプリのようにすぐ開けます
        </p>
        {canInstall && (
          <button
            type="button"
            onClick={handleInstall}
            className="self-start text-[13px] font-bold text-sakura-ink underline"
          >
            インストールする
          </button>
        )}
        {!canInstall && isIos && (
          <p className="text-xs leading-relaxed text-ink-muted">
            共有ボタンから「ホーム画面に追加」を選ぶと追加できます
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={handleClose}
        aria-label="バナーを閉じる"
        className="grid h-8 w-8 flex-none place-items-center rounded-full text-ink-faint"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}
