"use client";

import { useParams } from "next/navigation";
import { ShareTab } from "@/components/share/ShareTab";

/**
 * S5 共有画像プレビュー画面。
 * 参照: docs/design/screens/S5_共有画像プレビュー.md
 */
export default function SharePage() {
  const params = useParams<{ id: string }>();
  return <ShareTab shioriId={params.id} />;
}
