"use client";

import { useParams } from "next/navigation";
import { ItineraryTab } from "@/components/itinerary/ItineraryTab";

/**
 * S3c 旅程タブ。
 * 参照: docs/design/screens/S3c_旅程スポット.md
 */
export default function ItineraryPage() {
  const params = useParams<{ id: string }>();
  return <ItineraryTab shioriId={params.id} />;
}
