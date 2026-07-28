"use client";

import { useEffect, useMemo, useState } from "react";
import { FollowFab } from "@/components/list-ui/FollowFab";
import { UndoToast } from "@/components/list-ui/UndoToast";
import { BUDGET_ITEM_COUNT_MAX } from "@/lib/budget-validation";
import {
  createBudgetItem,
  deleteBudgetItem,
  getShiori,
  listBudgetItemsByShiori,
  reorderBudgetItems,
  updateBudgetItem,
  updateShiori,
} from "@/lib/guest-store";
import { useFollowFab } from "@/lib/use-follow-fab";
import { useUndoToast } from "@/lib/use-undo-toast";
import type { BudgetItem, Shiori } from "@/types/shiori";
import { AddBudgetForm } from "./AddBudgetForm";
import { BudgetActionSheet } from "./BudgetActionSheet";
import { BudgetMemoCard } from "./BudgetMemoCard";
import { BudgetRow } from "./BudgetRow";
import { BudgetSkeleton } from "./BudgetSkeleton";
import { BudgetSummaryCard } from "./BudgetSummaryCard";
import { BudgetTotalSheet } from "./BudgetTotalSheet";
import { EmptyBudget } from "./EmptyBudget";

/**
 * S3b2 BudgetSection(やることタブ内「予算」セクション本体)。
 * 参照: docs/design/screens/S3b2_予算.md
 *
 * `TodoSection.tsx`と同じ責務分担(状態管理・guest-store呼び出しをこのコンポーネントが持つ)。
 * 総額未設定の間は`BudgetSummaryCard`内の`EmptyBudgetTotal`表示のみを出し、
 * 費目リスト・メモカード・追従ボタンは表示しない(仕様「状態」表どおり)。
 */
export function BudgetSection({ shioriId }: { shioriId: string }) {
  const [shiori, setShiori] = useState<Shiori | null | undefined>(undefined);
  const [items, setItems] = useState<BudgetItem[] | null>(null);
  const [totalSheetOpen, setTotalSheetOpen] = useState(false);
  const [menuTarget, setMenuTarget] = useState<BudgetItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [flashId, setFlashId] = useState<string | null>(null);

  const undoToast = useUndoToast<BudgetItem>();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [loadedShiori, loadedItems] = await Promise.all([
        getShiori(shioriId),
        listBudgetItemsByShiori(shioriId),
      ]);
      if (cancelled) {
        return;
      }
      setShiori(loadedShiori ?? null);
      setItems(loadedItems);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [shioriId]);

  const total = shiori?.budget_total ?? null;
  const allocated = useMemo(() => (items ?? []).reduce((sum, item) => sum + item.amount, 0), [items]);
  const count = (items ?? []).length;
  // 費目0件でもインライン追加行を展開した時点で「一覧あり」の表示に切り替える
  // (todosタブの`hasList`と同じ考え方)。
  const hasBudgetList = count > 0 || addOpen;

  const { visible: fabVisible, anchorRef: fabAnchor } = useFollowFab(hasBudgetList && !addOpen);

  function flashRow(id: string) {
    setFlashId(id);
    setTimeout(() => setFlashId((current) => (current === id ? null : current)), 1200);
  }

  async function handleSaveTotal(amount: number) {
    const updated = await updateShiori(shioriId, { budget_total: amount });
    setShiori(updated);
    setTotalSheetOpen(false);
  }

  async function handleClearTotal() {
    const updated = await updateShiori(shioriId, { budget_total: null });
    setShiori(updated);
    setTotalSheetOpen(false);
  }

  async function handleAdd(label: string, amount: number) {
    const created = await createBudgetItem({ shiori_id: shioriId, label, amount });
    setItems((prev) => (prev ? [...prev, created] : [created]));
    flashRow(created.id);
  }

  async function handleSaveItem(id: string, label: string, amount: number) {
    const updated = await updateBudgetItem(id, { label, amount });
    setItems((prev) => (prev ? prev.map((item) => (item.id === updated.id ? updated : item)) : prev));
    setMenuTarget(null);
  }

  async function handleDelete(target: BudgetItem) {
    setMenuTarget(null);
    await deleteBudgetItem(target.id);
    // 残りの項目のsort_orderを0始まり連番に振り直す(todosと同じ考え方)。
    const remaining = (items ?? []).filter((item) => item.id !== target.id);
    if (remaining.length > 0) {
      await reorderBudgetItems(
        shioriId,
        remaining.map((item) => item.id),
      );
      setItems(remaining.map((item, i) => ({ ...item, sort_order: i })));
    } else {
      setItems([]);
    }
    undoToast.show(`「${target.label}」を削除しました`, target);
  }

  async function handleUndoDelete() {
    const removed = undoToast.undo();
    if (!removed) {
      return;
    }
    // 元のidは復元できないため同じ内容で作り直す。削除前の位置ではなく末尾に戻る
    // (guest-storeに任意位置への挿入APIが無いための仮置き。todosと同じ制約)。
    const restored = await createBudgetItem({
      shiori_id: shioriId,
      label: removed.label,
      amount: removed.amount,
    });
    setItems((prev) => (prev ? [...prev, restored] : [restored]));
    flashRow(restored.id);
  }

  async function handleSaveMemo(memo: string) {
    const updated = await updateShiori(shioriId, { budget_memo: memo.length > 0 ? memo : null });
    setShiori(updated);
  }

  if (shiori === undefined || items === null) {
    return <BudgetSkeleton />;
  }

  return (
    <div className="flex flex-1 flex-col px-6 pt-5 pb-8">
      <BudgetSummaryCard total={total} allocated={allocated} onOpenTotalSheet={() => setTotalSheetOpen(true)} />

      {total !== null && (
        <>
          <div className="pt-6 pb-3 text-[13px] font-medium text-ink-sub">
            {count === 0 ? "まだ費目がありません" : `全${count}件`}
          </div>

          {!hasBudgetList ? (
            <EmptyBudget onStartAdd={() => setAddOpen(true)} />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-paper-border bg-paper-surface">
              {items.map((item) => (
                <BudgetRow
                  key={item.id}
                  item={item}
                  flash={flashId === item.id}
                  onOpenMenu={() => setMenuTarget(item)}
                />
              ))}
              <div ref={fabAnchor}>
                <AddBudgetForm
                  open={addOpen}
                  disabled={count >= BUDGET_ITEM_COUNT_MAX}
                  onOpen={() => setAddOpen(true)}
                  onClose={() => setAddOpen(false)}
                  onAdd={handleAdd}
                />
              </div>
            </div>
          )}

          <BudgetMemoCard value={shiori?.budget_memo ?? ""} onSave={handleSaveMemo} />
        </>
      )}

      {fabVisible && <FollowFab label="費目を追加" onClick={() => setAddOpen(true)} />}

      {undoToast.toast && <UndoToast message={undoToast.toast.message} onUndo={handleUndoDelete} />}

      {totalSheetOpen && (
        <BudgetTotalSheet
          current={total}
          onSave={handleSaveTotal}
          onClear={handleClearTotal}
          onClose={() => setTotalSheetOpen(false)}
        />
      )}

      {menuTarget && (
        <BudgetActionSheet
          item={menuTarget}
          onSave={(label, amount) => handleSaveItem(menuTarget.id, label, amount)}
          onDelete={() => handleDelete(menuTarget)}
          onClose={() => setMenuTarget(null)}
        />
      )}
    </div>
  );
}
