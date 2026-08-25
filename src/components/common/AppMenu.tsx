"use client";

import Link from "next/link";
import { useState } from "react";

import { BottomSheet } from "@/components/list-ui/BottomSheet";
import { usePwaInstall } from "@/lib/use-pwa-install";

/**
 * ハンバーガーメニュー(ヘッダー共通)。
 *
 * 現状、ログイン/設定画面(`/settings`)への導線は「しおり保存後に一度だけ出るバナー」
 * (`LoginPromptBanner`)しか無く、閉じると二度と出せない。本メニューはS1(ホーム)・
 * S3(しおり詳細)のヘッダーから常時アクセスできる入り口として追加する
 * (オーナー指示。仕様書に明記は無いため仮置きの構造。詳細はPRの完了報告を参照)。
 *
 * 項目は「ログイン/設定」「アプリをインストール」(対応環境のみ)「利用規約」
 * 「プライバシーポリシー」の4つ。既存の`BottomSheet`(並べ替え等で使用)をそのまま流用する。
 */
export function AppMenu() {
  const [open, setOpen] = useState(false);
  const { canInstall, isIos, isStandalone, promptInstall } = usePwaInstall();

  const showInstallButton = canInstall && !isStandalone;
  const showInstallHint = !canInstall && isIos && !isStandalone;

  async function handleInstall() {
    await promptInstall();
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        aria-label="メニュー"
        onClick={() => setOpen(true)}
        className="flex h-11 w-11 shrink-0 items-center justify-center text-ink-strong"
      >
        <MenuIcon />
      </button>
      {open && (
        <BottomSheet title="メニュー" onClose={() => setOpen(false)}>
          <div className="flex flex-col">
            <Link
              href="/settings"
              className="flex min-h-13 items-center rounded-xl px-4 text-[15px] font-medium text-ink-strong"
            >
              ログイン / 設定
            </Link>
            {showInstallButton && (
              <button
                type="button"
                onClick={handleInstall}
                className="flex min-h-13 items-center rounded-xl px-4 text-left text-[15px] font-medium text-ink-strong"
              >
                アプリをインストール
              </button>
            )}
            {showInstallHint && (
              <div className="flex flex-col gap-1 px-4 py-3">
                <p className="text-[15px] font-medium text-ink-strong">アプリをインストール</p>
                <p className="text-xs leading-relaxed text-ink-muted">
                  共有ボタン(
                  <ShareGlyph />
                  )から「ホーム画面に追加」を選ぶと、アプリのように使えます
                </p>
              </div>
            )}
            <div className="my-1 border-t border-paper-divider" />
            <Link
              href="/terms"
              className="flex min-h-13 items-center rounded-xl px-4 text-[15px] font-medium text-ink-strong"
            >
              利用規約
            </Link>
            <Link
              href="/privacy"
              className="flex min-h-13 items-center rounded-xl px-4 text-[15px] font-medium text-ink-strong"
            >
              プライバシーポリシー
            </Link>
          </div>
        </BottomSheet>
      )}
    </>
  );
}

function MenuIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M2.5 5h13" />
      <path d="M2.5 9h13" />
      <path d="M2.5 13h13" />
    </svg>
  );
}

/** iOS Safariの共有アイコン(四角+上向き矢印)を模した装飾グリフ。文中インライン表示用。 */
function ShareGlyph() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="inline-block align-[-1px]"
    >
      <path d="M9 2.2v8.2" />
      <path d="M6.3 4.9 9 2.2l2.7 2.7" />
      <path d="M4.2 8.6v4.7c0 .8.6 1.4 1.4 1.4h7.2c.8 0 1.4-.6 1.4-1.4V8.6" />
    </svg>
  );
}
