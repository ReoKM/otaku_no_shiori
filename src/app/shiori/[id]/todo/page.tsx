import { TodoTab } from "@/components/todo/TodoTab";

/**
 * S3b TODOタブ。
 * 参照: docs/design/screens/S3b_TODO.md
 *
 * このファイルはServer Componentのまま保つ(`"use client"`を付けない)。
 * Client Componentのページファイルは`export const dynamic`を持てず、
 * ルートが動的扱い(リクエストごとにNetlify Functions起動)になるため。
 */
export default async function TodoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TodoTab shioriId={id} />;
}

export const dynamic = "force-static";
