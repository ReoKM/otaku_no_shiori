"use client";

import { BackButton } from "@/components/common/BackButton";

/**
 * S6専用ヘッダー(戻るボタン+タイトル「設定」)。
 * 参照: docs/design/screens/S6_設定アカウント.md「レイアウト」1.ヘッダー
 *
 * 戻るボタンは既定(`router.back()`)のまま。「直前の画面(通常はS1)へ戻る」という
 * 仕様どおりで、S1以外から遷移してきた場合もその直前画面へ戻る。
 */
export function SettingsHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center border-b border-paper-border bg-paper-surface px-6">
      <BackButton />
      <h1 className="flex-1 text-center text-[20px] font-black text-ink">設定</h1>
      <div className="w-11 shrink-0" aria-hidden="true" />
    </header>
  );
}
