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
        推しの遠征、しおりで身軽に
      </h1>
      <p className="text-base text-neutral-500">
        持ち物・TODO・旅程をひとつにまとめて、遠征当日も片手でサクサク確認できます。登録なしですぐ使えます。
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
