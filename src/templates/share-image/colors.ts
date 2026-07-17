/**
 * 共有画像テンプレート用の配色定数。
 * 出典: docs/design/tokens.md(Tailwindデフォルトパレットの16進値)。
 * satoriはTailwindクラス/CSS変数を解釈できないため、ここでトークンを16進値に変換して保持する。
 */
import type { TripType } from "@/types/shiori";

export const COLORS = {
  /** color-primary (pink-500) */
  primary: "#747bd9",
  /** color-primary-hover (pink-600) */
  primaryHover: "#595eb4",
  /** color-primary-soft (pink-100) */
  primarySoft: "#ebf0ff",
  /** color-primary-soft-text (pink-700) */
  primarySoftText: "#404489",
  /** color-bg-app (neutral-50) */
  bgApp: "#fbfaf9",
  /** color-bg-surface (white) */
  bgSurface: "#ffffff",
  /** color-border-default (neutral-200) */
  borderDefault: "#e2ddd9",
  /** color-text-primary (neutral-900) */
  textPrimary: "#1d1a18",
  /** color-text-secondary (neutral-500) */
  textSecondary: "#8d847e",
  /** color-text-muted (neutral-400) */
  textMuted: "#aba39c",
} as const;

/**
 * 遠征タイプ(F1)ごとのアクセントカラー。
 * docs/design/tokens.md「1-6. カバー(しおり)プリセット」の8色から代表色を割り当てる(仮置き。
 * 仕様に遠征タイプ↔色の指定が無いため、共有画像デザイナーの裁量で選定。完了報告に明記)。
 */
export const TRIP_TYPE_ACCENT_COLOR: Record<TripType, string> = {
  live: "#F472B6", // cover-color-1 pink-400
  seichi: "#38BDF8", // cover-color-2 sky-400
  stage: "#A78BFA", // cover-color-5 violet-400
  other: "#94A3B8", // cover-color-8 slate-400
};
