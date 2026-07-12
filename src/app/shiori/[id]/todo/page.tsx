"use client";

import { useParams } from "next/navigation";
import { TodoTab } from "@/components/todo/TodoTab";

/**
 * S3b TODOタブ。
 * 参照: docs/design/screens/S3b_TODO.md
 */
export default function TodoPage() {
  const params = useParams<{ id: string }>();
  return <TodoTab shioriId={params.id} />;
}
