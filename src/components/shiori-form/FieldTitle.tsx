import { SHIORI_TITLE_MAX_LENGTH } from "@/lib/shiori-validation";

interface FieldTitleProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

/** S2 FieldTitle(タイトル・必須)。参照: docs/design/screens/S2_しおり作成.md */
export function FieldTitle({ value, onChange, error, disabled }: FieldTitleProps) {
  return (
    <div>
      <label htmlFor="shiori-title" className="mb-1 block text-sm font-semibold text-neutral-900">
        タイトル ※必須
      </label>
      <input
        id="shiori-title"
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder="例: ○○ちゃん生誕祭 東京遠征"
        className={`h-11 w-full rounded-lg border bg-white px-3 text-base text-neutral-900 placeholder:text-neutral-400 ${
          error ? "border-red-400" : "border-neutral-200"
        }`}
      />
      <div className="mt-1 flex items-center justify-between">
        {error ? (
          <p className="text-xs text-red-600">{error}</p>
        ) : (
          <span />
        )}
        <p className="text-xs text-neutral-400">
          {value.length}/{SHIORI_TITLE_MAX_LENGTH}
        </p>
      </div>
    </div>
  );
}
