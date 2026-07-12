import { SpotSearchList } from "@/components/spots-search/SpotSearchList";
import { SPOT_CATEGORY_ORDER } from "@/lib/spot-category";
import type { SpotCategoryFilter } from "@/lib/spot-search";

function parseCategory(value: string | undefined): SpotCategoryFilter {
  if (value && (SPOT_CATEGORY_ORDER as string[]).includes(value)) {
    return value as SpotCategoryFilter;
  }
  return "all";
}

/**
 * S4 スポット検索(一覧画面)。
 * 参照: docs/design/screens/S4_スポット検索.md
 *
 * `q`(キーワード)/`category`はクエリパラメータで保持する(一覧⇔詳細間の
 * 「検索条件は保持したまま」の要件に対応。`SpotSearchList`のコメント参照)。
 */
export default async function SpotSearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  return (
    <SpotSearchList shioriId={id} initialKeyword={sp.q ?? ""} initialCategory={parseCategory(sp.category)} />
  );
}
