/**
 * S3c AddSpotBar(スポット追加導線、常にリスト上部に表示)。
 * 参照: docs/design/screens/S3c_旅程スポット.md「AddSpotBar」
 */
interface AddSpotBarProps {
  onFindSeed: () => void;
  onOpenFreeForm: () => void;
}

export function AddSpotBar({ onFindSeed, onOpenFreeForm }: AddSpotBarProps) {
  return (
    <div className="flex gap-2 pt-5">
      <button
        type="button"
        onClick={onFindSeed}
        className="min-h-12 flex-1 rounded-btn bg-sakura px-3 text-[14.5px] font-bold text-white"
      >
        おすすめから探す
      </button>
      <button
        type="button"
        onClick={onOpenFreeForm}
        className="min-h-12 flex-1 rounded-btn border border-sakura-border bg-paper-surface px-3 text-[14.5px] font-bold text-sakura-ink"
      >
        自由に追加する
      </button>
    </div>
  );
}
