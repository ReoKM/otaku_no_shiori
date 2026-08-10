import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabaseへ実際に到達できるかを確かめる疎通チェック。
 *
 * 確認対象は`spots`テーブル。理由は次の2つ:
 * - 未ログイン(anonキー)でも`status = 'public'` / `source = 'seed'`の行を読めるRLS設定なので、
 *   ログインなしで「DBまで届いたか」を判定できる(`supabase/migrations/0001_initial_schema.sql`)
 * - 行が0件でも成功と判定できる(件数ではなくクエリが通ったかを見る)
 *
 * 行データは取得せず件数だけを取る(`head: true`)。無料枠の帯域を使わないため。
 */

/** 疎通チェックの対象テーブル。 */
export const HEALTH_CHECK_TABLE = "spots";

/** 疎通チェックの結果。 */
export type SupabaseHealthResult =
  | {
      ok: true;
      table: string;
      /** anonキーで見えている行数(0でも疎通は成功)。件数を取れなかった場合はnull。 */
      visibleRowCount: number | null;
    }
  | {
      ok: false;
      table: string;
      /** 失敗理由。秘密情報を含めないよう、PostgRESTのcode/messageのみを載せる。 */
      error: {
        code: string | null;
        message: string;
      };
      /** 対処のヒント(オーナー向け)。 */
      hint: string;
    };

/**
 * エラー内容から、オーナーが次に取るべき行動を1行で返す。
 *
 * 例: `toHealthHint("42P01", "...")` → 「マイグレーション未適用の可能性...」
 */
export function toHealthHint(code: string | null, message: string): string {
  // PostgRESTはテーブル未作成を PGRST205(スキーマキャッシュに無い)や 42P01 で返す。
  if (code === "42P01" || code === "PGRST205") {
    return `テーブル ${HEALTH_CHECK_TABLE} が見つかりません。supabase/migrations/0001_initial_schema.sql をSupabaseのSQL Editorで実行してください。`;
  }
  // APIキーが違う/失効している。
  if (code === "PGRST301" || /invalid.*(api key|jwt)/i.test(message)) {
    return "APIキーが不正です。NEXT_PUBLIC_SUPABASE_ANON_KEY を Supabase の Project Settings → API の値と照合してください。";
  }
  // URLの打ち間違い・ネットワーク不達。
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|getaddrinfo/i.test(message)) {
    return "Supabaseへ到達できません。NEXT_PUBLIC_SUPABASE_URL の値とネットワーク接続を確認してください。";
  }
  return "supabase/README.md の接続手順(環境変数・マイグレーション適用)を確認してください。";
}

/**
 * 渡されたクライアントでSupabaseへ疎通確認する。
 *
 * 例外は投げず、必ず`SupabaseHealthResult`を返す(呼び出し側で分岐しやすくするため)。
 *
 * 使用例:
 * ```ts
 * const result = await checkSupabaseConnection(await createSupabaseServerClient());
 * if (result.ok) console.log(`接続成功(可視行数: ${result.visibleRowCount})`);
 * ```
 */
export async function checkSupabaseConnection(
  client: SupabaseClient,
): Promise<SupabaseHealthResult> {
  try {
    const { count, error } = await client
      .from(HEALTH_CHECK_TABLE)
      .select("id", { count: "exact", head: true });

    if (error) {
      // ネットワーク例外由来のエラーは code が空文字で返ることがある。nullに寄せて扱いを1本化する。
      const code = error.code || null;
      return {
        ok: false,
        table: HEALTH_CHECK_TABLE,
        error: { code, message: error.message },
        hint: toHealthHint(code, error.message),
      };
    }

    return {
      ok: true,
      table: HEALTH_CHECK_TABLE,
      visibleRowCount: count ?? null,
    };
  } catch (cause) {
    // 環境変数の未設定(MissingSupabaseEnvError)やネットワーク例外はここに来る。
    const message = cause instanceof Error ? cause.message : String(cause);
    return {
      ok: false,
      table: HEALTH_CHECK_TABLE,
      error: { code: null, message },
      hint: toHealthHint(null, message),
    };
  }
}
