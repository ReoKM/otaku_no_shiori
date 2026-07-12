"use client";

import { BackButton } from "@/components/common/BackButton";

/**
 * S5専用ヘッダー(戻るボタン+タイトル「共有画像を作る」)。
 * 参照: docs/design/screens/S5_共有画像プレビュー.md「レイアウト」1.ヘッダー
 *
 * 戻るボタンは直前の画面への履歴戻り。直接アクセス等で履歴が無い場合は
 * `/shiori/[id]`へのフォールバックを`BackButton`の`fallbackHref`で行う。
 */
export function ShareHeader({ shioriId }: { shioriId: string }) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-neutral-200 bg-white px-2">
      <BackButton fallbackHref={`/shiori/${shioriId}`} />
      <h1 className="flex-1 truncate text-center text-xl font-bold text-neutral-900">共有画像を作る</h1>
      <div className="w-11 shrink-0" aria-hidden="true" />
    </header>
  );
}
