"use client";

import { useEffect, useState } from "react";
import {
  createItineraryEntry,
  deleteItineraryEntry,
  listItineraryEntriesByShiori,
  reorderItineraryEntries,
  updateItineraryEntry,
} from "@/lib/guest-store";
import { groupEntriesByDay, type ItineraryDayInfo } from "@/lib/itinerary-days";
import { computeDayChangePlan, moveEntryInDay, sameDayIdsExcluding } from "@/lib/itinerary-sort";
import { validateItineraryTitle } from "@/lib/itinerary-validation";
import type { ItineraryEntry } from "@/types/shiori";
import type { NewEntryValues } from "./AddEntryForm";
import { DayBlock, type EditDraft } from "./DayBlock";
import { EntryRow } from "./EntryRow";
import { ItineraryFallback } from "./ItineraryFallback";
import { ItinerarySkeleton } from "./ItinerarySkeleton";
import { ItineraryToolbar } from "./ItineraryToolbar";

/**
 * S3c ItinerarySection(旅程セクション本体)。
 * 参照: docs/design/screens/S3c_旅程スポット.md「ItinerarySection」
 *
 * `dayList`が`null`の場合(しおりの`start_date`/`end_date`のいずれかが未設定)は
 * 「日程が設定されていません」フォールバック表示にする。この場合、日ブロックが無いため
 * 並べ替え(sortMode)・予定追加は提供せず、既存エントリーの編集(日付変更プルダウンを除く)・
 * 削除のみ可能とする(仕様「編集は他項目のみ可能」に対応。実装裁量)。
 */
