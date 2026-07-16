/**
 * 共有画像テンプレート(simple/nigiyaka)の共通部品。
 * satori向けJSX(flexレイアウトのみ、gridは使わない)。
 * 参照: .claude/agents/share-image-designer.md「手順2. 既存テンプレの共通部品(ロゴ・URL帯)を再利用する」
 */
import { COLORS } from "./colors";
import type { ShareImagePhoto } from "./types";

/** 配列の先頭N件だけを取り出す(旅程ダイジェスト・持ち物・写真の表示上限に使う) */
export function takeFirst<T>(items: readonly T[], count: number): T[] {
  return items.slice(0, Math.max(0, count));
}

export interface LogoUrlBarProps {
  serviceName: string;
  serviceUrl: string;
  accentColor: string;
}

/**
 * 下部に固定配置するサービスロゴ+URL帯(F7必須要件)。
 * 権利のある画像・ロゴは使わず、テキストのみで組む(「し」を図案化した文字ロゴマーク)。
 */
export function LogoUrlBar({ serviceName, serviceUrl, accentColor }: LogoUrlBarProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "32px 56px",
        backgroundColor: COLORS.textPrimary,
      }}
    >
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 64,
            height: 64,
            borderRadius: 20,
            backgroundColor: accentColor,
            color: "#ffffff",
            fontSize: 36,
            fontWeight: 700,
          }}
        >
          栞
        </div>
        <span style={{ fontSize: 40, fontWeight: 700, color: "#ffffff" }}>{serviceName}</span>
      </div>
      <span
        style={{
          display: "flex",
          fontSize: 32,
          color: "#d4d4d4",
          maxWidth: 460,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {serviceUrl}
      </span>
    </div>
  );
}

export interface SectionHeadingProps {
  label: string;
  color: string;
  markerColor: string;
}

/**
 * セクション見出し。絵文字・記号グリフはNoto Sans JPのフォントサブセットに含まれない場合があり
 * satoriのレンダリングエラーに繋がるため、色付き四角形(テキストではない図形)で装飾する。
 */
export function SectionHeading({ label, color, markerColor }: SectionHeadingProps) {
  return (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 16 }}>
      <div style={{ display: "flex", width: 20, height: 20, borderRadius: 6, backgroundColor: markerColor }} />
      <span style={{ display: "flex", fontSize: 36, fontWeight: 700, color }}>{label}</span>
    </div>
  );
}

export interface ChipProps {
  label: string;
  bg: string;
  color: string;
  fontSize?: number;
  border?: string;
}

/** ピル型のバッジ(遠征タイプ・持ち物/スポットの一部表示に使う) */
export function Chip({ label, bg, color, fontSize = 32, border }: ChipProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "14px 28px",
        borderRadius: 999,
        backgroundColor: bg,
        color,
        fontSize,
        fontWeight: 700,
        ...(border ? { border } : {}),
      }}
    >
      {label}
    </div>
  );
}

export interface PhotoRowProps {
  photos: ShareImagePhoto[];
  /** 写真エリア全体の幅(px)。1〜3枚を均等割りする */
  maxWidthPx: number;
  heightPx: number;
  gapPx?: number;
  radiusPx?: number;
  /** 写真ごとの回転角(deg)。にぎやかテンプレの演出用。省略時は回転しない */
}

/**
 * ユーザー写真1〜3枚を横並びで表示する。はみ出しは overflow: hidden でトリミングする
 * (.claude/agents/share-image-designer.md デザインルール)。
 */
export function PhotoRow({
  photos,
  maxWidthPx,
  heightPx,
  gapPx = 16,
  radiusPx = 24,
}: PhotoRowProps) {
  const shown = takeFirst(photos, 3);
  if (shown.length === 0) {
    return null;
  }
  const tileWidth = (maxWidthPx - gapPx * (shown.length - 1)) / shown.length;

  // satoriは<img>のobject-fit: coverと transform: rotate をサポートしないため、
  // divのbackground-image + background-size: cover でアスペクト比を保ったまま描画する
  // (傾き演出は非対応のため行わない。レビュー指摘反映)。
  return (
    <div style={{ display: "flex", flexDirection: "row", width: maxWidthPx, gap: gapPx }}>
      {shown.map((photo, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            width: tileWidth,
            height: heightPx,
            borderRadius: radiusPx,
            overflow: "hidden",
            backgroundColor: COLORS.borderDefault,
            backgroundImage: `url("${photo.dataUrl}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ))}
    </div>
  );
}
