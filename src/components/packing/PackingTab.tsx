"use client";

import { useEffect, useMemo, useState } from "react";
import { FollowFab } from "@/components/list-ui/FollowFab";
import { RowActionSheet } from "@/components/list-ui/RowActionSheet";
import { SortSheet } from "@/components/list-ui/SortSheet";
import { UndoToast } from "@/components/list-ui/UndoToast";
import {
  createPackingItem,
  deletePackingItem,
  getShiori,
  listPackingItemsByShiori,
  reorderPackingItems,
  updatePackingItem,
} from "@/lib/guest-store";
import {
  applyListSortMode,
  DEFAULT_LIST_SORT_MODE,
  loadListSortMode,
  saveListSortMode,
  type ListSortMode,
} from "@/lib/list-sort-mode";
import { PACKING_LABEL_MAX_LENGTH, validatePackingLabel } from "@/lib/packing-validation";
import {
  isPackingTemplateSeeded,
  seedPackingTemplate,
} from "@/lib/packing-template-seed";
import { useDragSort } from "@/lib/use-drag-sort";
import { useFollowFab } from "@/lib/use-follow-fab";
import { useUndoToast } from "@/lib/use-undo-toast";
import type { PackingItem, TripType } from "@/types/shiori";
import { EmptyPacking } from "./EmptyPacking";
import { PackingAddForm } from "./PackingAddForm";
import { PackingAllDoneBanner } from "./PackingAllDoneBanner";
import { PackingListSkeleton } from "./PackingListSkeleton";
import { PackingProgressCard } from "./PackingProgressCard";
import { PackingRow } from "./PackingRow";
import { PackingRowSortMode } from "./PackingRowSortMode";
import { PackingToolbar } from "./PackingToolbar";

interface PackingTabProps {
  shioriId: string;
}

/**
 * S3a 持ち物タブ本体。
 * 参照: docs/design/screens/S3a_持ち物.md
 *
 * 初回表示時、持ち物が0件かつテンプレ未投入ならtrip_type対応テンプレを自動投入する。
 * 全削除後は自動再投入せず、EmptyPackingの「テンプレから追加」ボタンでのみ手動投入する。
 */
