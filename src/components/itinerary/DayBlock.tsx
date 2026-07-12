/**
 * S3c DayBlock(日ブロック)。
 * 参照: docs/design/screens/S3c_旅程スポット.md「DayBlock(日ブロック)」
 */
import { canMoveDownInDay, canMoveUpInDay } from "@/lib/itinerary-sort";
import type { ItineraryDayGroup, ItineraryDayInfo } from "@/lib/itinerary-days";
import type { ItineraryEntry } from "@/types/shiori";
import { AddEntryForm, type NewEntryValues } from "./AddEntryForm";
import { EmptyDay } from "./EmptyDay";
import { EntryRow, type EntryRowMode } from "./EntryRow";
import { EntryRowSortMode } from "./EntryRowSortMode";

export interface EditDraft {
  id: string;
  dayDate: string;
  time: string;
  title: string;
  placeName: string;
  memo: string;
  error: string | null;
}

interface DayBlockProps {
  day: ItineraryDayGroup;
  sortMode: boolean;
  dayOptions: ItineraryDayInfo[] | null;
  addFormOpen: boolean;
  editDraft: EditDraft | null;
  deletingId: string | null;
  onOpenAddForm: () => void;
  onCancelAddForm: () => void;
  onSaveAddForm: (values: NewEntryValues) => void;
  onStartEdit: (entry: ItineraryEntry) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onEditTimeChange: (value: string) => void;
  onEditTitleChange: (value: string) => void;
  onEditPlaceNameChange: (value: string) => void;
  onEditMemoChange: (value: string) => void;
  onEditDayDateChange: (value: string) => void;
  onClearEditTime: () => void;
  onStartDelete: (entry: ItineraryEntry) => void;
  onCancelDelete: () => void;
  onConfirmDelete: (entry: ItineraryEntry) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

export function DayBlock({
  day,
  sortMode,
  dayOptions,
  addFormOpen,
  editDraft,
  deletingId,
  onOpenAddForm,
  onCancelAddForm,
  onSaveAddForm,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditTimeChange,
  onEditTitleChange,
  onEditPlaceNameChange,
  onEditMemoChange,
  onEditDayDateChange,
  onClearEditTime,
  onStartDelete,
  onCancelDelete,
  onConfirmDelete,
  onMoveUp,
  onMoveDown,
}: DayBlockProps) {
  return (
    <section>
      <h2 className="px-4 py-3 text-lg font-bold text-neutral-900">{day.label}</h2>
      {day.entries.length === 0 && !addFormOpen ? (
        <EmptyDay onAdd={onOpenAddForm} />
      ) : (
        day.entries.map((entry, index) => {
          function rowMode(): EntryRowMode {
            if (editDraft?.id === entry.id) {
              return "edit";
            }
            if (deletingId === entry.id) {
              return "delete";
            }
            return "view";
          }

          return sortMode ? (
            <EntryRowSortMode
              key={entry.id}
              entry={entry}
              canMoveUp={canMoveUpInDay(day.entries, index)}
              canMoveDown={canMoveDownInDay(day.entries, index)}
              onMoveUp={() => onMoveUp(index)}
              onMoveDown={() => onMoveDown(index)}
            />
          ) : (
            <EntryRow
              key={entry.id}
              entry={entry}
              mode={rowMode()}
              dayOptions={dayOptions}
              onStartEdit={() => onStartEdit(entry)}
              onStartDelete={() => onStartDelete(entry)}
              editTime={editDraft?.id === entry.id ? editDraft.time : ""}
              editTitle={editDraft?.id === entry.id ? editDraft.title : ""}
              editPlaceName={editDraft?.id === entry.id ? editDraft.placeName : ""}
              editMemo={editDraft?.id === entry.id ? editDraft.memo : ""}
              editDayDate={editDraft?.id === entry.id ? editDraft.dayDate : entry.day_date}
              editError={editDraft?.id === entry.id ? editDraft.error : null}
              onEditTimeChange={onEditTimeChange}
              onEditTitleChange={onEditTitleChange}
              onEditPlaceNameChange={onEditPlaceNameChange}
              onEditMemoChange={onEditMemoChange}
              onEditDayDateChange={onEditDayDateChange}
              onClearEditTime={onClearEditTime}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              onConfirmDelete={() => onConfirmDelete(entry)}
              onCancelDelete={onCancelDelete}
            />
          );
        })
      )}
      {!sortMode && day.entries.length > 0 && !addFormOpen && (
        <div className="px-4 py-2">
          <button type="button" onClick={onOpenAddForm} className="h-11 text-sm font-semibold text-pink-500">
            ＋ 予定を追加
          </button>
        </div>
      )}
      {addFormOpen && <AddEntryForm onSave={onSaveAddForm} onCancel={onCancelAddForm} />}
    </section>
  );
}
