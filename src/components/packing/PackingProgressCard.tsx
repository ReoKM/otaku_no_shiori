interface PackingProgressCardProps {
  total: number;
  checkedCount: number;
}

/**
 * S3a 準備率ヒーローカード。
 * チェック済み件数から準備率(%)を算出し、プログレスバーと合わせて表示する。
 * 忘れ物防止の声かけ文言は準備率に応じて切り替える。
 */
export function PackingProgressCard({ total, checkedCount }: PackingProgressCardProps) {
  const percent = total === 0 ? 0 : Math.round((checkedCount / total) * 100);
  const message =
    percent === 100
      ? "準備完了!忘れ物なしで遠征に出発!"
      : percent >= 50
        ? "あと少し!出発前にもう一度チェック"
        : "チェックして忘れ物ゼロの遠征に";

  return (
    <section
      aria-label="持ち物の準備状況"
      className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-400 px-4 py-4 text-white"
    >
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-pink-100">遠征の準備率</p>
          <p className="mt-0.5 text-2xl font-bold">
            {percent}
            <span className="ml-0.5 text-base font-semibold">%</span>
          </p>
        </div>
        <p className="text-right text-xs text-pink-50">
          {checkedCount} / {total} 件チェック済み
        </p>
      </div>
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-3 h-2 overflow-hidden rounded-full bg-white/30"
      >
        <div
          className="h-full rounded-full bg-white transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-pink-50">{message}</p>
    </section>
  );
}
