"use client";

import { useState } from "react";
import { BudgetSection } from "@/components/budget/BudgetSection";
import { TodoSection } from "./TodoSection";
import { TodoSegmentedControl, type TodoSegment } from "./TodoSegmentedControl";

/**
 * S3b TodoTab(やることタブ本体)。
 * 参照: docs/design/screens/S3b2_予算.md「コンポーネント構造」
 *
 * 「やること」/「予算」のセグメント切替の器。`ItineraryTab.tsx`と同じ形の薄いラッパーで、
 * 実処理は`TodoSection`(旧TodoTab)/`BudgetSection`に持たせる。
 * デフォルト選択は「やること」。セクション選択状態はURLに持たせない(仕様どおり)。
 */
export function TodoTab({ shioriId }: { shioriId: string }) {
  const [section, setSection] = useState<TodoSegment>("todo");

  return (
    <div className="flex flex-1 flex-col">
      <TodoSegmentedControl active={section} onChange={setSection} />
      {section === "todo" ? <TodoSection shioriId={shioriId} /> : <BudgetSection shioriId={shioriId} />}
    </div>
  );
}
