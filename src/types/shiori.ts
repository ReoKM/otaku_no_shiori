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
  /**
   * 予算総額(円単位の整数)。未設定時はnull。
   * 参照: docs/design/screens/S3b2_予算.md「BudgetSummaryCard」
   * (F番号未採番・オーナー草案。docs/01_service_spec.md未反映)
   */
  budget_total: number | null;
  /**
   * 予算セクションのメモ(最大200文字)。未入力時はnull。
   * 参照: docs/design/screens/S3b2_予算.md「BudgetMemoCard」
   * (費目ごとではなく予算セクション全体で1本のメモのため、費目=BudgetItemではなくここに持たせる)
   */
  budget_memo: string | null;
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

/**
 * 予算の費目1件(F番号未採番・オーナー草案)。
 * 参照: docs/design/screens/S3b2_予算.md「BudgetRow」/「BudgetActionSheet」
 *
 * `amount`は円単位の整数(小数点は入力させない仕様)。
 * 費目単位のメモはS3b2仕様に無い(メモは予算セクション全体で1本、`Shiori.budget_memo`に持つ)ため持たない。
 */
export interface BudgetItem {
  id: string;
  shiori_id: string;
  label: string;
  amount: number;
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
