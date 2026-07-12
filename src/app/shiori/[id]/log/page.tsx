"use client";

import { useParams } from "next/navigation";
import { LogTab } from "@/components/log/LogTab";

/**
 * S3d ログタブ。
 * 参照: docs/design/screens/S3d_ログ.md
 */
export default function LogPage() {
  const params = useParams<{ id: string }>();
  return <LogTab shioriId={params.id} />;
}
