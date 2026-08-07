import { LogTab } from "@/components/log/LogTab";

/**
 * S3d ログタブ。
 * 参照: docs/design/screens/S3d_ログ.md
 *
 * このファイルはServer Componentのまま保つ(`"use client"`を付けない)。
 * Client Componentのページファイルは`export const dynamic`を持てず、
 * ルートが動的扱い(リクエストごとにNetlify Functions起動)になるため。
 */
export default async function LogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LogTab shioriId={id} />;
}

export const dynamic = "force-static";
