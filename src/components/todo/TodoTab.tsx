"use client";

import { useEffect, useMemo, useState } from "react";
import { createTodo, deleteTodo, listTodosByShiori, reorderTodos, updateTodo } from "@/lib/guest-store";
import { canMoveDown, canMoveUp, isDueToday, moveTodoInGroup, sortTodos, todayYmd } from "@/lib/todo-sort";
import { isTodoTemplateSeeded, markTodoTemplateSeeded } from "@/lib/todo-template-seed";
import { validateTodoLabel } from "@/lib/todo-validation";
import { seedTodoTemplate } from "@/templates/todo-templates";
import type { Todo } from "@/types/shiori";
import { AddForm } from "./AddForm";
import { EmptyTodo } from "./EmptyTodo";
import { Toolbar } from "./Toolbar";
import { TodoRow } from "./TodoRow";
import { TodoRowSortMode } from "./TodoRowSortMode";
import { TodoSkeleton } from "./TodoSkeleton";

interface EditDraft {
  id: string;
  label: string;
  dueDate: string;
  error: string | null;
}

/**
 * S3b TodoTab(TODOタブ本体)。
 * 参照: docs/design/screens/S3b_TODO.md
 *
 * テンプレ自動投入: タブを初めて開いた時点で0件なら自動投入する。
 * 投入済みフラグは`src/lib/todo-template-seed.ts`(localStorage)で管理する
 * (guest-store.ts/types/shiori.tsは変更しない方針のための仮置き。完了報告に記載)。
 */
export function TodoTab({ shioriId }: { shioriId: string }) {
  const [todos, setTodos] = useState<Todo[] | null>(null);
  const [sortMode, setSortMode] = useState(false);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const items = await listTodosByShiori(shioriId);
      if (cancelled) {
        return;
      }
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

  const sortedTodos = useMemo(() => sortTodos(todos ?? []), [todos]);
  const today = useMemo(() => todayYmd(), []);

  async function handleToggleDone(item: Todo) {
    const updated = await updateTodo(item.id, { is_done: !item.is_done });
    setTodos((prev) => (prev ? prev.map((t) => (t.id === updated.id ? updated : t)) : prev));
  }

  function handleStartEdit(item: Todo) {
    setDeletingId(null);
    setEditDraft({ id: item.id, label: item.label, dueDate: item.due_date ?? "", error: null });
  }

  function handleCancelEdit() {
    setEditDraft(null);
  }

  async function handleSaveEdit() {
    if (!editDraft) {
      return;
    }
    const validationError = validateTodoLabel(editDraft.label);
    if (validationError) {
      setEditDraft({ ...editDraft, error: validationError });
      return;
    }
    const updated = await updateTodo(editDraft.id, {
      label: editDraft.label.trim(),
      due_date: editDraft.dueDate || null,
    });
    setTodos((prev) => (prev ? prev.map((t) => (t.id === updated.id ? updated : t)) : prev));
    setEditDraft(null);
  }

  function handleStartDelete(item: Todo) {
    setEditDraft(null);
    setDeletingId(item.id);
  }

  function handleCancelDelete() {
    setDeletingId(null);
  }

  async function handleConfirmDelete(id: string) {
    await deleteTodo(id);
    // 残りの項目のsort_orderを0始まり連番に振り直す。振り直さないと、
    // createTodoのデフォルトsort_order(=件数)が既存項目と重複しうる。
    const remaining = (todos ?? []).filter((t) => t.id !== id);
    if (remaining.length > 0) {
      await reorderTodos(
        shioriId,
        remaining.map((t) => t.id),
      );
    }
    const items = await listTodosByShiori(shioriId);
    setTodos(items);
    if (deletingId === id) {
      setDeletingId(null);
    }
  }

  function handleToggleSort() {
    setEditDraft(null);
    setDeletingId(null);
    setSortMode((v) => !v);
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const moved = moveTodoInGroup(sortedTodos, index, direction);
    if (!moved) {
      return;
    }
    const resequenced = moved.map((t, i) => ({ ...t, sort_order: i }));
    await reorderTodos(shioriId, resequenced.map((t) => t.id));
    setTodos(resequenced);
  }

  async function handleAdd(label: string, dueDate: string | null) {
    const created = await createTodo({ shiori_id: shioriId, label, due_date: dueDate });
    setTodos((prev) => (prev ? [...prev, created] : [created]));
  }

  async function handleAddFromTemplate() {
    const seeded = await seedTodoTemplate(shioriId);
    markTodoTemplateSeeded(shioriId);
    setTodos(seeded);
  }

  if (todos === null) {
    return (
      <div className="flex flex-1 flex-col">
        <Toolbar count={0} sortMode={false} onToggleSort={() => {}} />
        <TodoSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <Toolbar count={sortedTodos.length} sortMode={sortMode} onToggleSort={handleToggleSort} />
      <div className="flex-1 divide-y divide-neutral-200">
        {sortedTodos.length === 0 ? (
          <EmptyTodo onAddFromTemplate={handleAddFromTemplate} />
        ) : (
          sortedTodos.map((item, index) =>
            sortMode ? (
              <TodoRowSortMode
                key={item.id}
                item={item}
                canMoveUp={canMoveUp(sortedTodos, index)}
                canMoveDown={canMoveDown(sortedTodos, index)}
                onMoveUp={() => handleMove(index, "up")}
                onMoveDown={() => handleMove(index, "down")}
              />
            ) : (
              <TodoRow
                key={item.id}
                item={item}
                mode={editDraft?.id === item.id ? "edit" : deletingId === item.id ? "delete" : "view"}
                dueToday={!item.is_done && isDueToday(item.due_date, today)}
                onToggleDone={() => handleToggleDone(item)}
                onStartEdit={() => handleStartEdit(item)}
                onStartDelete={() => handleStartDelete(item)}
                editLabel={editDraft?.id === item.id ? editDraft.label : ""}
                editDueDate={editDraft?.id === item.id ? editDraft.dueDate : ""}
                editError={editDraft?.id === item.id ? editDraft.error : null}
                onEditLabelChange={(value) =>
                  setEditDraft((prev) => (prev ? { ...prev, label: value, error: null } : prev))
                }
                onEditDueDateChange={(value) =>
                  setEditDraft((prev) => (prev ? { ...prev, dueDate: value } : prev))
                }
                onClearEditDueDate={() =>
                  setEditDraft((prev) => (prev ? { ...prev, dueDate: "" } : prev))
                }
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                onConfirmDelete={() => handleConfirmDelete(item.id)}
                onCancelDelete={handleCancelDelete}
              />
            ),
          )
        )}
      </div>
      <AddForm onAdd={handleAdd} />
    </div>
  );
}
