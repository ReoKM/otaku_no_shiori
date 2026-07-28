/**
 * ゲスト保存(IndexedDB)およびSupabaseで共有するデータ型。
 * フィールド名はSupabaseの列名(snake_case)に厳密に合わせる。
 * 参照: supabase/migrations/0001_initial_schema.sql / docs/03_tech_stack.md
 *
 * ゲスト(未ログイン)時点では `user_id` を持たない。
 * ログイン移行時にサーバー側で `user_id` を付与してINSERTする。
 * (docs/03_tech_stack.md「ゲスト→ログインのデータ移行」参照)
 */

/** F1 遠征タイプ */
export type TripType = "live" | "seichi" | "stage" | "other";

/**
 * カバー画像の表現。プレフィックス方式の文字列。
 * - `color:#RRGGBB` … 単色カバー
 * - `emoji:<絵文字>` … 絵文字カバー
 */
export type Cover = `color:${string}` | `emoji:${string}`;

/** しおり本体(F1) */
export interface Shiori {
  id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  trip_type: TripType;
  purpose: string | null;
  cover: Cover | null;
  created_at: string;
  updated_at: string;
}

/** 持ち物リストの1件(F2) */
export interface PackingItem {
  id: string;
  shiori_id: string;
  label: string;
  is_checked: boolean;
  sort_order: number;
}

/** TODOリストの1件(F3) */
export interface Todo {
  id: string;
  shiori_id: string;
  label: string;
  due_date: string | null;
  is_done: boolean;
  sort_order: number;
}

/** 旅程の1件(F4)。日付ごとにグルーピングして表示する想定。 */
export interface ItineraryEntry {
  id: string;
  shiori_id: string;
  day_date: string;
  time: string | null;
  title: string;
  place_name: string | null;
  memo: string | null;
  sort_order: number;
}

/** スポットの出典。ゲスト保存の`spots`ストアにはUGC分のみを保存する(シードは同梱JSON参照)。 */
export type SpotSource = "seed" | "ugc";

/** スポットの公開状態。ゲスト保存では常に非公開(private)。 */
export type SpotStatus = "private" | "pending" | "public";

/**
 * 行きたいスポット本体(F5)。ユーザーの自由入力スポットのみをこの型・ストアで扱う。
 * クラウド側`public.spots`と同形状(`source`/`status`列を含む)にしておき、
 * ログイン移行時にそのままINSERTできるようにする。
 * ゲスト保存では常に `source: "ugc"` / `status: "private"` で作成する。
 */
export interface Spot {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  area: string | null;
  source: SpotSource;
  status: SpotStatus;
  created_at: string;
}

/**
 * しおり内の「行きたいスポット」紐付け(F5)。
 * クラウド側は `(shiori_id, spot_id)` の複合主キーのため、ゲスト保存も同じ複合キーで保存する。
 * `spot_id` はUGCスポットの場合`spots`ストアのid、シードスポットの場合は同梱JSON側のid(`seed-`プレフィックス等)を指す。
 */
export interface ShioriSpot {
  shiori_id: string;
  spot_id: string;
  memo: string | null;
  is_visited: boolean;
}

/**
 * 写真とログの1件(F6)。
 * クラウド側`public.photos`は`storage_path`(Supabase Storageのパス文字列)を持つが、
 * ゲスト時点ではアップロード先が無いため、撮影した画像データをそのまま`blob`として保持する。
 * ログイン移行時にこの`blob`をSupabase Storageへアップロードし、
 * 返却された`storage_path`に置き換えてからサーバーにINSERTする設計とする。
 * (docs/03_tech_stack.md「ゲスト→ログインのデータ移行」参照)
 */
export interface Photo {
  id: string;
  shiori_id: string;
  day_date: string | null;
  caption: string | null;
  blob: Blob;
  created_at: string;
}
