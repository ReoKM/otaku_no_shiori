import { describe, expect, it } from "vitest";
import {
  ALLOWED_PHOTO_MIME_TYPES,
  MAX_PHOTO_FILE_SIZE_BYTES,
  validatePhotoUploadForm,
} from "./photo-upload-validation";

const SHIORI_ID = "11111111-1111-4111-8111-111111111111";
const PHOTO_ID = "22222222-2222-4222-8222-222222222222";

function jpegFile(sizeBytes: number = 100): File {
  return new File([new Uint8Array(sizeBytes)], "photo.jpg", { type: "image/jpeg" });
}

function validForm(overrides: Record<string, string | File | null> = {}): FormData {
  const form = new FormData();
  const fields: Record<string, string | File | null> = {
    shiori_id: SHIORI_ID,
    photo_id: PHOTO_ID,
    day_date: "2026-08-10",
    caption: "  開演前  ",
    file: jpegFile(),
    ...overrides,
  };
  for (const [key, value] of Object.entries(fields)) {
    if (value === null) continue;
    form.set(key, value as string | File);
  }
  return form;
}

describe("validatePhotoUploadForm", () => {
  it("有効なフォームはokになり、captionをtrimし、拡張子を導出する", () => {
    const result = validatePhotoUploadForm(validForm());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.shiori_id).toBe(SHIORI_ID);
    expect(result.data.photo_id).toBe(PHOTO_ID);
    expect(result.data.day_date).toBe("2026-08-10");
    expect(result.data.caption).toBe("開演前");
    expect(result.data.mimeType).toBe("image/jpeg");
    expect(result.data.extension).toBe("jpg");
  });

  it("day_date・captionを省略した場合はnullになる", () => {
    const form = new FormData();
    form.set("shiori_id", SHIORI_ID);
    form.set("photo_id", PHOTO_ID);
    form.set("file", jpegFile());

    const result = validatePhotoUploadForm(form);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.day_date).toBeNull();
    expect(result.data.caption).toBeNull();
  });

  it("空白のみのcaptionはnullになる(sanitizeCaption仕様と同じ)", () => {
    const result = validatePhotoUploadForm(validForm({ caption: "   " }));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.caption).toBeNull();
  });

  it("shiori_idがUUID形式でなければエラー", () => {
    const result = validatePhotoUploadForm(validForm({ shiori_id: "not-a-uuid" }));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((e) => e.includes("shiori_id"))).toBe(true);
  });

  it("photo_idがUUID形式でなければエラー", () => {
    const result = validatePhotoUploadForm(validForm({ photo_id: "not-a-uuid" }));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((e) => e.includes("photo_id"))).toBe(true);
  });

  it("day_dateがYYYY-MM-DD形式でなければエラー", () => {
    const result = validatePhotoUploadForm(validForm({ day_date: "2026/08/10" }));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((e) => e.includes("day_date"))).toBe(true);
  });

  it("fileが無ければエラー", () => {
    const form = new FormData();
    form.set("shiori_id", SHIORI_ID);
    form.set("photo_id", PHOTO_ID);

    const result = validatePhotoUploadForm(form);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((e) => e.includes("file"))).toBe(true);
  });

  it("2MBを超えるfileはサイズ超過エラー", () => {
    const result = validatePhotoUploadForm(validForm({ file: jpegFile(MAX_PHOTO_FILE_SIZE_BYTES + 1) }));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((e) => e.includes("2MB"))).toBe(true);
  });

  it("ちょうど2MBのfileはサイズ超過エラーにならない", () => {
    const result = validatePhotoUploadForm(validForm({ file: jpegFile(MAX_PHOTO_FILE_SIZE_BYTES) }));

    expect(result.ok).toBe(true);
  });

  it("許可されていないMIMEタイプはエラー(サーバー側でも検証する)", () => {
    const file = new File([new Uint8Array(10)], "photo.gif", { type: "image/gif" });
    const result = validatePhotoUploadForm(validForm({ file }));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((e) => e.includes("MIMEタイプ"))).toBe(true);
  });

  it.each(ALLOWED_PHOTO_MIME_TYPES)("許可MIMEタイプ%sは受理される", (mime) => {
    const file = new File([new Uint8Array(10)], "photo", { type: mime });
    const result = validatePhotoUploadForm(validForm({ file }));

    expect(result.ok).toBe(true);
  });

  it("空のfileはエラー", () => {
    const file = new File([], "empty.jpg", { type: "image/jpeg" });
    const result = validatePhotoUploadForm(validForm({ file }));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((e) => e.includes("空"))).toBe(true);
  });
});
