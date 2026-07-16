import { ItineraryTab } from "@/components/itinerary/ItineraryTab";
import type { ItinerarySegment } from "@/components/itinerary/SegmentedControl";

/**
 * S3c 旅程タブ。
 * 参照: docs/design/screens/S3c_旅程スポット.md
 *
 * S4(`/shiori/[id]/spots/search`)の「戻る」ボタン・`EmptySearchResult`の
 * 「しおりに戻って自由に追加する」リンクは、`section=spots`(・`openFreeForm=1`)を
 * クエリパラメータに付けてこのページへ遷移してくる(S4仕様「タップ時の挙動」参照)。
 * Server Componentでsearchparamsを読み、`ItineraryTab`の初期表示に反映する
 * (`useSearchParams`によるクライアント側Suspense境界を避けるため、propsで渡す設計)。
 */
export default async function ItineraryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ section?: string; openFreeForm?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const initialSection: ItinerarySegment = sp.section === "spots" ? "spots" : "itinerary";
  const initialOpenFreeForm = sp.openFreeForm === "1";

  return (
    <ItineraryTab shioriId={id} initialSection={initialSection} initialOpenFreeForm={initialOpenFreeForm} />
  );
}
