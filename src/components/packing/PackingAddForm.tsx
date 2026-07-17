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
    // 下部固定タブバー(--s3-tabbar-height)の上に逃がす。docs/design/screens/S3_しおり詳細.md参照
    <div className="sticky bottom-[var(--s3-tabbar-height)] border-t border-neutral-200 bg-white px-4 py-4">
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
          className={`h-11 min-w-0 flex-1 rounded-lg border px-3 text-base text-neutral-900 ${
            error ? "border-red-400 bg-red-50" : "border-neutral-200 bg-white"
          }`}
        />
        <button
          type="button"
          onClick={onSubmit}
          className="h-11 shrink-0 rounded-lg bg-pink-500 px-4 text-base font-semibold text-white"
        >
          追加
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
