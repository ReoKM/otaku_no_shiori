/**
 * S3c SegmentedControl(「旅程」/「行きたい場所」の2ボタン切替)。
 * 参照: docs/design/screens/S3c_旅程スポット.md「前提」
 */
export type ItinerarySegment = "itinerary" | "spots";

interface SegmentedControlProps {
  active: ItinerarySegment;
  onChange: (segment: ItinerarySegment) => void;
}

const SEGMENTS: { id: ItinerarySegment; label: string }[] = [
  { id: "itinerary", label: "旅程" },
  { id: "spots", label: "行きたい場所" },
];

export function SegmentedControl({ active, onChange }: SegmentedControlProps) {
  return (
    <div className="flex gap-1 bg-neutral-50 px-4 py-3" role="tablist">
      {SEGMENTS.map((segment) => {
        const selected = segment.id === active;
        return (
          <button
            key={segment.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(segment.id)}
            className={`h-11 flex-1 rounded-full text-sm font-semibold ${
              selected ? "bg-pink-100 text-pink-700" : "bg-transparent text-neutral-500"
            }`}
          >
            {segment.label}
          </button>
        );
      })}
    </div>
  );
}
