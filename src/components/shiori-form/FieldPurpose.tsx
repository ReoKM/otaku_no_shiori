import { SHIORI_PURPOSE_MAX_LENGTH } from "@/lib/shiori-validation";

interface FieldPurposeProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

/** S2 FieldPurpose(目的・任意)。参照: docs/design/screens/S2_しおり作成.md */
export function FieldPurpose({ value, onChange, error, disabled }: FieldPurposeProps) {
  return (
    <div>
      <label htmlFor="shiori-purpose" className="mb-1 block text-sm font-semibold text-neutral-900">
        目的(任意)
      </label>
      <input
        id="shiori-purpose"
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder="例: ○○ライブツアー 東京公演"
        className={`h-11 w-full rounded-lg border bg-white px-3 text-base text-neutral-900 placeholder:text-neutral-400 ${
          error ? "border-red-400" : "border-neutral-200"
        }`}
      />
      <div className="mt-1 flex items-center justify-between">
        {error ? <p className="text-xs text-red-600">{error}</p> : <span />}
        <p className="text-xs text-neutral-400">
          {value.length}/{SHIORI_PURPOSE_MAX_LENGTH}
        </p>
      </div>
    </div>
  );
}
