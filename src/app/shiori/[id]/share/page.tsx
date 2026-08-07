import { ShareRoute } from "@/components/share/ShareRoute";

/**
 * S5 共有画像プレビュー画面。
 * 参照: docs/design/screens/S5_共有画像プレビュー.md
 *
 * このファイルはServer Componentのまま保つ(`"use client"`を付けない)。
 * Client Componentのページファイルは`export const dynamic`を持てず、
 * ルートが動的扱い(リクエストごとにNetlify Functions起動)になるため。
 * フィーチャーフラグによる差し戻しは`ShareRoute`(Client Component)側で行う。
 */
export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ShareRoute shioriId={id} />;
}

export const dynamic = "force-static";
