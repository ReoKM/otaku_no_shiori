/**
 * S4 CategoryChips(カテゴリフィルターチップ行)。
 * 参照: docs/design/screens/S4_スポット検索.md「3. カテゴリフィルターチップ行」
 */
import { SPOT_CATEGORY_LABELS, SPOT_CATEGORY_ORDER } from "@/lib/spot-category";
import type { SpotCategoryFilter } from "@/lib/spot-search";

interface CategoryChipsProps {
  active: SpotCategoryFilter;
  onChange: (category: SpotCategoryFilter) => void;
}

const CHIPS: { id: SpotCategoryFilter; label: string }[] = [
  { id: "all", label: "すべて" },
  ...SPOT_CATEGORY_ORDER.map((category) => ({ id: category, label: SPOT_CATEGORY_LABELS[category] })),
];

export function CategoryChips({ active, onChange }: CategoryChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4">
      {CHIPS.map((chip) => {
        const selected = chip.id === active;
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => onChange(chip.id)}
            className={`h-11 shrink-0 whitespace-nowrap rounded-full px-4 text-sm ${
              selected ? "bg-pink-100 text-pink-700" : "border border-neutral-200 text-neutral-500"
            }`}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
