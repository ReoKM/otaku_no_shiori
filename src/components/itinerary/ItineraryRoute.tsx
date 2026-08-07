"use client";

import { useSearchParams } from "next/navigation";
import { ItineraryTab } from "./ItineraryTab";
import type { ItinerarySegment } from "./SegmentedControl";

/**
 * S3c 旅程タブのルート用ラッパー(クエリパラメータの読み取り担当)。
 * 参照: docs/design/screens/S3c_旅程スポット.md
 *
 * S4(`/shiori/[id]/spots/search`)の「戻る」ボタン・`EmptySearchResult`の
 * 「しおりに戻って自由に追加する」リンクは、`section=spots`(・`openFreeForm=1`)を
 * クエリパラメータに付けてこのページへ遷移してくる(S4仕様「タップ時の挙動」参照)。
 *
 * 以前はページ側(Server Component)のsearchParamsで読んでいたが、それだと
 * ルートが動的扱いになりリクエストごとにNetlify Functionsが起動するため、
 * クライアント側の`useSearchParams`に移した。呼び出し元でSuspenseに包むこと。
 */
export function ItineraryRoute({ shioriId }: { shioriId: string }) {
  const searchParams = useSearchParams();
  const initialSection: ItinerarySegment =
    searchParams.get("section") === "spots" ? "spots" : "itinerary";
  const initialOpenFreeForm = searchParams.get("openFreeForm") === "1";

  return (
    <ItineraryTab
      shioriId={shioriId}
      initialSection={initialSection}
      initialOpenFreeForm={initialOpenFreeForm}
    />
  );
}
