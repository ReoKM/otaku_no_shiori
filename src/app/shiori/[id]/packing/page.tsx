"use client";

import { useParams } from "next/navigation";
import { PackingTab } from "@/components/packing/PackingTab";

/** S3a 持ち物タブ。参照: docs/design/screens/S3a_持ち物.md */
export default function PackingPage() {
  const params = useParams<{ id: string }>();
  return <PackingTab shioriId={params.id} />;
}