export function ItinerarySection({
  shioriId,
  dayList,
}: {
  shioriId: string;
  dayList: ItineraryDayInfo[] | null;
}) {
  const [entries, setEntries] = useState<ItineraryEntry[] | null>(null);
  const [sortMode, setSortMode] = useState(false);
  const [addFormOpenFor, setAddFormOpenFor] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listItineraryEntriesByShiori(shioriId).then((items) => {
      if (!cancelled) {
        setEntries(items);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [shioriId]);

  function handleToggleSort() {
    setEditDraft(null);
    setDeletingId(null);
    setAddFormOpenFor(null);
    setSortMode((v) => !v);
  }

  function handleOpenAddForm(dayDate: string) {
    setEditDraft(null);
    setDeletingId(null);
    setAddFormOpenFor(dayDate);
  }

  function handleCancelAddForm() {
    setAddFormOpenFor(null);
  }

  async function handleSaveAddForm(dayDate: string, values: NewEntryValues) {
    const created = await createItineraryEntry({
      shiori_id: shioriId,
      day_date: dayDate,
      time: values.time,
      title: values.title,
      place_name: values.placeName,
      memo: values.memo,
    });
    setEntries((prev) => (prev ? [...prev, created] : [created]));
    setAddFormOpenFor(null);
  }

  function handleStartEdit(entry: ItineraryEntry) {
    setDeletingId(null);
    setAddFormOpenFor(null);
    setEditDraft({
      id: entry.id,
      dayDate: entry.day_date,
      time: entry.time ?? "",
      title: entry.title,
      placeName: entry.place_name ?? "",
      memo: entry.memo ?? "",
      error: null,
    });
  }

  function handleCancelEdit() {
    setEditDraft(null);
  }

  async function handleSaveEdit() {
    if (!editDraft) {
      return;
    }
    const validationError = validateItineraryTitle(editDraft.title);
    if (validationError) {
      setEditDraft({ ...editDraft, error: validationError });
      return;
    }
    const currentEntries = entries ?? [];
    const original = currentEntries.find((e) => e.id === editDraft.id);
    if (!original) {
      setEditDraft(null);
      return;
    }

    const dayChanged = editDraft.dayDate !== original.day_date;
    const plan = dayChanged ? computeDayChangePlan(currentEntries, editDraft.id, editDraft.dayDate) : null;

    const updated = await updateItineraryEntry(editDraft.id, {
      time: editDraft.time || null,
      title: editDraft.title.trim(),
      place_name: editDraft.placeName.trim() || null,
      memo: editDraft.memo.trim() || null,
      ...(dayChanged ? { day_date: editDraft.dayDate, sort_order: plan!.newSortOrder } : {}),
    });

    let nextEntries = currentEntries.map((e) => (e.id === updated.id ? updated : e));

    if (plan && plan.oldDayOrderedIds.length > 0) {
      await reorderItineraryEntries(shioriId, plan.oldDayOrderedIds);
      nextEntries = nextEntries.map((e) => {
        const idx = plan.oldDayOrderedIds.indexOf(e.id);
        return idx >= 0 ? { ...e, sort_order: idx } : e;
      });
    }

    setEntries(nextEntries);
    setEditDraft(null);
  }

  function handleStartDelete(entry: ItineraryEntry) {
    setEditDraft(null);
    setDeletingId(entry.id);
  }

  function handleCancelDelete() {
    setDeletingId(null);
  }

  async function handleConfirmDelete(entry: ItineraryEntry) {
    await deleteItineraryEntry(entry.id);
    const currentEntries = entries ?? [];
    const remainingSameDayIds = sameDayIdsExcluding(currentEntries, entry.day_date, entry.id);
    let nextEntries = currentEntries.filter((e) => e.id !== entry.id);

    if (remainingSameDayIds.length > 0) {
      await reorderItineraryEntries(shioriId, remainingSameDayIds);
      nextEntries = nextEntries.map((e) => {
        const idx = remainingSameDayIds.indexOf(e.id);
        return idx >= 0 ? { ...e, sort_order: idx } : e;
      });
    }

    setEntries(nextEntries);
    if (deletingId === entry.id) {
      setDeletingId(null);
    }
  }

  async function handleMove(dayDate: string, index: number, direction: "up" | "down") {
    const dayEntries = (entries ?? [])
      .filter((e) => e.day_date === dayDate)
      .sort((a, b) => a.sort_order - b.sort_order);
    const moved = moveEntryInDay(dayEntries, index, direction);
    if (!moved) {
      return;
    }
    const resequenced = moved.map((e, i) => ({ ...e, sort_order: i }));
    await reorderItineraryEntries(
      shioriId,
      resequenced.map((e) => e.id),
    );
    const byId = new Map(resequenced.map((e) => [e.id, e]));
    setEntries((prev) => (prev ? prev.map((e) => byId.get(e.id) ?? e) : prev));
  }

  if (entries === null) {
    return (
      <div className="flex flex-1 flex-col">
        <ItineraryToolbar count={0} sortMode={false} onToggleSort={() => {}} sortAvailable={false} />
        <ItinerarySkeleton />
      </div>
    );
  }

  const totalCount = entries.length;

  if (dayList === null) {
    // 日程未設定のフォールバック: 並べ替え・追加は提供せず、編集(日付変更を除く)・削除のみ可能。
    const flatEntries = [...entries].sort((a, b) => {
      if (a.day_date !== b.day_date) {
        return a.day_date.localeCompare(b.day_date);
      }
      return a.sort_order - b.sort_order;
    });
    return (
      <div className="flex flex-1 flex-col">
        <ItineraryToolbar count={totalCount} sortMode={false} onToggleSort={() => {}} sortAvailable={false} />
        <ItineraryFallback />
        {flatEntries.map((entry) => (
          <EntryRow
            key={entry.id}
            entry={entry}
            mode={editDraft?.id === entry.id ? "edit" : deletingId === entry.id ? "delete" : "view"}
            dayOptions={null}
            onStartEdit={() => handleStartEdit(entry)}
            onStartDelete={() => handleStartDelete(entry)}
            editTime={editDraft?.id === entry.id ? editDraft.time : ""}
            editTitle={editDraft?.id === entry.id ? editDraft.title : ""}
            editPlaceName={editDraft?.id === entry.id ? editDraft.placeName : ""}
            editMemo={editDraft?.id === entry.id ? editDraft.memo : ""}
            editDayDate={editDraft?.id === entry.id ? editDraft.dayDate : entry.day_date}
            editError={editDraft?.id === entry.id ? editDraft.error : null}
            onEditTimeChange={(v) => setEditDraft((prev) => (prev ? { ...prev, time: v } : prev))}
            onEditTitleChange={(v) =>
              setEditDraft((prev) => (prev ? { ...prev, title: v, error: null } : prev))
            }
            onEditPlaceNameChange={(v) => setEditDraft((prev) => (prev ? { ...prev, placeName: v } : prev))}
            onEditMemoChange={(v) => setEditDraft((prev) => (prev ? { ...prev, memo: v } : prev))}
            onEditDayDateChange={() => {}}
            onClearEditTime={() => setEditDraft((prev) => (prev ? { ...prev, time: "" } : prev))}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            onConfirmDelete={() => handleConfirmDelete(entry)}
            onCancelDelete={handleCancelDelete}
          />
        ))}
      </div>
    );
  }

  const groups = groupEntriesByDay(dayList, entries);

  return (
    <div className="flex flex-1 flex-col">
      <ItineraryToolbar count={totalCount} sortMode={sortMode} onToggleSort={handleToggleSort} />
      <div className="flex flex-col">
        {groups.map((day) => (
          <DayBlock
            key={day.date}
            day={day}
            sortMode={sortMode}
            dayOptions={dayList}
            addFormOpen={addFormOpenFor === day.date}
            editDraft={editDraft}
            deletingId={deletingId}
            onOpenAddForm={() => handleOpenAddForm(day.date)}
            onCancelAddForm={handleCancelAddForm}
            onSaveAddForm={(values) => handleSaveAddForm(day.date, values)}
            onStartEdit={handleStartEdit}
            onCancelEdit={handleCancelEdit}
            onSaveEdit={handleSaveEdit}
            onEditTimeChange={(v) => setEditDraft((prev) => (prev ? { ...prev, time: v } : prev))}
            onEditTitleChange={(v) =>
              setEditDraft((prev) => (prev ? { ...prev, title: v, error: null } : prev))
            }
            onEditPlaceNameChange={(v) =>
              setEditDraft((prev) => (prev ? { ...prev, placeName: v } : prev))
            }
            onEditMemoChange={(v) => setEditDraft((prev) => (prev ? { ...prev, memo: v } : prev))}
            onEditDayDateChange={(v) => setEditDraft((prev) => (prev ? { ...prev, dayDate: v } : prev))}
            onClearEditTime={() => setEditDraft((prev) => (prev ? { ...prev, time: "" } : prev))}
            onStartDelete={handleStartDelete}
            onCancelDelete={handleCancelDelete}
            onConfirmDelete={handleConfirmDelete}
            onMoveUp={(index) => handleMove(day.date, index, "up")}
            onMoveDown={(index) => handleMove(day.date, index, "down")}
          />
        ))}
      </div>
    </div>
  );
}
