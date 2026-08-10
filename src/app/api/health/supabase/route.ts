import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkSupabaseConnection } from "@/lib/supabase/health";

/**
 * Supabase疎通確認エンドポイント(GET /api/health/supabase)。
 *
 * サーバー用クライアント(anonキー + Cookie)でDBへ1クエリ投げ、結果を返す。
 * 環境変数・マイグレーション適用・APIキーのどれが欠けているかを切り分けるために使う。
 *
 * 成功例:
 *   $ curl -s localhost:3000/api/health/supabase
 *   {"ok":true,"table":"spots","visibleRowCount":0}
 *
 * 失敗例:
 *   {"ok":false,"table":"spots","error":{"code":"PGRST205","message":"..."},"hint":"テーブル spots が見つかりません。..."}
 *
 * 秘密情報(APIキー・接続URL)はレスポンスに含めない。
 */

// Cookieを読むうえ、結果を常に最新にしたいのでキャッシュしない。
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  let result;
  try {
    const supabase = await createSupabaseServerClient();
    result = await checkSupabaseConnection(supabase);
  } catch (cause) {
    // クライアント生成の時点で失敗するケース(環境変数の未設定など)。
    const message = cause instanceof Error ? cause.message : String(cause);
    return Response.json(
      {
        ok: false,
        table: null,
        error: { code: null, message },
        hint: "supabase/README.md の手順で環境変数(.env.local / Netlify)を設定してください。",
      },
      { status: 503 },
    );
  }

  return Response.json(result, { status: result.ok ? 200 : 503 });
}
