"use client";

import { useRouter } from "next/navigation";

/**
 * しおりが1件以上ある場合のみ表示する右下固定の「しおりを作る」FAB。
 * 参照: docs/design/screens/S1_ホーム一覧.md「FabButton」
 */
export function FabButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label="しおりを作る"
      onClick={() => router.push("/shiori/new")}
      className="fixed bottom-6 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-pink-500 text-2xl leading-none text-white shadow-lg"
    >
      ＋
    </button>
  );
}
