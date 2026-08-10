/**
 * ゲスト→クラウド移行(F8)の写真バイナリ個別アップロード本体。
 * 参照: docs/03_tech_stack.md「ゲスト→ログインのデータ移行」手順3
 * (「写真バイナリを1枚ずつSupabase Storageへアップロードし、返ってきた`storage_path`を
 * 対応する`photos`レコードに紐付けて登録する」)
 *
 * テキスト一括移行(`src/lib/guest-migration.ts`、#97)と同じく`service_role`クライアント
 * (`src/lib/supabase/admin.ts`)で書き込む。このモジュール自身は認証を行わない。
 * 呼び出し側(Route Handler)がCookieセッションから確定させた`userId`を渡すこと。
 *
 * IDOR対策(#97 PR #108の教訓): アップロード対象の`shiori_id`が
 * 「このユーザーが所有するしおり」であることを、書き込み前に必ずDBへ問い合わせて確認する
 * (service_role接続はRLSを無視するため、ここで確認しないとIDORが成立してしまう)。
 *
 * 写真枚数上限(F6・CLAUDE.md無料枠ガードレール「写真上限(1しおり20枚)は環境変数でのみ
 * 変更可」)のサーバー側強制: クライアント側チェック(`getMaxPhotosPerShiori`、
 * `src/components/log/LogTab.tsx`)はゲストのIndexedDB書き込み時のみに効き、
 * このAPIへ直接叩けば迂回できてしまう。そのためここでも所有権確認と同じタイミングで
 * `photos`テーブルの既存件数を`shiori_id`で数え、`getMaxPhotosPerShiori()`
 * (`src/lib/photo-limit.ts`。上限値はここで再定義せず必ず再利用する)と比較してから
 * アップロードする。件数には自分自身(同じ`photo_id`)の既存行は含めない
 * (同じ写真の再送=冪等なリトライを上限超過として誤って拒否しないため)。
 *
 * 冪等性: Storageパスに`photo_id`(ゲスト側=IndexedDBで発行済みのID)を含めるため、
 * 同じ写真の再送は同じパスへの上書き(`upsert: true`)になる。`photos`テーブルへの
 * INSERTも主キー`id`で`upsert(..., { ignoreDuplicates: true })`するため、
 * 部分失敗後に同じ写真を再送しても安全(1枚ずつ独立して失敗分のみ再送できる)。
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { getMaxPhotosPerShiori } from "@/lib/photo-limit";
import type { ValidatedPhotoUploadInput } from "@/lib/photo-upload-validation";

export type PhotoMigrationFailureReason =
  | "shiori_not_owned"
  | "photo_limit_check_failed"
  | "photo_limit_exceeded"
  | "storage_upload_failed"
  | "db_insert_failed";

/** どの段階で失敗したかを保持するエラー。 */
export class PhotoMigrationError extends Error {
  readonly reason: PhotoMigrationFailureReason;
  readonly code: string | null;

  constructor(reason: PhotoMigrationFailureReason, message: string, code?: string | null) {
    super(message);
    this.name = "PhotoMigrationError";
    this.reason = reason;
    this.code = code ?? null;
  }
}

export interface PhotoMigrationResult {
  photo_id: string;
  storage_path: string;
}

/**
 * `{user_id}/{shiori_id}/{filename}`規約(supabase/README.md)に従ったStorageパスを組み立てる。
 * ファイル名に`photo_id`を使うことで、同じ写真の再送が同じパスへの上書きになる(冪等性)。
 */
export function buildPhotoStoragePath(
  userId: string,
  shioriId: string,
  photoId: string,
  extension: string,
): string {
  return `${userId}/${shioriId}/${photoId}.${extension}`;
}

/**
 * 検証済みの1枚をアップロードし、`photos`テーブルへ紐付ける。
 *
 * 使用例:
 * ```ts
 * const admin = getSupabaseAdminClient();
 * const result = await migrateGuestPhoto(admin, userId, validatedInput);
 * // result.storage_path をクライアントの進捗表示に使う
 * ```
 */
export async function migrateGuestPhoto(
  admin: SupabaseClient,
  userId: string,
  input: ValidatedPhotoUploadInput,
): Promise<PhotoMigrationResult> {
  // --- IDOR対策: このユーザーが所有するしおりかをDB上で確認してからアップロードする。
  // service_roleクライアントはRLSを無視するため、ここで確認しない限り
  // 他人の実shiori_idを渡すだけで写真を紐付けられてしまう。
  const { data: shioriRow, error: shioriError } = await admin
    .from("shiori")
    .select("id")
    .eq("id", input.shiori_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (shioriError) {
    throw new PhotoMigrationError(
      "shiori_not_owned",
      `しおりの所有権確認に失敗しました: ${shioriError.message}`,
      shioriError.code ?? null,
    );
  }
  if (!shioriRow) {
    // 「存在しない」と「他人の所有」を区別する情報は返さない(IDOR対策)。
    throw new PhotoMigrationError("shiori_not_owned", "指定されたしおりが見つかりません");
  }

  // --- 写真枚数上限(F6)のサーバー側強制: 自分自身(同じphoto_id)の既存行を除いた
  // 件数が上限以上なら、これ以上は受け入れない。除外することで同じ写真の冪等な
  // 再送を上限超過として誤検知しない。
  const { count: existingOtherPhotoCount, error: countError } = await admin
    .from("photos")
    .select("id", { count: "exact", head: true })
    .eq("shiori_id", input.shiori_id)
    .neq("id", input.photo_id);

  if (countError) {
    throw new PhotoMigrationError(
      "photo_limit_check_failed",
      `写真枚数の確認に失敗しました: ${countError.message}`,
      countError.code ?? null,
    );
  }

  const maxPhotos = getMaxPhotosPerShiori();
  if ((existingOtherPhotoCount ?? 0) >= maxPhotos) {
    throw new PhotoMigrationError(
      "photo_limit_exceeded",
      `このしおりの写真は上限(${maxPhotos}枚)に達しています`,
    );
  }

  const storagePath = buildPhotoStoragePath(userId, input.shiori_id, input.photo_id, input.extension);

  const { error: uploadError } = await admin.storage.from("photos").upload(storagePath, input.file, {
    contentType: input.mimeType,
    upsert: true,
  });
  if (uploadError) {
    throw new PhotoMigrationError(
      "storage_upload_failed",
      `写真のアップロードに失敗しました: ${uploadError.message}`,
    );
  }

  const { error: insertError } = await admin
    .from("photos")
    .upsert(
      [
        {
          id: input.photo_id,
          shiori_id: input.shiori_id,
          day_date: input.day_date,
          caption: input.caption,
          storage_path: storagePath,
        },
      ],
      { onConflict: "id", ignoreDuplicates: true },
    );
  if (insertError) {
    throw new PhotoMigrationError(
      "db_insert_failed",
      `写真データの登録に失敗しました: ${insertError.message}`,
      insertError.code ?? null,
    );
  }

  return { photo_id: input.photo_id, storage_path: storagePath };
}
