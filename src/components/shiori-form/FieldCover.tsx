import { COVER_COLOR_PRESETS, COVER_EMOJI_PRESETS } from "@/lib/cover-presets";

export type CoverMode = "color" | "emoji";

interface FieldCoverProps {
  mode: CoverMode;
  selectedIndex: number | null;
  onModeChange: (mode: CoverMode) => void;
  onSelect: (index: number) => void;
  disabled?: boolean;
}

/**
 * S2 FieldCover(カバー・任意)。色8種/絵文字8種のプリセットから選択する。
 * 参照: docs/design/screens/S2_しおり作成.md「5. FieldCover」/ docs/design/tokens.md「6.」
 */
export function FieldCover({ mode, selectedIndex, onModeChange, onSelect, disabled }: FieldCoverProps) {
  const presets = mode === "color" ? COVER_COLOR_PRESETS : COVER_EMOJI_PRESETS;

  return (
    <div>
      <p className="mb-1.5 block px-0.5 text-[13px] font-bold text-ink-label">カバー(任意)</p>
      <div className="mb-3 inline-flex rounded-full border border-paper-dashed bg-white p-1">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onModeChange("color")}
          aria-pressed={mode === "color"}
          className={`min-h-10 rounded-full px-4 text-sm ${
            mode === "color" ? "bg-sakura-soft font-bold text-sakura-ink" : "font-medium text-ink-sub"
          }`}
        >
          色
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onModeChange("emoji")}
          aria-pressed={mode === "emoji"}
          className={`min-h-10 rounded-full px-4 text-sm ${
            mode === "emoji" ? "bg-sakura-soft font-bold text-sakura-ink" : "font-medium text-ink-sub"
          }`}
        >
          絵文字
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {presets.map((preset, index) => {
          const selected = selectedIndex === index;
          return (
            <button
              key={preset}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(index)}
              aria-pressed={selected}
              aria-label={mode === "color" ? `カバー色 ${preset}` : `カバー絵文字 ${preset}`}
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                mode === "emoji" ? "border border-paper-dashed bg-white" : ""
              } ${selected ? "ring-2 ring-sakura ring-offset-2 ring-offset-paper-surface" : ""}`}
              style={mode === "color" ? { backgroundColor: preset } : undefined}
            >
              {mode === "emoji" && <span className="text-lg">{preset}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
