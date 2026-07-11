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
