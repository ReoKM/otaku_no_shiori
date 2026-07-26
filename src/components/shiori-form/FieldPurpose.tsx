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
      <label htmlFor="shiori-purpose" className="mb-1.5 block px-0.5 text-[13px] font-bold text-ink-label">
        目的(任意)
      </label>
      <input
        id="shiori-purpose"
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder="例: ○○ライブツアー 東京公演"
        className={`min-h-12 w-full rounded-xl border-[1.5px] bg-white px-3.5 text-base font-medium text-ink outline-none placeholder:font-normal placeholder:text-ink-faint ${
          error ? "border-red-400" : "border-paper-dashed focus:border-sakura-field"
        }`}
      />
      <div className="mt-1 flex items-center justify-between">
        {error ? <p className="px-0.5 text-xs font-medium text-red-600">{error}</p> : <span />}
        <p className="px-0.5 text-xs text-ink-muted">
          {value.length}/{SHIORI_PURPOSE_MAX_LENGTH}
        </p>
      </div>
    </div>
  );
}
