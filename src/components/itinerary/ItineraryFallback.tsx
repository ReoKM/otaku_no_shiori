/**
 * S3c 日程null時のフォールバック表示。
 * 参照: docs/design/screens/S3c_旅程スポット.md
 *
 * しおりの`start_date`/`end_date`のいずれかが`null`(イレギュラーなデータ)の場合、
 * 日ブロックを生成せずこのメッセージのみを表示する(ランタイムエラー・無限ループ防止)。
 */
export function ItineraryFallback() {
  return (
    <div className="rounded-2xl border border-dashed border-paper-dashed bg-paper-surface px-5.5 py-8 text-center">
      <p className="text-[13px] text-ink-sub">日程が設定されていません</p>
    </div>
  );
}
