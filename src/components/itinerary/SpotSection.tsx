"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createItineraryEntry,
  createShioriSpot,
  createSpot,
  deleteShioriSpot,
  deleteSpot,
  listShioriSpotsByShiori,
  listSpots,
  updateShioriSpot,
} from "@/lib/guest-store";
import type { ItineraryDayInfo } from "@/lib/itinerary-days";
import { buildAddToItineraryEntryInput } from "@/lib/spot-itinerary";
import { buildUgcSpotMap, resolveSpotRows, type ResolvedSpotRow } from "@/lib/spot-list";
import type { ShioriSpot } from "@/types/shiori";
import { AddSpotBar } from "./AddSpotBar";
import { EmptySpots } from "./EmptySpots";
import { FreeSpotForm, type NewSpotValues } from "./FreeSpotForm";
import { ItinerarySkeleton } from "./ItinerarySkeleton";
import { SpotRow, type SpotRowMode } from "./SpotRow";

/**
 * S3c SpotSection(「行きたい場所」セクション本体)。
 * 参照: docs/design/screens/S3c_旅程スポット.md「SpotSection」
 *
 * 一覧の並び順は「追加順(先頭が最初に追加したもの)」と仕様にあるが、`shiori_spots`
 * (guest-store.ts、複合キー[shiori_id, spot_id])には作成順を示す列が無く、
 * `listShioriSpotsByShiori`はIndexedDBの複合キー順(実質spot_id順)で返る。
 * guest-store.ts/types/shiori.tsの変更はこのタスクの範囲外のため、
 * セッション中に追加した分はローカルstateへの追記で意図した並びを保ち、
 * リロード後の並びはstore由来の順序に依存する仮置きとした(完了報告に明記)。
 */
interface SpotSectionProps {
  shioriId: string;
  dayList: ItineraryDayInfo[] | null;
  openFreeFormInitial?: boolean;
  onAddedToItinerary: () => void;
}

interface SpotSectionState {
  shioriSpots: ShioriSpot[];
  rows: ResolvedSpotRow[];
}

