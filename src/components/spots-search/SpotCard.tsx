/**
 * S4 SpotCard(一覧の1行)。
 * 参照: docs/design/screens/S4_スポット検索.md「SpotCard(一覧の1行)」
 */
import { getSpotCategoryLabel } from "@/lib/spot-category";
import type { SeedSpot } from "@/lib/seed-spots";

interface SpotCardProps {
  spot: SeedSpot;
  added: boolean;
  onTap: () => void;
}

export function SpotCard({ spot, added, onTap }: SpotCardProps) {
  const categoryLabel = getSpotCategoryLabel(spot.category);

  return (
    <button
      type="button"
      onClick={onTap}
      className="flex w-full flex-col gap-1 border-b border-neutral-200 px-4 py-3 text-left"
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-bold text-neutral-900">{spot.name}</p>
        {categoryLabel && (
          <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs text-pink-700">{categoryLabel}</span>
        )}
        {added && (
          <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs text-neutral-400">追加済み</span>
        )}
      </div>
      <p className="text-sm text-neutral-500">{spot.area}</p>
      <p className="line-clamp-2 text-xs text-neutral-500">{spot.description}</p>
      {spot.caution && <p className="text-xs text-red-600">⚠ 注意あり</p>}
    </button>
  );
}
