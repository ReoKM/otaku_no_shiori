import { parseCover } from "@/lib/cover";
import type { Cover } from "@/types/shiori";

/**
 * ShioriCard左側のカバー表示(40×40pxの円)。
 * 参照: docs/design/screens/S1_ホーム一覧.md「ShioriCard」
 */
export function CoverAvatar({ cover }: { cover: Cover | null }) {
  const parsed = parseCover(cover);

  if (parsed?.type === "color") {
    return (
      <span
        className="h-10 w-10 shrink-0 rounded-full"
        style={{ backgroundColor: parsed.value }}
        aria-hidden="true"
      />
    );
  }

  if (parsed?.type === "emoji") {
    return (
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-50 text-lg"
        aria-hidden="true"
      >
        {parsed.value}
      </span>
    );
  }

  // cover未設定(理論上は無いはずだが、guest-store上null許容のためフォールバック)。
  return (
    <span
      className="h-10 w-10 shrink-0 rounded-full bg-neutral-200"
      aria-hidden="true"
    />
  );
}
