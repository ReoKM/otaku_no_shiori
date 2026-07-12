/**
 * 共有画像テンプレート「にぎやか」。
 * デザイントーン(仮置き。仕様に指定が無いため裁量で選定。完了報告に明記):
 *   遠征タイプのアクセントカラーでグラデーション背景+装飾円を敷き、タイトルを白カードで
 *   浮かせる「にぎやか」な見た目にする。持ち物・旅程は彩度の高いチップで密度高く見せる。
 *   権利のある画像・ロゴ(アーティスト写真等)は一切使わず、CSSのみで装飾する。
 * 参照: docs/01_service_spec.md F7、docs/design/tokens.md
 */
import { getTripTypeLabel } from "@/lib/trip-type";
import { COLORS, TRIP_TYPE_ACCENT_COLOR } from "./colors";
import { Chip, LogoUrlBar, PhotoRow, SectionHeading, takeFirst } from "./common";
import {
  DEFAULT_SERVICE_NAME,
  DEFAULT_SERVICE_URL,
  SHARE_IMAGE_HEIGHT,
  SHARE_IMAGE_WIDTH,
  type ShareImageProps,
} from "./types";

/** これを超える文字数のタイトルはフォントサイズを縮小し、2行までに収める(30文字要件対応) */
const TITLE_LONG_THRESHOLD = 20;
const CONTENT_HORIZONTAL_PADDING = 56;
const PHOTO_AREA_WIDTH = SHARE_IMAGE_WIDTH - CONTENT_HORIZONTAL_PADDING * 2 - 48;

export function NigiyakaTemplate(props: ShareImageProps) {
  const accentColor = TRIP_TYPE_ACCENT_COLOR[props.tripType];
  const serviceName = props.serviceName ?? DEFAULT_SERVICE_NAME;
  const serviceUrl = props.serviceUrl ?? DEFAULT_SERVICE_URL;
  const itineraryItems = takeFirst(props.itineraryDigest, 3);
  const highlightItems = takeFirst(props.highlightItems, 4);
  const photos = takeFirst(props.photos, 3);
  const isLongTitle = props.title.length > TITLE_LONG_THRESHOLD;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        position: "relative",
        width: SHARE_IMAGE_WIDTH,
        height: SHARE_IMAGE_HEIGHT,
        overflow: "hidden",
        backgroundImage: `linear-gradient(160deg, ${accentColor} 0%, ${COLORS.primary} 55%, ${COLORS.primaryHover} 100%)`,
        fontFamily: "Noto Sans JP",
      }}
    >
      {/* 装飾円(にぎやか演出。権利のある画像は使わずCSSのみで生成) */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: -120,
          left: -100,
          width: 420,
          height: 420,
          borderRadius: 420,
          backgroundColor: "rgba(255,255,255,0.16)",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 260,
          right: -140,
          width: 320,
          height: 320,
          borderRadius: 320,
          backgroundColor: "rgba(255,255,255,0.14)",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: 220,
          left: -80,
          width: 260,
          height: 260,
          borderRadius: 260,
          backgroundColor: "rgba(255,255,255,0.12)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: `72px ${CONTENT_HORIZONTAL_PADDING}px 0 ${CONTENT_HORIZONTAL_PADDING}px`,
          gap: 32,
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 16 }}>
          <Chip label={getTripTypeLabel(props.tripType)} bg="rgba(255,255,255,0.92)" color={accentColor} fontSize={32} />
          <span style={{ display: "flex", fontSize: 32, fontWeight: 700, color: "#ffffff" }}>
            {props.dateRangeLabel}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#ffffff",
            borderRadius: 32,
            padding: "40px 44px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: isLongTitle ? 52 : 68,
              fontWeight: 700,
              color: COLORS.textPrimary,
              lineHeight: 1.35,
              wordBreak: "break-word",
              overflow: "hidden",
              lineClamp: 2,
            }}
          >
            {props.title}
          </div>
        </div>

        {photos.length > 0 ? (
          <PhotoRow
            photos={photos}
            maxWidthPx={PHOTO_AREA_WIDTH}
            heightPx={photos.length === 1 ? 440 : 280}
            rotationsDeg={photos.length > 1 ? [-3, 3, -2] : undefined}
          />
        ) : null}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <SectionHeading label="旅程ダイジェスト" color="#ffffff" markerColor={COLORS.bgSurface} />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {itineraryItems.length > 0 ? (
              itineraryItems.map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 20,
                    padding: "18px 28px",
                    backgroundColor: "rgba(255,255,255,0.94)",
                    borderRadius: 999,
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      fontSize: 32,
                      fontWeight: 700,
                      color: accentColor,
                      minWidth: 200,
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    style={{
                      display: "flex",
                      fontSize: 32,
                      color: COLORS.textPrimary,
                      overflow: "hidden",
                      lineClamp: 1,
                    }}
                  >
                    {item.text}
                  </span>
                </div>
              ))
            ) : (
              <span style={{ display: "flex", fontSize: 32, color: "rgba(255,255,255,0.85)" }}>
                旅程はこれから登録します
              </span>
            )}
          </div>
        </div>

        {highlightItems.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <SectionHeading label="持ち物・行きたい場所" color="#ffffff" markerColor={COLORS.bgSurface} />
            <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
              {highlightItems.map((label, index) => (
                <Chip
                  key={index}
                  label={label}
                  bg="rgba(255,255,255,0.94)"
                  color={COLORS.primaryHover}
                  fontSize={32}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <LogoUrlBar serviceName={serviceName} serviceUrl={serviceUrl} accentColor={accentColor} />
    </div>
  );
}
