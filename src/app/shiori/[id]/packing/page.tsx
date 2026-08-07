import { PackingTab } from "@/components/packing/PackingTab";

/**
 * S3a 持ち物タブ。参照: docs/design/screens/S3a_持ち物.md
 *
 * このファイルはServer Componentのまま保つ(`"use client"`を付けない)。
 * Client Componentのページファイルは`export const dynamic`を持てず、
 * ルートが動的扱い(リクエストごとにNetlify Functions起動)になるため。
 */
export default async function PackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PackingTab shioriId={id} />;
}

export const dynamic = "force-static";