export function PackingTab({ shioriId }: PackingTabProps) {
  // 「どのしおりidに対して読み込み済みか」を保持し、shioriId切り替え直後は
  // loadedForId !== shioriId になることでローディング表示に戻す
  // (ShioriDetailLayoutと同じ考え方。effect本体での同期的なsetState呼び出しを避けるため)。
  const [loadedForId, setLoadedForId] = useState<string | null>(null);
  const [tripType, setTripType] = useState<TripType>("other");
  const [items, setItems] = useState<PackingItem[]>([]);
  const [sortMode, setSortMode] = useState<ListSortMode>(DEFAULT_LIST_SORT_MODE);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  const [showDone, setShowDone] = useState(true);
  const [menuTarget, setMenuTarget] = useState<PackingItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addValue, setAddValue] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);

  const undoToast = useUndoToast<PackingItem>();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const shiori = await getShiori(shioriId);
      const currentTripType = shiori?.trip_type ?? "other";
      let list = await listPackingItemsByShiori(shioriId);

      // テンプレ投入(DB書き込み)の前に必ずキャンセル判定する。
      // React Strict Mode(開発時)はマウント→アンマウント→再マウントでeffectが2回走るため、
      // ここで抜けないと両方の実行が投入処理に到達しテンプレが重複する(Issue #25)。
      if (cancelled) {
        return;
      }

      if (list.length === 0 && !isPackingTemplateSeeded(shioriId)) {
        try {
          list = await seedPackingTemplate(shioriId, currentTripType);
        } catch {
          // 投入処理自体が失敗した場合のみ「空(全削除後)」と同じ表示にフォールバックする
          // (S3a仕様「状態」表)。フラグは立てないため次回アクセス時に再度自動投入を試みる。
        }
      }

      if (!cancelled) {
        setTripType(currentTripType);
        setItems(list);
        setSortMode(loadListSortMode(shioriId, "packing"));
        setSortSheetOpen(false);
        setShowDone(true);
        setAddOpen(false);
        setLoadedForId(shioriId);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [shioriId]);

  const loading = loadedForId !== shioriId;
  const manualSortMode = sortMode === "manual";

  const checkedCount = items.filter((item) => item.is_checked).length;

  // 並び順モードを適用したうえで、「完了済みを隠す」がONなら未完了だけに絞る
  const sortedItems = useMemo(
    () => applyListSortMode(items, sortMode, (item) => item.is_checked),
    [items, sortMode],
  );
  const visibleItems = useMemo(
    () => (showDone ? sortedItems : sortedItems.filter((item) => !item.is_checked)),
    [sortedItems, showDone],
  );
  const hiddenCount = sortedItems.length - visibleItems.length;

  const hasList = items.length > 0 || addOpen;
  const { visible: fabVisible, anchorRef: fabAnchor } = useFollowFab(
    hasList && !manualSortMode && !addOpen,
  );

  function handlePickSortMode(mode: ListSortMode) {
    setSortMode(mode);
    saveListSortMode(shioriId, "packing", mode);
    setSortSheetOpen(false);
    // 手動並べ替え中は行の順序そのものを触るため、完了済みを隠したままだと
    // 見えていない行を巻き込んで並べ替えてしまう。強制的に全件表示に戻す。
    if (mode === "manual") {
      setShowDone(true);
      setAddOpen(false);
    }
  }

  async function handleToggleCheck(id: string) {
    const target = items.find((item) => item.id === id);
    if (!target) {
      return;
    }
    const updated = await updatePackingItem(id, { is_checked: !target.is_checked });
    setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
  }

  async function handleSaveLabel(id: string, label: string) {
    const updated = await updatePackingItem(id, { label });
    setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
    setMenuTarget(null);
  }

  async function handleDelete(target: PackingItem) {
    setMenuTarget(null);
    await deletePackingItem(target.id);
    const remaining = items.filter((item) => item.id !== target.id);
    setItems(remaining);
    if (remaining.length > 0) {
      await reorderPackingItems(
        shioriId,
        remaining.map((item) => item.id),
      );
    }
    undoToast.show(`「${target.label}」を削除しました`, target);
  }

  async function handleUndoDelete() {
    const removed = undoToast.undo();
    if (!removed) {
      return;
    }
    // 元のidは復元できないため同じ名前で作り直す。削除前の位置ではなく末尾に戻る
    // (guest-storeに任意位置への挿入APIが無いための仮置き)。
    const restored = await createPackingItem({ shiori_id: shioriId, label: removed.label });
    setItems((prev) => [...prev, restored]);
    flashRow(restored.id);
  }

  async function handleDrop(newOrder: string[]) {
    const byId = new Map(items.map((item) => [item.id, item]));
    const reordered = newOrder
      .map((id) => byId.get(id))
      .filter((item): item is PackingItem => !!item);
    // ドロップ直後にuseDragSortの暫定並びが解除されるため、DB書き込みを待つと
    // 一瞬元の並びに戻って見える。先にローカルを更新する(楽観更新)。
    setItems(reordered);
    await reorderPackingItems(shioriId, newOrder);
  }

  const dragSort = useDragSort({
    ids: sortedItems.map((item) => item.id),
    onDrop: handleDrop,
  });

  async function handleAddFromTemplate() {
    const created = await seedPackingTemplate(shioriId, tripType);
    setItems(created);
  }

  function flashRow(id: string) {
    setFlashId(id);
    setTimeout(() => setFlashId((current) => (current === id ? null : current)), 1200);
  }

  async function handleAddSubmit() {
    const validationError = validatePackingLabel(addValue);
    if (validationError) {
      setAddError(validationError);
      return;
    }
    const created = await createPackingItem({ shiori_id: shioriId, label: addValue.trim() });
    setItems((prev) => [...prev, created]);
    setAddValue("");
    setAddError(null);
    flashRow(created.id);
  }

  function handleStartAdd() {
    setAddOpen(true);
    setAddValue("");
    setAddError(null);
  }

  if (loading) {
    return <PackingListSkeleton />;
  }

  const duplicate =
    addValue.trim().length > 0 && items.some((item) => item.label === addValue.trim());

  return (
    <div className="flex flex-1 flex-col px-6 pt-5 pb-8">
      <PackingProgressCard total={items.length} checkedCount={checkedCount} />
      {items.length > 0 && checkedCount === items.length && <PackingAllDoneBanner />}

      <PackingToolbar
        count={items.length}
        checkedCount={checkedCount}
        showDone={showDone}
        onToggleShowDone={() => setShowDone((prev) => !prev)}
        onOpenSortSheet={() => setSortSheetOpen(true)}
        manualSortMode={manualSortMode}
        onExitManualSort={() => handlePickSortMode(DEFAULT_LIST_SORT_MODE)}
      />

      {!hasList ? (
        <EmptyPacking onStartAdd={handleStartAdd} onAddFromTemplate={handleAddFromTemplate} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-paper-border bg-paper-surface">
          {manualSortMode
            ? dragSort.order.map((id) => {
                const item = items.find((i) => i.id === id);
                if (!item) {
                  return null;
                }
                return (
                  <PackingRowSortMode
                    key={item.id}
                    item={item}
                    isDragging={dragSort.draggingId === item.id}
                    registerRow={dragSort.registerRow(item.id)}
                    onHandlePointerDown={dragSort.onHandlePointerDown(item.id)}
                  />
                );
              })
            : visibleItems.map((item) => (
                <PackingRow
                  key={item.id}
                  item={item}
                  flash={flashId === item.id}
                  onToggleCheck={handleToggleCheck}
                  onOpenMenu={setMenuTarget}
                />
              ))}

          {!manualSortMode && (
            <div ref={fabAnchor}>
              <PackingAddForm
                open={addOpen}
                value={addValue}
                error={addError}
                duplicate={duplicate}
                onOpen={handleStartAdd}
                onChange={(value) => {
                  setAddValue(value);
                  if (addError) {
                    setAddError(null);
                  }
                }}
                onSubmit={handleAddSubmit}
                onCancel={() => {
                  setAddOpen(false);
                  setAddValue("");
                  setAddError(null);
                }}
              />
            </div>
          )}
        </div>
      )}

      {hiddenCount > 0 && (
        <p className="mt-3 text-center text-[12.5px] font-medium text-ink-muted">
          完了済み{hiddenCount}件を非表示中
        </p>
      )}

      {fabVisible && <FollowFab label="持ち物を追加" onClick={handleStartAdd} />}

      {undoToast.toast && (
        <UndoToast message={undoToast.toast.message} onUndo={handleUndoDelete} />
      )}

      {sortSheetOpen && (
        <SortSheet
          current={sortMode}
          onPick={handlePickSortMode}
          onClose={() => setSortSheetOpen(false)}
        />
      )}

      {menuTarget && (
        <RowActionSheet
          title={menuTarget.label}
          initialLabel={menuTarget.label}
          maxLength={PACKING_LABEL_MAX_LENGTH}
          validate={validatePackingLabel}
          onSave={(label) => handleSaveLabel(menuTarget.id, label)}
          onDelete={() => handleDelete(menuTarget)}
          onClose={() => setMenuTarget(null)}
        />
      )}
    </div>
  );
}
