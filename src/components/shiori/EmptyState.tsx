"use client";

import { useRouter } from "next/navigation";

/**
 * S1の空状態(ランディング兼用)ブロック。
 * 参照: docs/design/screens/S1_ホーム一覧.md「EmptyState」
 */
export function EmptyState() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4 py-8 text-center">
      <h1 className="text-lg font-bold text-neutral-900">
        遠征のすべてを、1冊のしおりに。
      </h1>
      <p className="text-base text-neutral-500">
        ライブも、イベントも、聖地巡礼も。持ち物・TODO・旅程をひとつにまとめて、遠征当日は片手でサクサク確認。登録なしで、いますぐ無料で使えます。
      </p>
      <button
        type="button"
        onClick={() => router.push("/shiori/new")}
        className="h-11 w-full rounded-lg bg-pink-500 text-base font-semibold text-white"
      >
        しおりを作る
      </button>
    </div>
  );
}
