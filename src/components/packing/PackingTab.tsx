"use client";

import { useEffect, useState } from "react";
import {
  createPackingItem,
  deletePackingItem,
  getShiori,
  listPackingItemsByShiori,
  reorderPackingItems,
  updatePackingItem,
} from "@/lib/guest-store";
import { validatePackingLabel } from "@/lib/packing-validation";
import {
  isPackingTemplateSeeded,
  seedPackingTemplate,
} from "@/lib/packing-template-seed";
import { useDragSort } from "@/lib/use-drag-sort";
import type { PackingItem, TripType } from "@/types/shiori";
import { PackingToolbar } from "./PackingToolbar";
import { PackingRow } from "./PackingRow";
import { PackingRowSortMode } from "./PackingRowSortMode";
import { EmptyPacking } from "./EmptyPacking";
import { PackingAddForm } from "./PackingAddForm";
import { PackingListSkeleton } from "./PackingListSkeleton";

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
  const [sortMode, setSortMode] = useState(false);
  const [addValue, setAddValue] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

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
        setSortMode(false);
        setLoadedForId(shioriId);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [shioriId]);

  const loading = loadedForId !== shioriId;

  async function refresh() {
    const list = await listPackingItemsByShiori(shioriId);
    setItems(list);
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
  }

  async function handleDelete(id: string) {
    await deletePackingItem(id);
    const remainingIds = items.filter((item) => item.id !== id).map((item) => item.id);
    if (remainingIds.length > 0) {
      await reorderPackingItems(shioriId, remainingIds);
    }
    await refresh();
  }

  async function handleDrop(newOrder: string[]) {
    const byId = new Map(items.map((item) => [item.id, item]));
    const reordered = newOrder.map((id) => byId.get(id)).filter((item): item is PackingItem => !!item);
    setItems(reordered);
    await reorderPackingItems(shioriId, newOrder);
  }

  const dragSort = useDragSort({
    ids: items.map((item) => item.id),
    onDrop: handleDrop,
  });

  async function handleAddFromTemplate() {
    const created = await seedPackingTemplate(shioriId, tripType);
    setItems(created);
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
  }

  if (loading) {
    return <PackingListSkeleton />;
  }

  return (
    <div className="flex flex-1 flex-col">
      <PackingToolbar
        count={items.length}
        sortMode={sortMode}
        onToggleSortMode={() => setSortMode((prev) => !prev)}
      />
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <EmptyPacking onAddFromTemplate={handleAddFromTemplate} />
        ) : sortMode ? (
          dragSort.order.map((id) => {
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
        ) : (
          items.map((item) => (
            <PackingRow
              key={item.id}
              item={item}
              onToggleCheck={handleToggleCheck}
              onSaveLabel={handleSaveLabel}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
      <PackingAddForm
        value={addValue}
        error={addError}
        onChange={(value) => {
          setAddValue(value);
          if (addError) {
            setAddError(null);
          }
        }}
        onSubmit={handleAddSubmit}
      />
    </div>
  );
}
