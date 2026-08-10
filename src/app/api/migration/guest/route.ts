import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { validateGuestMigrationPayload } from "@/lib/guest-migration-validation";
import { GuestMigrationStageError, migrateGuestData } from "@/lib/guest-migration";

/**
 * ゲスト→クラウド移行API(POST /api/migration/guest)。
 *
 * **エンドポイント名・リクエスト形状は仕様(docs/03_tech_stack.md)に具体例が無いため、
 * このタスクでの仮置き。** 呼び出し元(フロントの移行フロー実装、#99)と合わせること。
 *
 * 対象はテキストデータのみ(しおり/持ち物/TODO/旅程/行きたいスポット)。
 * 写真バイナリの移行は別API(#98)。
 *
 * スコープ: 片道の一括移行専用。ログイン後にF1〜F6が常時読み書きする
 * 一般CRUD APIではない(docs/plans/2026-W33.md オーナー判断#1 推奨A)。
 *
 * 認証: Cookieセッション(anonキー、`createSupabaseServerClient`)で
 * ログイン中のユーザーを確定させ、そのユーザーIDのみを書き込みに使う。
 * リクエストボディに`user_id`を含めても無視する(なりすまし防止)。
 * 実際のINSERTは`service_role`クライアント(`admin.ts`)で行う
 * (RLSはINSERT時点で`auth.uid()`を要求するが、このAPIはCookieセッションを
 * そのままDB接続に使わずservice_roleで確定ユーザーIDを付与するため)。
 *
 * レスポンス例(成功):
 * ```json
 * {"ok":true,"inserted":{"shiori":1,"spots":0,"packing_items":3,"todos":2,"itinerary_entries":0,"shiori_spots":0},"skipped":{"unknown_seed_spot":0,"unauthorized_shiori_id":0}}
 * ```
 *
 * `skipped.unauthorized_shiori_id`: 子データが参照する`shiori_id`がこのユーザー所有の
 * しおりとしてDB上に存在しなかったため書き込まなかった件数(通常は0。IDOR対策)。
 * 参照: `src/lib/guest-migration.ts`のコメント。
 *
 * レスポンス例(失敗・入力検証エラー):
 * ```json
 * {"ok":false,"error":{"message":"入力値が不正です","details":["shiori[0].title: ..."]}}
 * ```
 */

// Cookieセッションを読むため常に最新の状態で処理する。
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  let userId: string;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return Response.json(
        { ok: false, error: { message: "ログインが必要です" } },
        { status: 401 },
      );
    }
    userId = data.user.id;
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    return Response.json(
      { ok: false, error: { message } },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: { message: "リクエストボディをJSONとして解析できません" } },
      { status: 400 },
    );
  }

  const validation = validateGuestMigrationPayload(body);
  if (!validation.ok) {
    return Response.json(
      { ok: false, error: { message: "入力値が不正です", details: validation.errors } },
      { status: 400 },
    );
  }

  try {
    const admin = getSupabaseAdminClient();
    const result = await migrateGuestData(admin, userId, validation.data);
    return Response.json({ ok: true, ...result }, { status: 200 });
  } catch (cause) {
    if (cause instanceof GuestMigrationStageError) {
      return Response.json(
        { ok: false, error: { stage: cause.stage, code: cause.code, message: cause.message } },
        { status: 502 },
      );
    }
    const message = cause instanceof Error ? cause.message : String(cause);
    return Response.json({ ok: false, error: { message } }, { status: 500 });
  }
}
