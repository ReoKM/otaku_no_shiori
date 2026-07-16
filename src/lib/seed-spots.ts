/**
 * F5(行きたいスポット)の運営シードスポットデータ。
 * 参照: docs/design/screens/S4_スポット検索.md「S4は…同梱JSON…ビルド時にアプリへバンドル」
 *
 * `seeds/spots/*.json` をビルド時に静的インポートする(オーナー判断1の推奨A)。
 * Supabase接続は行わず、ゲスト・ログイン問わずオフラインで検索・閲覧できる。
 *
 * シードデータを追加する場合は `SEED_SPOT_FILES` に import 文を追記する
 * (現状は `seeds/spots/hinatafes.json` の1ファイルのみ)。
 */
import hinatafes from "../../seeds/spots/hinatafes.json";

/** `docs/design/screens/S3c_旅程スポット.md`「カテゴリ表示名」に列挙されたカテゴリ値。 */
export type SeedSpotCategory = "venue" | "seichi" | "food" | "goods" | "other";

export interface SeedSpot {
  /** `seed-` プレフィックス付きID(自由入力スポットのUUIDと衝突させないため)。 */
  id: string;
  name: string;
  description: string;
  category: SeedSpotCategory;
  area: string;
  /** Googleマップ検索に使うクエリ(`buildGoogleMapsSearchUrl`へ渡す)。 */
  map_query: string;
  source: "seed";
  /** 注意書き(任意)。 */
  caution?: string;
  /** 出典URL(運営向け。本画面ではユーザーに表示しない。S4仕様「不明点・仮置き」参照)。 */
  refs: string[];
}

interface SeedSpotFile {
  spots: SeedSpot[];
}

const SEED_SPOT_FILES: SeedSpotFile[] = [hinatafes as SeedSpotFile];

/** 全シードスポット(全ファイルを結合)。 */
export const SEED_SPOTS: SeedSpot[] = SEED_SPOT_FILES.flatMap((file) => file.spots);

/** `id`からシードスポットを1件取得する。存在しない場合は`undefined`。 */
export function getSeedSpotById(id: string): SeedSpot | undefined {
  return SEED_SPOTS.find((spot) => spot.id === id);
}

/** 指定idが同梱シードスポットのidかどうか判定する(UGCスポットとの判別に使う)。 */
export function isSeedSpotId(id: string): boolean {
  return SEED_SPOTS.some((spot) => spot.id === id);
}
