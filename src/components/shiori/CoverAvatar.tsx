import { parseCover } from "@/lib/cover";
import type { Cover } from "@/types/shiori";

/**
 * ShioriCard左側のカバー表示(44×44pxの角丸)。
 * 参照: docs/design/screens/S1_ホーム一覧.md「ShioriCard」
 *
 * 円ではなく角丸にして、S3のチェックボックスやカードと同じ「紙に貼ったラベル」の印象に揃える。
 */
export function CoverAvatar({ cover }: { cover: Cover | null }) {
  const parsed = parseCover(cover);

  if (parsed?.type === "color") {
    return (
      <span
        className="h-11 w-11 shrink-0 rounded-xl"
        style={{ backgroundColor: parsed.value }}
        aria-hidden="true"
      />
    );
  }

  if (parsed?.type === "emoji") {
    return (
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-paper-border bg-paper text-xl"
        aria-hidden="true"
      >
        {parsed.value}
      </span>
    );
  }

  // cover未設定(理論上は無いはずだが、guest-store上null許容のためフォールバック)。
  return <span className="h-11 w-11 shrink-0 rounded-xl bg-paper-track" aria-hidden="true" />;
}
