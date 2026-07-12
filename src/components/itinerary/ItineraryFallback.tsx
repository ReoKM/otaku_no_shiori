/**
 * S3c 日程null時のフォールバック表示。
 * 参照: docs/design/screens/S3c_旅程スポット.md
 * 「`days`は保存データから取得するのではなく…」段落
 *
 * しおりの`start_date`/`end_date`のいずれかが`null`(イレギュラーなデータ)の場合、
 * 日ブロックを生成せずこのメッセージのみを表示する(ランタイムエラー・無限ループ防止)。
 */
export function ItineraryFallback() {
  return (
    <div className="px-4 py-6">
      <p className="text-sm text-neutral-500">日程が設定されていません</p>
    </div>
  );
}
