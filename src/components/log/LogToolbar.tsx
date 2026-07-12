/**
 * S3d Toolbar(ツールバー行)。
 * 参照: docs/design/screens/S3d_ログ.md「レイアウト」1./「Toolbar」
 */
interface LogToolbarProps {
  count: number;
  max: number;
  disabled: boolean;
  onAddPhoto: () => void;
}

export function LogToolbar({ count, max, disabled, onAddPhoto }: LogToolbarProps) {
  return (
    <div className="flex h-11 items-center justify-between px-4">
      <p className="text-sm text-neutral-500">
        {count}/{max}枚
      </p>
      <button
        type="button"
        onClick={onAddPhoto}
        disabled={disabled}
        className={`flex h-11 items-center justify-center rounded-lg px-4 text-base font-semibold ${
          disabled ? "bg-neutral-200 text-neutral-400" : "bg-pink-500 text-white"
        }`}
      >
        写真を追加
      </button>
    </div>
  );
}
