import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { validatePhotoUploadForm } from "@/lib/photo-upload-validation";
import { PhotoMigrationError, migrateGuestPhoto } from "@/lib/guest-photo-migration";

/**
 * ゲスト→クラウド移行API・写真アップロード(POST /api/migration/photos)。
 *
 * **エンドポイント名・リクエスト形状は仕様(docs/03_tech_stack.md)に具体例が無いため、
 * このタスク(#98)での仮置き。** 呼び出し元(フロントの移行フロー実装、#99)と合わせること。
 *
 * テキストデータの一括移行(`POST /api/migration/guest`、#97)とは別エンドポイント。
 * 写真は1リクエスト=1枚として送る設計にした(枚数が多い場合に進捗表示+失敗分のみ
 * 再送できるようにするため。参照: docs/03_tech_stack.md「ゲスト→ログインのデータ移行」手順3)。
 *
 * リクエストは`multipart/form-data`。フィールド:
 * - `shiori_id` (UUID・必須): 紐付け先のしおり。事前に`/api/migration/guest`で
 *   移行済み(=このユーザーが所有)である必要がある
 * - `photo_id` (UUID・必須): ゲスト側(IndexedDB)で発行済みのID。再送時も同じ値を送ること
 *   (Storageパス・`photos.id`の両方に使い、冪等な再送を成立させるため)
 * - `day_date` (YYYY-MM-DD・任意)
 * - `caption` (文字列・任意。50文字超は切り詰め)
 * - `file` (必須): 画像本体。2MB以下・image/jpeg,image/webp,image/pngのいずれか
 *
 * 認証: Cookieセッション(anonキー、`createSupabaseServerClient`)でログイン中の
 * ユーザーを確定させ、そのユーザーIDのみを書き込みに使う。
 * `shiori_id`がこのユーザー所有のしおりであることをDBへ問い合わせて確認してから
 * アップロードする(IDOR対策。#97 PR #108の教訓を踏襲。詳細は
 * `src/lib/guest-photo-migration.ts`のコメント)。
 *
 * サイズ・MIMEタイプはクライアント側リサイズ・Storageバケット設定だけに頼らず、
 * このAPIでも検証する(多層防御。`src/lib/photo-upload-validation.ts`)。
 *
 * レスポンス例(成功):
 * ```json
 * {"ok":true,"photo_id":"…","storage_path":"<user_id>/<shiori_id>/<photo_id>.jpg"}
 * ```
 *
 * レスポンス例(失敗・他人のしおりへのアップロード試行):
 * ```json
 * {"ok":false,"error":{"reason":"shiori_not_owned","message":"指定されたしおりが見つかりません"}}
 * ```
 *
 * 1枚ずつ成否を返す設計のため、失敗した写真だけをこのAPIへ再送すればよい
 * (`photo_id`が同じなら、Storage側は上書き・`photos`テーブル側はupsertのため冪等)。
 */

// Cookieセッションを読むため常に最新の状態で処理する。
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  let userId: string;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return Response.json({ ok: false, error: { message: "ログインが必要です" } }, { status: 401 });
    }
    userId = data.user.id;
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    return Response.json({ ok: false, error: { message } }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json(
      { ok: false, error: { message: "リクエストボディをmultipart/form-dataとして解析できません" } },
      { status: 400 },
    );
  }

  const validation = validatePhotoUploadForm(form);
  if (!validation.ok) {
    return Response.json(
      { ok: false, error: { message: "入力値が不正です", details: validation.errors } },
      { status: 400 },
    );
  }

  try {
    const admin = getSupabaseAdminClient();
    const result = await migrateGuestPhoto(admin, userId, validation.data);
    return Response.json({ ok: true, ...result }, { status: 200 });
  } catch (cause) {
    if (cause instanceof PhotoMigrationError) {
      const status = cause.reason === "shiori_not_owned" ? 404 : 502;
      return Response.json(
        { ok: false, error: { reason: cause.reason, code: cause.code, message: cause.message } },
        { status },
      );
    }
    const message = cause instanceof Error ? cause.message : String(cause);
    return Response.json({ ok: false, error: { message } }, { status: 500 });
  }
}
