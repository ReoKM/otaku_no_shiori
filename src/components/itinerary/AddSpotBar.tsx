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
    <div className="flex gap-2 px-4 py-3">
      <button
        type="button"
        onClick={onFindSeed}
        className="h-11 flex-1 rounded-lg bg-pink-500 px-3 text-base font-semibold text-white"
      >
        おすすめスポットから探す
      </button>
      <button
        type="button"
        onClick={onOpenFreeForm}
        className="h-11 flex-1 rounded-lg border border-neutral-200 bg-white px-3 text-base text-neutral-900"
      >
        自由に追加する
      </button>
    </div>
  );
}
