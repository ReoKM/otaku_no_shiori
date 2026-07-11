"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { buildColorCover, buildEmojiCover, DEFAULT_COVER } from "@/lib/cover";
import { COVER_COLOR_PRESETS, COVER_EMOJI_PRESETS } from "@/lib/cover-presets";
import { createShiori } from "@/lib/guest-store";
import {
  firstShioriFormErrorField,
  hasShioriFormErrors,
  validateShioriForm,
  type ShioriFormErrors,
} from "@/lib/shiori-validation";
import type { TripType } from "@/types/shiori";
import { FieldCover, type CoverMode } from "./FieldCover";
import { FieldDateRange } from "./FieldDateRange";
import { FieldPurpose } from "./FieldPurpose";
import { FieldTitle } from "./FieldTitle";
import { FieldTripType } from "./FieldTripType";

/**
 * S2 しおり作成フォーム本体。
 * 参照: docs/design/screens/S2_しおり作成.md
 */
export function ShioriCreateForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tripType, setTripType] = useState<TripType | null>(null);
  const [purpose, setPurpose] = useState("");
  const [coverMode, setCoverMode] = useState<CoverMode>("color");
  const [coverIndex, setCoverIndex] = useState<number | null>(null);

  const [errors, setErrors] = useState<ShioriFormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});

  function handleCoverModeChange(mode: CoverMode) {
    // 色/絵文字切替時は選択状態をリセットする(仮置き。docs/design/screens/S2_しおり作成.md参照)。
    setCoverMode(mode);
    setCoverIndex(null);
  }

  function resolveCover() {
    if (coverIndex === null) {
      return DEFAULT_COVER;
    }
    return coverMode === "color"
      ? buildColorCover(COVER_COLOR_PRESETS[coverIndex])
      : buildEmojiCover(COVER_EMOJI_PRESETS[coverIndex]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) {
      return;
    }

    const nextErrors = validateShioriForm({ title, startDate, endDate, tripType, purpose });
    setErrors(nextErrors);

    if (hasShioriFormErrors(nextErrors)) {
      const firstField = firstShioriFormErrorField(nextErrors);
      if (firstField) {
        fieldRefs.current[firstField]?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setSubmitting(true);
    try {
      const created = await createShiori({
        title: title.trim(),
        start_date: startDate,
        end_date: endDate,
        trip_type: tripType as TripType,
        purpose: purpose.trim() ? purpose.trim() : null,
        cover: resolveCover(),
      });
      router.push(`/shiori/${created.id}/packing`);
    } catch {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-5 px-4 py-4">
        <div ref={(el) => { fieldRefs.current.title = el; }}>
          <FieldTitle value={title} onChange={setTitle} error={errors.title} disabled={submitting} />
        </div>
        <div
          ref={(el) => {
            fieldRefs.current.startDate = el;
            fieldRefs.current.endDate = el;
          }}
        >
          <FieldDateRange
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            startDateError={errors.startDate}
            endDateError={errors.endDate}
            disabled={submitting}
          />
        </div>
        <div ref={(el) => { fieldRefs.current.tripType = el; }}>
          <FieldTripType value={tripType} onChange={setTripType} error={errors.tripType} disabled={submitting} />
        </div>
        <div ref={(el) => { fieldRefs.current.purpose = el; }}>
          <FieldPurpose value={purpose} onChange={setPurpose} error={errors.purpose} disabled={submitting} />
        </div>
        <FieldCover
          mode={coverMode}
          selectedIndex={coverIndex}
          onModeChange={handleCoverModeChange}
          onSelect={setCoverIndex}
          disabled={submitting}
        />
      </div>
      <div className="sticky bottom-0 border-t border-neutral-200 bg-white p-4">
        <button
          type="submit"
          disabled={submitting}
          className="h-11 w-full rounded-lg bg-pink-500 text-base font-semibold text-white disabled:opacity-70"
        >
          {submitting ? "作成中…" : "しおりを作る"}
        </button>
      </div>
    </form>
  );
}
