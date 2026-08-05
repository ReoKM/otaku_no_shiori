/**
 * S3b2 TodoSegmentedControl(「やること」/「予算」の2分割切替)。
 * 参照: docs/design/screens/S3b2_予算.md「前提: 配置の決定」
 *
 * `itinerary/SegmentedControl.tsx`(「旅程」/「行きたい場所」)と同じ見た目・実装パターン。
 * 型が旅程タブ専用のため使い回さず、やることタブ用に複製する。
 */
export type TodoSegment = "todo" | "budget";

interface TodoSegmentedControlProps {
  active: TodoSegment;
  onChange: (segment: TodoSegment) => void;
}

const SEGMENTS: { id: TodoSegment; label: string }[] = [
  { id: "todo", label: "やること" },
  { id: "budget", label: "予算" },
];

export function TodoSegmentedControl({ active, onChange }: TodoSegmentedControlProps) {
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
