/**
 * ゲスト→クラウド移行(F8)写真アップロードAPIの入力検証。
 * 参照: docs/03_tech_stack.md「ゲスト→ログインのデータ移行」手順3、
 * CLAUDE.md無料枠ガードレール(Storageバケットの2MB/許可MIMEタイプ制限を外さない)。
 *
 * `supabase/migrations/0001_initial_schema.sql`のStorageバケット設定
 * (`file_size_limit: 2097152`, `allowed_mime_types`)と同じ値をここでも定義し、
 * サーバー側(このAPI)でも同じ制限を検証する(クライアント側リサイズ・
 * バケット設定だけに頼らない多層防御)。
 *
 * `shiori_id`の所有権検証(IDOR対策)はここでは行わない
 * (DBへの問い合わせが必要なため`src/lib/guest-photo-migration.ts`の責務とする)。
 */
import { sanitizeCaption } from "@/lib/photo-validation";

/** Supabase Storage `photos`バケットの Max File Size と同じ値(バイト)。 */
export const MAX_PHOTO_FILE_SIZE_BYTES = 2 * 1024 * 1024;

/** Supabase Storage `photos`バケットの許可MIMEタイプと同じ値。 */
export const ALLOWED_PHOTO_MIME_TYPES = ["image/jpeg", "image/webp", "image/png"] as const;
export type AllowedPhotoMimeType = (typeof ALLOWED_PHOTO_MIME_TYPES)[number];

const MIME_TO_EXTENSION: Record<AllowedPhotoMimeType, string> = {
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/png": "png",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface ValidatedPhotoUploadInput {
  shiori_id: string;
  /** ゲスト側(IndexedDB)で発行済みのID。冪等な再送のキーとしてそのまま`photos.id`に使う。 */
  photo_id: string;
  day_date: string | null;
  caption: string | null;
  file: File;
  mimeType: AllowedPhotoMimeType;
  extension: string;
}

export type PhotoUploadValidationResult =
  | { ok: true; data: ValidatedPhotoUploadInput }
  | { ok: false; errors: string[] };

function isAllowedMimeType(value: string): value is AllowedPhotoMimeType {
  return (ALLOWED_PHOTO_MIME_TYPES as readonly string[]).includes(value);
}

/**
 * `multipart/form-data`で受け取ったフィールドを検証する。
 *
 * 入出力例:
 * ```ts
 * const form = await request.formData();
 * const result = validatePhotoUploadForm(form);
 * // result.ok === true なら result.data.file をStorageへアップロードできる
 * ```
 */
export function validatePhotoUploadForm(form: FormData): PhotoUploadValidationResult {
  const errors: string[] = [];

  const shioriIdRaw = form.get("shiori_id");
  const photoIdRaw = form.get("photo_id");
  const dayDateRaw = form.get("day_date");
  const captionRaw = form.get("caption");
  const fileRaw = form.get("file");

  if (typeof shioriIdRaw !== "string" || !UUID_RE.test(shioriIdRaw)) {
    errors.push("shiori_idはUUID文字列である必要があります");
  }
  if (typeof photoIdRaw !== "string" || !UUID_RE.test(photoIdRaw)) {
    errors.push("photo_idはUUID文字列である必要があります");
  }
  if (dayDateRaw !== null && (typeof dayDateRaw !== "string" || !DATE_RE.test(dayDateRaw))) {
    errors.push("day_dateはYYYY-MM-DDまたは未指定である必要があります");
  }
  if (captionRaw !== null && typeof captionRaw !== "string") {
    errors.push("captionは文字列である必要があります");
  }

  if (!(fileRaw instanceof File)) {
    errors.push("fileは必須です");
  } else {
    if (fileRaw.size <= 0) {
      errors.push("fileが空です");
    }
    if (fileRaw.size > MAX_PHOTO_FILE_SIZE_BYTES) {
      errors.push(`fileは${MAX_PHOTO_FILE_SIZE_BYTES}バイト(2MB)以内である必要があります`);
    }
    if (!isAllowedMimeType(fileRaw.type)) {
      errors.push(`fileのMIMEタイプは${ALLOWED_PHOTO_MIME_TYPES.join("/")}のいずれかである必要があります`);
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const file = fileRaw as File;
  const mimeType = file.type as AllowedPhotoMimeType;

  return {
    ok: true,
    data: {
      shiori_id: shioriIdRaw as string,
      photo_id: photoIdRaw as string,
      day_date: dayDateRaw === null ? null : (dayDateRaw as string),
      caption: captionRaw === null ? null : sanitizeCaption(captionRaw as string),
      file,
      mimeType,
      extension: MIME_TO_EXTENSION[mimeType],
    },
  };
}
