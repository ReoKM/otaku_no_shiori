"use client";

import { useEffect, useMemo, useState } from "react";
import { FollowFab } from "@/components/list-ui/FollowFab";
import { SortSheet } from "@/components/list-ui/SortSheet";
import { UndoToast } from "@/components/list-ui/UndoToast";
import { createTodo, deleteTodo, listTodosByShiori, reorderTodos, updateTodo } from "@/lib/guest-store";
import {
  applyListSortMode,
  DEFAULT_SORT_MODE_BY_TAB,
  loadListSortMode,
  saveListSortMode,
  SORT_MODES_BY_TAB,
  type ListSortMode,
} from "@/lib/list-sort-mode";
import { isDueToday, sortTodos, todayYmd, todoGroupKey } from "@/lib/todo-sort";
import { isTodoTemplateSeeded, markTodoTemplateSeeded } from "@/lib/todo-template-seed";
import { useDragSort } from "@/lib/use-drag-sort";
import { useFollowFab } from "@/lib/use-follow-fab";
import { useUndoToast } from "@/lib/use-undo-toast";
import { seedTodoTemplate } from "@/templates/todo-templates";
import type { Todo } from "@/types/shiori";
import { AddForm } from "./AddForm";
import { EmptyTodo } from "./EmptyTodo";
import { TodoActionSheet } from "./TodoActionSheet";
import { TodoProgressCard } from "./TodoProgressCard";
import { TodoRow } from "./TodoRow";
import { TodoRowSortMode } from "./TodoRowSortMode";
import { TodoSkeleton } from "./TodoSkeleton";
import { Toolbar } from "./Toolbar";

/**
 * S3b TodoSection(やることタブ内「やること」セクション本体)。
 * 参照: docs/design/screens/S3b_TODO.md
 *
 * S3b2(予算セグメント追加)にあわせ、旧`TodoTab.tsx`の中身をそのまま切り出したもの。
 * セグメント切替の器は`TodoTab.tsx`が持つ。
 *
 * テンプレ自動投入: タブを初めて開いた時点で0件なら自動投入する。
 * 投入済みフラグは`src/lib/todo-template-seed.ts`(localStorage)で管理する。
 */
