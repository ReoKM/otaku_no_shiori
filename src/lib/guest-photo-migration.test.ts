import { afterEach, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { PhotoMigrationError, buildPhotoStoragePath, migrateGuestPhoto } from "./guest-photo-migration";
import type { ValidatedPhotoUploadInput } from "./photo-upload-validation";

const USER_ID = "user-1";
const SHIORI_ID = "11111111-1111-4111-8111-111111111111";
const PHOTO_ID = "22222222-2222-4222-8222-222222222222";

function validInput(overrides: Partial<ValidatedPhotoUploadInput> = {}): ValidatedPhotoUploadInput {
  return {
    shiori_id: SHIORI_ID,
    photo_id: PHOTO_ID,
    day_date: "2026-08-10",
    caption: "開演前",
    file: new File([new Uint8Array(10)], "photo.jpg", { type: "image/jpeg" }),
    mimeType: "image/jpeg",
    extension: "jpg",
    ...overrides,
  };
}

interface FakeClientOptions {
  /** shiori所有権チェックの結果。undefinedなら「見つからない」、Errorなら問い合わせ自体が失敗。 */
  ownedShioriRow?: { id: string } | null | Error;
  /**
   * 写真枚数上限チェックの`count`クエリが返す件数(自分自身のphoto_idを除いた既存件数)。
   * `Error`を渡すとカウントクエリ自体が失敗したことにする。
   */
  existingOtherPhotoCount?: number | Error;
  uploadError?: { message: string } | null;
  upsertError?: { code?: string; message: string } | null;
}

function fakeAdminClient(options: FakeClientOptions = {}) {
  const {
    ownedShioriRow = { id: SHIORI_ID },
    existingOtherPhotoCount = 0,
    uploadError = null,
    upsertError = null,
  } = options;

  const uploadCalls: { path: string; body: unknown; options: unknown }[] = [];
  const upsertCalls: { table: string; rows: unknown[]; options: unknown }[] = [];
  const shioriQueryCalls: { id: string; userId: string }[] = [];
  const countQueryCalls: { shioriId: string; excludedPhotoId: string }[] = [];

  const client = {
    from: (table: string) => {
      if (table === "shiori") {
        return {
          select: () => ({
            eq: (_col1: string, id: string) => ({
              eq: (_col2: string, userId: string) => ({
                maybeSingle: () => {
                  shioriQueryCalls.push({ id, userId });
                  if (ownedShioriRow instanceof Error) {
                    return Promise.resolve({ data: null, error: { message: ownedShioriRow.message } });
                  }
                  return Promise.resolve({ data: ownedShioriRow, error: null });
                },
              }),
            }),
          }),
        };
      }
      if (table === "photos") {
        return {
          select: () => ({
            eq: (_col1: string, shioriId: string) => ({
              neq: (_col2: string, excludedPhotoId: string) => {
                countQueryCalls.push({ shioriId, excludedPhotoId });
                if (existingOtherPhotoCount instanceof Error) {
                  return Promise.resolve({
                    count: null,
                    error: { message: existingOtherPhotoCount.message },
                  });
                }
                return Promise.resolve({ count: existingOtherPhotoCount, error: null });
              },
            }),
          }),
          upsert: (rows: unknown[], opts: unknown) => {
            upsertCalls.push({ table, rows, options: opts });
            if (upsertError) {
              return Promise.resolve({ error: upsertError });
            }
            return Promise.resolve({ error: null });
          },
        };
      }
      throw new Error(`unexpected table: ${table}`);
    },
    storage: {
      from: (bucket: string) => ({
        upload: (path: string, body: unknown, opts: unknown) => {
          expect(bucket).toBe("photos");
          uploadCalls.push({ path, body, options: opts });
          if (uploadError) {
            return Promise.resolve({ data: null, error: uploadError });
          }
          return Promise.resolve({ data: { path }, error: null });
        },
      }),
    },
  } as unknown as SupabaseClient;

  return { client, uploadCalls, upsertCalls, shioriQueryCalls, countQueryCalls };
}

describe("buildPhotoStoragePath", () => {
  it("{user_id}/{shiori_id}/{photo_id}.{ext}の規約でパスを組み立てる", () => {
    expect(buildPhotoStoragePath(USER_ID, SHIORI_ID, PHOTO_ID, "jpg")).toBe(
      `${USER_ID}/${SHIORI_ID}/${PHOTO_ID}.jpg`,
    );
  });
});

describe("migrateGuestPhoto", () => {
  it("成功時: 所有権確認→枚数上限確認→Storageアップロード→photos upsertの順で行い、storage_pathを返す", async () => {
    const { client, uploadCalls, upsertCalls, shioriQueryCalls, countQueryCalls } = fakeAdminClient();

    const result = await migrateGuestPhoto(client, USER_ID, validInput());

    expect(result).toEqual({
      photo_id: PHOTO_ID,
      storage_path: `${USER_ID}/${SHIORI_ID}/${PHOTO_ID}.jpg`,
    });
    expect(shioriQueryCalls).toEqual([{ id: SHIORI_ID, userId: USER_ID }]);
    expect(countQueryCalls).toEqual([{ shioriId: SHIORI_ID, excludedPhotoId: PHOTO_ID }]);
    expect(uploadCalls).toHaveLength(1);
    expect(uploadCalls[0].path).toBe(`${USER_ID}/${SHIORI_ID}/${PHOTO_ID}.jpg`);
    expect(uploadCalls[0].options).toMatchObject({ contentType: "image/jpeg", upsert: true });
    expect(upsertCalls).toHaveLength(1);
    expect(upsertCalls[0].rows[0]).toMatchObject({
      id: PHOTO_ID,
      shiori_id: SHIORI_ID,
      day_date: "2026-08-10",
      caption: "開演前",
      storage_path: `${USER_ID}/${SHIORI_ID}/${PHOTO_ID}.jpg`,
    });
    expect(upsertCalls[0].options).toMatchObject({ onConflict: "id", ignoreDuplicates: true });
  });

  it("IDOR対策: 他人(または存在しない)のshiori_idを渡すとshiori_not_ownedで拒否し、アップロードしない", async () => {
    const { client, uploadCalls, upsertCalls, countQueryCalls } = fakeAdminClient({ ownedShioriRow: null });

    const error = await migrateGuestPhoto(client, USER_ID, validInput()).catch((e) => e as PhotoMigrationError);

    expect(error).toBeInstanceOf(PhotoMigrationError);
    expect((error as PhotoMigrationError).reason).toBe("shiori_not_owned");
    expect(countQueryCalls).toHaveLength(0);
    expect(uploadCalls).toHaveLength(0);
    expect(upsertCalls).toHaveLength(0);
  });

  it("所有権確認のDBクエリ自体が失敗したらshiori_not_ownedとして扱いアップロードしない", async () => {
    const { client, uploadCalls } = fakeAdminClient({ ownedShioriRow: new Error("connection error") });

    const error = await migrateGuestPhoto(client, USER_ID, validInput()).catch((e) => e as PhotoMigrationError);

    expect(error).toBeInstanceOf(PhotoMigrationError);
    expect((error as PhotoMigrationError).reason).toBe("shiori_not_owned");
    expect(uploadCalls).toHaveLength(0);
  });

  it("Storageアップロード失敗時はstorage_upload_failedを投げ、photosへは書き込まない", async () => {
    const { client, upsertCalls } = fakeAdminClient({ uploadError: { message: "quota exceeded" } });

    const error = await migrateGuestPhoto(client, USER_ID, validInput()).catch((e) => e as PhotoMigrationError);

    expect(error).toBeInstanceOf(PhotoMigrationError);
    expect((error as PhotoMigrationError).reason).toBe("storage_upload_failed");
    expect(upsertCalls).toHaveLength(0);
  });

  it("photos upsert失敗時はdb_insert_failedを投げる(Storage側は既にアップロード済み=再送で拾える)", async () => {
    const { client } = fakeAdminClient({ upsertError: { code: "23503", message: "fk violation" } });

    const error = await migrateGuestPhoto(client, USER_ID, validInput()).catch((e) => e as PhotoMigrationError);

    expect(error).toBeInstanceOf(PhotoMigrationError);
    expect((error as PhotoMigrationError).reason).toBe("db_insert_failed");
    expect((error as PhotoMigrationError).code).toBe("23503");
  });

  it("同じphoto_idでの再送は同じstorage_pathになる(冪等性)", async () => {
    const { client: client1 } = fakeAdminClient();
    const { client: client2 } = fakeAdminClient();

    const first = await migrateGuestPhoto(client1, USER_ID, validInput());
    const second = await migrateGuestPhoto(client2, USER_ID, validInput());

    expect(first.storage_path).toBe(second.storage_path);
  });
});

describe("migrateGuestPhoto: 写真枚数上限(F6)のサーバー側強制", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_MAX_PHOTOS_PER_SHIORI;
  });

  it("上限未満: 既存件数(自分自身を除く)が上限より十分少なければアップロードを許可する", async () => {
    process.env.NEXT_PUBLIC_MAX_PHOTOS_PER_SHIORI = "5";
    const { client, uploadCalls, upsertCalls } = fakeAdminClient({ existingOtherPhotoCount: 2 });

    const result = await migrateGuestPhoto(client, USER_ID, validInput());

    expect(result.photo_id).toBe(PHOTO_ID);
    expect(uploadCalls).toHaveLength(1);
    expect(upsertCalls).toHaveLength(1);
  });

  it("上限ちょうど: 追加後にちょうど上限に達する場合(既存件数=上限-1)はアップロードを許可する", async () => {
    process.env.NEXT_PUBLIC_MAX_PHOTOS_PER_SHIORI = "5";
    const { client, uploadCalls, upsertCalls } = fakeAdminClient({ existingOtherPhotoCount: 4 });

    const result = await migrateGuestPhoto(client, USER_ID, validInput());

    expect(result.photo_id).toBe(PHOTO_ID);
    expect(uploadCalls).toHaveLength(1);
    expect(upsertCalls).toHaveLength(1);
  });

  it("上限超過: 既に上限(自分自身を除く件数)に達している場合はphoto_limit_exceededで拒否し、アップロードしない", async () => {
    process.env.NEXT_PUBLIC_MAX_PHOTOS_PER_SHIORI = "5";
    const { client, uploadCalls, upsertCalls } = fakeAdminClient({ existingOtherPhotoCount: 5 });

    const error = await migrateGuestPhoto(client, USER_ID, validInput()).catch((e) => e as PhotoMigrationError);

    expect(error).toBeInstanceOf(PhotoMigrationError);
    expect((error as PhotoMigrationError).reason).toBe("photo_limit_exceeded");
    expect(uploadCalls).toHaveLength(0);
    expect(upsertCalls).toHaveLength(0);
  });

  it("上限超過(既定値20を使うケース): 環境変数未設定でも既存20件なら拒否する", async () => {
    const { client, uploadCalls } = fakeAdminClient({ existingOtherPhotoCount: 20 });

    const error = await migrateGuestPhoto(client, USER_ID, validInput()).catch((e) => e as PhotoMigrationError);

    expect(error).toBeInstanceOf(PhotoMigrationError);
    expect((error as PhotoMigrationError).reason).toBe("photo_limit_exceeded");
    expect(uploadCalls).toHaveLength(0);
  });

  it("自分自身(同じphoto_id)の既存行はカウント対象から除外するクエリになっている(冪等な再送を誤って拒否しない)", async () => {
    process.env.NEXT_PUBLIC_MAX_PHOTOS_PER_SHIORI = "5";
    const { client, countQueryCalls, uploadCalls } = fakeAdminClient({ existingOtherPhotoCount: 0 });

    await migrateGuestPhoto(client, USER_ID, validInput());

    expect(countQueryCalls).toEqual([{ shioriId: SHIORI_ID, excludedPhotoId: PHOTO_ID }]);
    expect(uploadCalls).toHaveLength(1);
  });

  it("枚数確認クエリ自体が失敗したらphoto_limit_check_failedを投げ、アップロードしない", async () => {
    const { client, uploadCalls } = fakeAdminClient({
      existingOtherPhotoCount: new Error("connection error"),
    });

    const error = await migrateGuestPhoto(client, USER_ID, validInput()).catch((e) => e as PhotoMigrationError);

    expect(error).toBeInstanceOf(PhotoMigrationError);
    expect((error as PhotoMigrationError).reason).toBe("photo_limit_check_failed");
    expect(uploadCalls).toHaveLength(0);
  });
});