export function SpotSection({
  shioriId,
  dayList,
  openFreeFormInitial = false,
  onAddedToItinerary,
}: SpotSectionProps) {
  const router = useRouter();
  const [state, setState] = useState<SpotSectionState | null>(null);
  const [freeFormOpen, setFreeFormOpen] = useState(openFreeFormInitial);
  const [addPickerSpotId, setAddPickerSpotId] = useState<string | null>(null);
  const [pickerDayDate, setPickerDayDate] = useState("");
  const [pickerTime, setPickerTime] = useState("");
  const [deletingSpotId, setDeletingSpotId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listShioriSpotsByShiori(shioriId), listSpots()])
      .then(([shioriSpots, ugcSpots]) => {
        if (cancelled) {
          return;
        }
        const rows = resolveSpotRows(shioriSpots, buildUgcSpotMap(ugcSpots));
        setState({ shioriSpots, rows });
      })
      .catch(() => {
        // 読込失敗時はスケルトンのまま固まらないよう空一覧として表示する
        if (!cancelled) {
          setState({ shioriSpots: [], rows: [] });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [shioriId]);

  function handleFindSeed() {
    router.push(`/shiori/${shioriId}/spots/search`);
  }

  function handleOpenFreeForm() {
    setFreeFormOpen(true);
  }

  function handleCancelFreeForm() {
    setFreeFormOpen(false);
  }

  async function handleSaveFreeForm(values: NewSpotValues) {
    const spot = await createSpot({ name: values.name });
    const shioriSpot = await createShioriSpot({ shiori_id: shioriId, spot_id: spot.id, memo: values.memo });
    setState((prev) => {
      const shioriSpots = prev ? [...prev.shioriSpots, shioriSpot] : [shioriSpot];
      const rows = prev
        ? [...prev.rows, resolveSpotRows([shioriSpot], buildUgcSpotMap([spot]))[0]]
        : resolveSpotRows([shioriSpot], buildUgcSpotMap([spot]));
      return { shioriSpots, rows };
    });
    setFreeFormOpen(false);
  }

  async function handleToggleVisited(row: ResolvedSpotRow) {
    const updated = await updateShioriSpot(shioriId, row.spotId, { is_visited: !row.isVisited });
    setState((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        shioriSpots: prev.shioriSpots.map((s) => (s.spot_id === updated.spot_id ? updated : s)),
        rows: prev.rows.map((r) => (r.spotId === row.spotId ? { ...r, isVisited: updated.is_visited } : r)),
      };
    });
  }

  function handleStartAddToItinerary(spotId: string) {
    setDeletingSpotId(null);
    setAddPickerSpotId(spotId);
    setPickerDayDate(dayList?.[0]?.date ?? "");
    setPickerTime("");
  }

  function handleCancelAddToItinerary() {
    setAddPickerSpotId(null);
  }

  async function handleConfirmAddToItinerary(row: ResolvedSpotRow) {
    if (!pickerDayDate) {
      return;
    }
    const input = buildAddToItineraryEntryInput({
      shioriId,
      dayDate: pickerDayDate,
      time: pickerTime,
      spotName: row.name,
      spotMemo: row.memo,
    });
    await createItineraryEntry(input);
    setAddPickerSpotId(null);
    onAddedToItinerary();
  }

  function handleStartDelete(spotId: string) {
    setAddPickerSpotId(null);
    setDeletingSpotId(spotId);
  }

  function handleCancelDelete() {
    setDeletingSpotId(null);
  }

  /**
   * 削除確認の「削除」。`shiori_spots`の紐付け解除に加え、自由入力(UGC)スポットの場合は
   * `spots`本体も削除する(2段階削除。guest-store.tsの`deleteShioriSpot`は紐付け削除のみのため、
   * このUI側で`deleteShioriSpot`+`deleteSpot`を組み合わせて呼ぶ方式を採用した。
   * S3c仕様「SpotRow(削除確認中)」実装上の注記のとおり)。
   */
  async function handleConfirmDelete(row: ResolvedSpotRow) {
    await deleteShioriSpot(shioriId, row.spotId);
    if (row.isUgc) {
      await deleteSpot(row.spotId);
    }
    setState((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        shioriSpots: prev.shioriSpots.filter((s) => s.spot_id !== row.spotId),
        rows: prev.rows.filter((r) => r.spotId !== row.spotId),
      };
    });
    setDeletingSpotId(null);
  }

  if (state === null) {
    return (
      <div className="flex flex-1 flex-col">
        <AddSpotBar onFindSeed={handleFindSeed} onOpenFreeForm={handleOpenFreeForm} />
        <ItinerarySkeleton />
      </div>
    );
  }

  const { rows } = state;

  return (
    <div className="flex flex-1 flex-col">
      <AddSpotBar onFindSeed={handleFindSeed} onOpenFreeForm={handleOpenFreeForm} />
      {freeFormOpen && <FreeSpotForm onSave={handleSaveFreeForm} onCancel={handleCancelFreeForm} />}
      <div className="flex h-11 items-center px-4">
        <p className="text-sm text-neutral-500">{rows.length}件</p>
      </div>
      {rows.length === 0 ? (
        <EmptySpots />
      ) : (
        <div className="flex flex-col">
          {rows.map((row) => {
            const mode: SpotRowMode =
              addPickerSpotId === row.spotId ? "addPicker" : deletingSpotId === row.spotId ? "delete" : "view";
            return (
              <SpotRow
                key={row.spotId}
                row={row}
                mode={mode}
                dayOptions={dayList}
                onToggleVisited={() => handleToggleVisited(row)}
                onStartAddToItinerary={() => handleStartAddToItinerary(row.spotId)}
                onStartDelete={() => handleStartDelete(row.spotId)}
                pickerDayDate={pickerDayDate}
                pickerTime={pickerTime}
                onPickerDayDateChange={setPickerDayDate}
                onPickerTimeChange={setPickerTime}
                onConfirmAddToItinerary={() => handleConfirmAddToItinerary(row)}
                onCancelAddToItinerary={handleCancelAddToItinerary}
                onConfirmDelete={() => handleConfirmDelete(row)}
                onCancelDelete={handleCancelDelete}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
