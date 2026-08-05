import { FEATURE_SPOT_SEED_SEARCH } from "@/lib/feature-flags";

/**
 * S3c AddSpotBar(スポット追加導線、常にリスト上部に表示)。
 * 参照: docs/design/screens/S3c_旅程スポット.md「AddSpotBar」
 *
 * ファーストリリースでは追加導線を「追加する」1本に絞る(オーナー指示)。
 * 「おすすめから探す」(S4スポット検索への入口)は`FEATURE_SPOT_SEED_SEARCH`で閉じているだけで、
 * キャンペーン時にフラグを`true`に戻せば2ボタン構成に復帰する。S4画面側のコードは消していない。
 */
interface AddSpotBarProps {
  onFindSeed: () => void;
  onOpenFreeForm: () => void;
}

export function AddSpotBar({ onFindSeed, onOpenFreeForm }: AddSpotBarProps) {
  return (
    <div className="flex gap-2 pt-5">
      {FEATURE_SPOT_SEED_SEARCH && (
        <button
          type="button"
          onClick={onFindSeed}
          className="min-h-12 flex-1 rounded-btn bg-sakura px-3 text-[14.5px] font-bold text-white"
        >
          おすすめから探す
        </button>
      )}
      <button
        type="button"
        onClick={onOpenFreeForm}
        className={`min-h-12 flex-1 rounded-btn px-3 text-[14.5px] font-bold ${
          FEATURE_SPOT_SEED_SEARCH
            ? "border border-sakura-border bg-paper-surface text-sakura-ink"
            : "bg-sakura text-white"
        }`}
      >
        {FEATURE_SPOT_SEED_SEARCH ? "自由に追加する" : "追加する"}
      </button>
    </div>
  );
}
