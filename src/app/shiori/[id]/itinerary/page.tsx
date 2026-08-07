import { Suspense } from "react";
import { ItineraryRoute } from "@/components/itinerary/ItineraryRoute";
import { ItinerarySkeleton } from "@/components/itinerary/ItinerarySkeleton";

/**
 * S3c 旅程タブ。
 * 参照: docs/design/screens/S3c_旅程スポット.md
 *
 * このファイルはServer Componentのまま保つ(`"use client"`を付けない)。
 * Client Componentのページファイルは`export const dynamic`を持てず、
 * ルートが動的扱い(リクエストごとにNetlify Functions起動)になるため。
 *
 * クエリパラメータ(`section`/`openFreeForm`)はページ側のsearchParamsで読むと
 * ルートが動的になるため、`ItineraryRoute`(Client Component)の`useSearchParams`で読む。
 * `useSearchParams`はSuspense境界を要求するのでここで包む。
 */
export default async function ItineraryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <Suspense fallback={<ItinerarySkeleton />}>
      <ItineraryRoute shioriId={id} />
    </Suspense>
  );
}

export const dynamic = "force-static";
