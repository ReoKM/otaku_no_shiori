/**
 * 共有画像テンプレート「シンプル」。
 * デザイントーン(仮置き。仕様に指定が無いため裁量で選定。完了報告に明記):
 *   白基調・情報整理型。装飾を抑え、しおりの内容(タイトル/日程/旅程/持ち物)を
 *   読みやすさ優先でカード状に積む。遠征タイプごとのアクセントカラーのみ差し色として使う。
 * 参照: docs/01_service_spec.md F7、docs/design/tokens.md
 */
import { getTripTypeLabel } from "@/lib/trip-type";
import { COLORS, TRIP_TYPE_ACCENT_COLOR } from "./colors";
import { Chip, LogoUrlBar, PhotoRow, takeFirst } from "./common";
import {
  DEFAULT_SERVICE_NAME,
  DEFAULT_SERVICE_URL,
  SHARE_IMAGE_HEIGHT,
  SHARE_IMAGE_WIDTH,
  type ShareImageProps,
} from "./types";

/** これを超える文字数のタイトルはフォントサイズを縮小し、2行までに収める(30文字要件対応) */
const TITLE_LONG_THRESHOLD = 20;
const CONTENT_HORIZONTAL_PADDING = 64;
const PHOTO_AREA_WIDTH = SHARE_IMAGE_WIDTH - CONTENT_HORIZONTAL_PADDING * 2;

export function SimpleTemplate(props: ShareImageProps) {
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
        width: SHARE_IMAGE_WIDTH,
        height: SHARE_IMAGE_HEIGHT,
        backgroundColor: COLORS.bgApp,
        overflow: "hidden",
        fontFamily: "Noto Sans JP",
      }}
    >
      <div style={{ display: "flex", width: "100%", height: 16, backgroundColor: accentColor }} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: `56px ${CONTENT_HORIZONTAL_PADDING}px 0 ${CONTENT_HORIZONTAL_PADDING}px`,
          gap: 36,
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 20 }}>
          <Chip
            label={getTripTypeLabel(props.tripType)}
            bg={COLORS.primarySoft}
            color={COLORS.primarySoftText}
            fontSize={32}
          />
          <span style={{ display: "flex", fontSize: 32, color: COLORS.textSecondary }}>
            {props.dateRangeLabel}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: isLongTitle ? 56 : 76,
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

        {photos.length > 0 ? (
          <PhotoRow
            photos={photos}
            maxWidthPx={PHOTO_AREA_WIDTH}
            heightPx={photos.length === 1 ? 460 : 300}
          />
        ) : null}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <span style={{ display: "flex", fontSize: 36, fontWeight: 700, color: COLORS.textPrimary }}>
            旅程ダイジェスト
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {itineraryItems.length > 0 ? (
              itineraryItems.map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 20,
                    padding: "20px 28px",
                    backgroundColor: COLORS.bgSurface,
                    border: `2px solid ${COLORS.borderDefault}`,
                    borderRadius: 20,
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
              <span style={{ display: "flex", fontSize: 32, color: COLORS.textMuted }}>
                旅程はこれから登録します
              </span>
            )}
          </div>
        </div>

        {highlightItems.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <span style={{ display: "flex", fontSize: 36, fontWeight: 700, color: COLORS.textPrimary }}>
              持ち物・行きたい場所
            </span>
            <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
              {highlightItems.map((label, index) => (
                <Chip
                  key={index}
                  label={label}
                  bg={COLORS.bgSurface}
                  color={COLORS.textPrimary}
                  fontSize={32}
                  border={`2px solid ${COLORS.borderDefault}`}
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
