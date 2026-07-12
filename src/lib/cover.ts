/**
 * しおりカバー(`shiori.cover`)の生成・解釈ロジック。
 * 保存形式: `color:#RRGGBB` または `emoji:<絵文字>` のプレフィックス方式。
 * 参照: docs/design/tokens.md「6. カバー(しおり)プリセット」(アーキテクト確定仕様)
 */
import type { Cover } from "@/types/shiori";

/** 未選択時に自動採用するデフォルトカバー(仮置き。docs/design/screens/S2_しおり作成.md参照)。 */
export const DEFAULT_COVER: Cover = "color:#F472B6";

export function buildColorCover(hex: string): Cover {
  return `color:${hex}`;
}

export function buildEmojiCover(emoji: string): Cover {
  return `emoji:${emoji}`;
}

export type ParsedCover =
  | { type: "color"; value: string }
  | { type: "emoji"; value: string };

/** cover文字列をプレフィックスごとに解釈する。未知の形式・空値はnullを返す。 */
export function parseCover(cover: string | null | undefined): ParsedCover | null {
  if (!cover) {
    return null;
  }
  if (cover.startsWith("color:")) {
    return { type: "color", value: cover.slice("color:".length) };
  }
  if (cover.startsWith("emoji:")) {
    return { type: "emoji", value: cover.slice("emoji:".length) };
  }
  return null;
}

/** cover未設定(null)の場合にデフォルト値を補って返す。 */
export function resolveCoverOrDefault(cover: Cover | null | undefined): Cover {
  return cover ?? DEFAULT_COVER;
}