export function TodoSection({ shioriId }: { shioriId: string }) {
  const [todos, setTodos] = useState<Todo[] | null>(null);
  const [sortMode, setSortMode] = useState<ListSortMode>(DEFAULT_SORT_MODE_BY_TAB.todo);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  const [showDone, setShowDone] = useState(true);
  const [menuTarget, setMenuTarget] = useState<Todo | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [flashId, setFlashId] = useState<string | null>(null);

  const undoToast = useUndoToast<Todo>();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const items = await listTodosByShiori(shioriId);
      if (cancelled) {
        return;
      }
      setSortMode(loadListSortMode(shioriId, "todo"));
      if (items.length === 0 && !isTodoTemplateSeeded(shioriId)) {
        try {
          const seeded = await seedTodoTemplate(shioriId);
          markTodoTemplateSeeded(shioriId);
          if (!cancelled) {
            setTodos(seeded);
          }
        } catch {
          // 投入失敗時は「空(全削除後)」と同じ表示にフォールバックする(仕様どおり)。
          // フラグは立てないため、次回タブを開いた際に再度自動投入を試みる。
          if (!cancelled) {
            setTodos([]);
          }
        }
      } else if (!cancelled) {
        setTodos(items);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [shioriId]);

  const today = useMemo(() => todayYmd(), []);
  const manualSortMode = sortMode === "manual";

  // 「期限が近い順」だけは期限日を見た並べ替えが必要なので、共通ロジックへ渡す前に済ませる
  const sortedTodos = useMemo(() => {
    const list = todos ?? [];
    const base = sortMode === "due-soon" ? sortTodos(list) : list;
    return applyListSortMode(base, sortMode, (todo) => todo.is_done);
  }, [todos, sortMode]);

  const visibleTodos = useMemo(
    () => (showDone ? sortedTodos : sortedTodos.filter((todo) => !todo.is_done)),
    [sortedTodos, showDone],
  );
  const hiddenCount = sortedTodos.length - visibleTodos.length;

  const doneCount = (todos ?? []).filter((todo) => todo.is_done).length;
  const total = (todos ?? []).length;
  const hasList = total > 0 || addOpen;

  const { visible: fabVisible, anchorRef: fabAnchor } = useFollowFab(
    hasList && !manualSortMode && !addOpen,
  );

  function flashRow(id: string) {
    setFlashId(id);
    setTimeout(() => setFlashId((current) => (current === id ? null : current)), 1200);
  }

  function handlePickSortMode(mode: ListSortMode) {
    setSortMode(mode);
    saveListSortMode(shioriId, "todo", mode);
    setSortSheetOpen(false);
    // 手動並べ替え中は行の順序そのものを触るため、完了済みを隠したままだと
    // 見えていない行を巻き込んで並べ替えてしまう。強制的に全件表示に戻す。
    if (mode === "manual") {
      setShowDone(true);
      setAddOpen(false);
    }
  }

  async function handleToggleDone(item: Todo) {
    const updated = await updateTodo(item.id, { is_done: !item.is_done });
    setTodos((prev) => (prev ? prev.map((t) => (t.id === updated.id ? updated : t)) : prev));
  }

  async function handleSave(id: string, label: string, dueDate: string | null) {
    const updated = await updateTodo(id, { label, due_date: dueDate });
    setTodos((prev) => (prev ? prev.map((t) => (t.id === updated.id ? updated : t)) : prev));
    setMenuTarget(null);
  }

  async function handleDelete(target: Todo) {
    setMenuTarget(null);
    await deleteTodo(target.id);
    // 残りの項目のsort_orderを0始まり連番に振り直す。振り直さないと、
    // createTodoのデフォルトsort_order(=件数)が既存項目と重複しうる。
    const remaining = (todos ?? []).filter((t) => t.id !== target.id);
    if (remaining.length > 0) {
      await reorderTodos(
        shioriId,
        remaining.map((t) => t.id),
      );
      setTodos(remaining.map((t, i) => ({ ...t, sort_order: i })));
    } else {
      setTodos([]);
    }
    undoToast.show(`「${target.label}」を削除しました`, target);
  }

  async function handleUndoDelete() {
    const removed = undoToast.undo();
    if (!removed) {
      return;
    }
    // 元のidは復元できないため同じ内容で作り直す。削除前の位置ではなく末尾に戻る
    // (guest-storeに任意位置への挿入APIが無いための仮置き)。
    const restored = await createTodo({
      shiori_id: shioriId,
      label: removed.label,
      due_date: removed.due_date,
    });
    setTodos((prev) => (prev ? [...prev, restored] : [restored]));
    flashRow(restored.id);
  }

  async function handleDrop(newOrder: string[]) {
    const byId = new Map(sortedTodos.map((t) => [t.id, t]));
    const resequenced = newOrder
      .map((id) => byId.get(id))
      .filter((t): t is Todo => !!t)
      .map((t, i) => ({ ...t, sort_order: i }));
    // ドロップ直後にuseDragSortの暫定並び(visualOrder)が解除されるため、DB書き込みを
    // 待ってからsetTodosすると一瞬元の並びに戻って見える。先にローカルを更新する(楽観更新)。
    setTodos(resequenced);
    await reorderTodos(
      shioriId,
      resequenced.map((t) => t.id),
    );
  }

  const dragSort = useDragSort({
    ids: sortedTodos.map((t) => t.id),
    // 「期限が近い順」のときだけ、期限グループを越える移動を禁じる。
    // 表示順が期限で決まるモードでグループを越えて動かしても、離した瞬間に元の位置へ
    // 戻って見えてしまうため。他のモードは表示順が期限に依存しないので制限しない。
    groupKeyOf:
      sortMode === "due-soon"
        ? (id) => {
            const todo = sortedTodos.find((t) => t.id === id);
            return todo ? todoGroupKey(todo) : "";
          }
        : undefined,
    onDrop: handleDrop,
  });

  async function handleAdd(label: string) {
    const created = await createTodo({ shiori_id: shioriId, label, due_date: null });
    setTodos((prev) => (prev ? [...prev, created] : [created]));
    flashRow(created.id);
  }

  async function handleAddFromTemplate() {
    const seeded = await seedTodoTemplate(shioriId);
    markTodoTemplateSeeded(shioriId);
    setTodos(seeded);
  }

  if (todos === null) {
    return <TodoSkeleton />;
  }

  return (
    <div className="flex flex-1 flex-col px-6 pt-5 pb-8">
      <TodoProgressCard total={total} doneCount={doneCount} />

      <Toolbar
        count={total}
        doneCount={doneCount}
        showDone={showDone}
        onToggleShowDone={() => setShowDone((prev) => !prev)}
        onOpenSortSheet={() => setSortSheetOpen(true)}
        manualSortMode={manualSortMode}
        onExitManualSort={() => handlePickSortMode(DEFAULT_SORT_MODE_BY_TAB.todo)}
      />

      {!hasList ? (
        <EmptyTodo onStartAdd={() => setAddOpen(true)} onAddFromTemplate={handleAddFromTemplate} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-paper-border bg-paper-surface">
          {manualSortMode
            ? dragSort.order.map((id) => {
                const item = sortedTodos.find((t) => t.id === id);
                if (!item) {
                  return null;
                }
                return (
                  <TodoRowSortMode
                    key={item.id}
                    item={item}
                    isDragging={dragSort.draggingId === item.id}
                    registerRow={dragSort.registerRow(item.id)}
                    onHandlePointerDown={dragSort.onHandlePointerDown(item.id)}
                  />
                );
              })
            : visibleTodos.map((item) => (
                <TodoRow
                  key={item.id}
                  item={item}
                  dueToday={!item.is_done && isDueToday(item.due_date, today)}
                  flash={flashId === item.id}
                  onToggleDone={() => handleToggleDone(item)}
                  onOpenMenu={() => setMenuTarget(item)}
                />
              ))}

          {!manualSortMode && (
            <div ref={fabAnchor}>
              <AddForm
                open={addOpen}
                onOpen={() => setAddOpen(true)}
                onClose={() => setAddOpen(false)}
                onAdd={handleAdd}
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

      {fabVisible && <FollowFab label="やることを追加" onClick={() => setAddOpen(true)} />}

      {undoToast.toast && <UndoToast message={undoToast.toast.message} onUndo={handleUndoDelete} />}

      {sortSheetOpen && (
        <SortSheet
          modes={SORT_MODES_BY_TAB.todo}
          current={sortMode}
          onPick={handlePickSortMode}
          onClose={() => setSortSheetOpen(false)}
        />
      )}

      {menuTarget && (
        <TodoActionSheet
          item={menuTarget}
          onSave={(label, dueDate) => handleSave(menuTarget.id, label, dueDate)}
          onDelete={() => handleDelete(menuTarget)}
          onClose={() => setMenuTarget(null)}
        />
      )}
    </div>
  );
}
