"use client";

import { useRouter } from "next/navigation";

/**
 * S1の空状態(ランディング兼用)ブロック。
 * 参照: docs/design/screens/S1_ホーム一覧.md「EmptyState」
 *
 * 初回訪問者がまず見る画面なので、他タブの空状態(破線カード)より一段強い
 * 「表紙」の扱いにする。見出しは900、CTAは全幅のベタ塗り。
 */
export function EmptyState() {
  const router = useRouter();

  return (
    <div className="rounded-2xl border border-paper-border bg-paper-surface px-5 pt-8 pb-7 text-center">
      <h1 className="text-[22px]/[1.45] font-black tracking-[0.01em] text-ink">
        遠征のすべてを、
        <br />
        1冊のしおりに。
      </h1>
      <p className="mt-4 text-[13px]/[1.9] text-ink-sub">
        ライブも、イベントも、聖地巡礼も。
        <br />
        持ち物・やること・旅程をひとつにまとめて、
        <br />
        遠征当日は片手でサクサク確認。
      </p>
      <p className="mt-3 text-xs font-medium text-ink-muted">登録なしで、いますぐ無料で使えます</p>
      <button
        type="button"
        onClick={() => router.push("/shiori/new")}
        className="mt-6 min-h-13 w-full rounded-btn bg-sakura text-[15px] font-bold text-white"
      >
        ＋ 最初のしおりを作る
      </button>
    </div>
  );
}
