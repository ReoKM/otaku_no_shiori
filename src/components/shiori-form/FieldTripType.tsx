import { TRIP_TYPE_OPTIONS } from "@/lib/trip-type";
import type { TripType } from "@/types/shiori";

interface FieldTripTypeProps {
  value: TripType | null;
  onChange: (value: TripType) => void;
  error?: string;
  disabled?: boolean;
}

/** S2 FieldTripType(遠征タイプ・必須・単一選択チップ4種)。参照: docs/design/screens/S2_しおり作成.md */
export function FieldTripType({ value, onChange, error, disabled }: FieldTripTypeProps) {
  return (
    <div>
      <p className="mb-1.5 block px-0.5 text-[13px] font-bold text-ink-label">遠征タイプ ※必須</p>
      <div className="grid grid-cols-2 gap-2">
        {TRIP_TYPE_OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.value)}
              aria-pressed={selected}
              className={`min-h-12 rounded-xl border px-3 text-sm ${
                selected
                  ? "border-sakura bg-sakura-soft font-bold text-sakura-ink"
                  : "border-paper-dashed bg-white font-medium text-ink"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-2 px-0.5 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
