import { PACKING_LABEL_MAX_LENGTH } from "@/lib/packing-validation";

interface PackingAddFormProps {
  value: string;
  error: string | null;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

/**
 * S3a AddForm(手動追加フォーム)。
 * 参照: docs/design/screens/S3a_持ち物.md「AddForm(手動追加フォーム)」
 */
export function PackingAddForm({ value, error, onChange, onSubmit }: PackingAddFormProps) {
  return (
    <div className="sticky bottom-0 border-t border-pink-100 bg-pink-50/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          maxLength={PACKING_LABEL_MAX_LENGTH}
          placeholder="例: モバイルバッテリー"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSubmit();
            }
          }}
          className={`h-12 min-w-0 flex-1 rounded-xl border px-4 text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-pink-400 ${
            error ? "border-red-400 bg-red-50" : "border-pink-200 bg-white"
          }`}
        />
        <button
          type="button"
          onClick={onSubmit}
          className="h-12 shrink-0 rounded-xl bg-gradient-to-r from-pink-500 to-rose-400 px-5 text-base font-semibold text-white focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2"
        >
          追加
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
