/**
 * F4(旅程)の場所名からGoogleマップ検索リンクを作る。
 * docs/01_service_spec.md: 場所名は必ず encodeURIComponent でURLエンコードする。
 */
export function buildGoogleMapsSearchUrl(placeName: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName)}`;
}
