/**
 * S3c SegmentedControl(「旅程」/「行きたい場所」の2分割切替)。
 * 参照: docs/design/screens/S3c_旅程スポット.md「前提」
 *
 * タブバーと同じ「選択中は差し色の太字+下辺のインクバー」で揃える。
 * 上位のタブバーより1段下の階層であることを示すため、インクバーは2.5px(タブバーは3px)。
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
    <div className="grid grid-cols-2 border-b border-paper-border" role="tablist">
      {SEGMENTS.map((segment) => {
        const selected = segment.id === active;
        return (
          <button
            key={segment.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(segment.id)}
            className={`min-h-11 text-[14.5px] ${
              selected
                ? "font-bold text-sakura-ink shadow-[inset_0_-2.5px_0_var(--color-sakura)]"
                : "font-medium text-ink-strong"
            }`}
          >
            {segment.label}
          </button>
        );
      })}
    </div>
  );
}
