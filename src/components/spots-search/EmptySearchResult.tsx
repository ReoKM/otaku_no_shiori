/**
 * S4 EmptySearchResult(検索結果0件)。
 * 参照: docs/design/screens/S4_スポット検索.md「EmptySearchResult(検索結果0件)」
 */
interface EmptySearchResultProps {
  onBackToShiori: () => void;
}

export function EmptySearchResult({ onBackToShiori }: EmptySearchResultProps) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <p className="text-base text-neutral-500">該当するスポットが見つかりませんでした</p>
      <p className="text-sm text-neutral-500">キーワードやカテゴリを変えて探してみてください</p>
      <button type="button" onClick={onBackToShiori} className="h-11 px-3 text-base font-semibold text-pink-500">
        しおりに戻って自由に追加する
      </button>
    </div>
  );
}
