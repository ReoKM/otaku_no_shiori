/**
 * ゲスト→クラウド移行フローのクライアント側オーケストレーション(F8・Issue #99)。
 * 参照: docs/03_tech_stack.md「ゲスト → ログインのデータ移行」手順2〜6
 *
 * 手順(手順2〜4を1本のフローにまとめる):
 * 1. テキストデータ(しおり・持ち物・TODO・旅程・自由入力スポット・行きたいスポット紐付け)を
 *    `POST /api/migration/guest`(#97)へ一括送信する
 * 2. 成功したら、写真を`POST /api/migration/photos`(#98)へ1枚ずつ送信する(進捗を追う)
 * 3. 全件成功したら`markGuestDataMigrated`(`src/lib/guest-store.ts`)で移行済みフラグを立てる
 *
 * 冪等性・リトライ方針(docs/03_tech_stack.md手順6、Issueの指示どおり):
 * - テキストはサーバー側が主キーupsert(`ignoreDuplicates: true`)で冪等なため、再試行時は
 *   常に丸ごと再送してよい(差分計算はしない)
 * - 写真は1枚ずつ独立して失敗しうるため、再試行時は前回失敗した`photo_id`のみを対象にする
 * - 失敗時(テキスト段階・写真段階のいずれでも)、端末内のゲストデータ(IndexedDB)は消さない。
 *   `markGuestDataMigrated`は全件成功時のみ呼ぶ
 *
 * このモジュール自身はSupabase・IndexedDB・`fetch`に直接依存しない(`RunGuestMigrationOptions`
 * 経由で依存を注入する)。実際の依存注入は呼び出し側(`src/lib/use-guest-migration.ts`)が行う。
 * こうすることでユニットテスト(`guest-migration-orchestrator.test.ts`)がフェイクの
 * `guestStore`/`apiClient`だけで移行フローの分岐を検証できる。
 */
import type { GuestMigrationTextData } from "@/lib/guest-store";
import type { Photo } from "@/types/shiori";

// =========================================================
// リクエストボディの整形
// =========================================================

/**
 * `POST /api/migration/guest`(`src/lib/guest-migration-validation.ts`)が読み取るフィールドのみを
 * 抜き出したリクエストボディ。ゲスト側の型(`GuestMigrationTextData`)にはサーバーが受け付けない
 * 項目(`Shiori.budget_total`/`budget_memo`、`Spot.source`/`status`)も含まれるため、送信前に
 * 必ずこの関数で絞り込む(余分なフィールドはサーバー側で無視されるだけで実害は無いが、
 * 送信データを送信先の仕様に明示的に合わせるため)。
 *
 * 既知の制約: `budget_items`(予算)は`POST /api/migration/guest`が対応していないため
 * このリクエストボディに含まれない=移行対象外(#97のAPI仕様がそのまま。完了報告に明記)。
 */
export interface GuestMigrationRequestBody {
  shiori: unknown[];
  packing_items: unknown[];
  todos: unknown[];
  itinerary_entries: unknown[];
  spots: unknown[];
  shiori_spots: unknown[];
}

export function buildGuestMigrationRequestBody(data: GuestMigrationTextData): GuestMigrationRequestBody {
  return {
    shiori: data.shiori.map((s) => ({
      id: s.id,
      title: s.title,
      start_date: s.start_date,
      end_date: s.end_date,
      trip_type: s.trip_type,
      purpose: s.purpose,
      cover: s.cover,
      created_at: s.created_at,
      updated_at: s.updated_at,
    })),
    packing_items: data.packing_items.map((p) => ({
      id: p.id,
      shiori_id: p.shiori_id,
      label: p.label,
      is_checked: p.is_checked,
      sort_order: p.sort_order,
    })),
    todos: data.todos.map((t) => ({
      id: t.id,
      shiori_id: t.shiori_id,
      label: t.label,
      due_date: t.due_date,
      is_done: t.is_done,
      sort_order: t.sort_order,
    })),
    itinerary_entries: data.itinerary_entries.map((e) => ({
      id: e.id,
      shiori_id: e.shiori_id,
      day_date: e.day_date,
      time: e.time,
      title: e.title,
      place_name: e.place_name,
      memo: e.memo,
      sort_order: e.sort_order,
    })),
    spots: data.spots.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      category: s.category,
      area: s.area,
      created_at: s.created_at,
    })),
    shiori_spots: data.shiori_spots.map((s) => ({
      shiori_id: s.shiori_id,
      spot_id: s.spot_id,
      memo: s.memo,
      is_visited: s.is_visited,
    })),
  };
}

// =========================================================
// APIクライアント(依存注入用インターフェース)
// =========================================================

export interface PhotoMigrationRequest {
  shioriId: string;
  photoId: string;
  dayDate: string | null;
  caption: string | null;
  blob: Blob;
}

export interface MigrationApiResult {
  ok: boolean;
}

/** `POST /api/migration/guest` / `POST /api/migration/photos` の呼び出し口。 */
export interface GuestMigrationApiClient {
  migrateText: (body: GuestMigrationRequestBody) => Promise<MigrationApiResult>;
  migratePhoto: (request: PhotoMigrationRequest) => Promise<MigrationApiResult>;
}

/**
 * 実際に`fetch`で`/api/migration/guest`・`/api/migration/photos`を呼び出す実装。
 * ブラウザ専用(`fetch`/`FormData`/`File`はNode側テストでは使わない)なのでユニットテスト対象外
 * (`runGuestMigration`本体は`GuestMigrationApiClient`をDIで受け取るためフェイクで検証できる)。
 */
export function createFetchGuestMigrationApiClient(): GuestMigrationApiClient {
  return {
    async migrateText(body) {
      try {
        const response = await fetch("/api/migration/guest", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          return { ok: false };
        }
        const json = (await response.json()) as { ok?: boolean };
        return { ok: json.ok === true };
      } catch {
        return { ok: false };
      }
    },
    async migratePhoto(request) {
      try {
        const form = new FormData();
        form.set("shiori_id", request.shioriId);
        form.set("photo_id", request.photoId);
        if (request.dayDate !== null) {
          form.set("day_date", request.dayDate);
        }
        if (request.caption !== null) {
          form.set("caption", request.caption);
        }
        form.set("file", request.blob, request.photoId);

        const response = await fetch("/api/migration/photos", { method: "POST", body: form });
        if (!response.ok) {
          return { ok: false };
        }
        const json = (await response.json()) as { ok?: boolean };
        return { ok: json.ok === true };
      } catch {
        return { ok: false };
      }
    },
  };
}

// =========================================================
// オーケストレーション本体
// =========================================================

/** `src/lib/guest-store.ts`のうち、移行フローが使う関数だけを抜き出した依存インターフェース。 */
export interface GuestMigrationStoreDeps {
  getGuestMigrationState: () => Promise<{ migrated: boolean }>;
  markGuestDataMigrated: () => Promise<void>;
  collectAllGuestTextData: () => Promise<GuestMigrationTextData>;
  listAllGuestPhotos: () => Promise<Photo[]>;
}

export type MigrationOutcome =
  /** 既に移行済み、またはそもそも移行対象データが無い(ゲストしおり0件)。 */
  | { phase: "no_data" }
  /** テキスト・写真の全件が成功し、移行済みフラグを立てた。 */
  | { phase: "success" }
  /** テキストまたは写真の一部が失敗した。`retryFailedPhotoIds`にそのまま渡せば再試行できる。 */
  | { phase: "partial_failure"; failedPhotoIds: string[]; textFailed: boolean };

export interface RunGuestMigrationOptions {
  guestStore: GuestMigrationStoreDeps;
  apiClient: GuestMigrationApiClient;
  /** 進捗が変わるたびに呼ばれる(`MigrationStatusCard`の`in_progress`表示に使う)。 */
  onProgress?: (migratedCount: number, totalCount: number) => void;
  /**
   * 指定時は「前回失敗した写真のみ再送」モード(再試行ボタン押下時)。
   * テキストは冪等なupsertのため、このモードでも常に丸ごと再送する。
   * 未指定時は初回実行として、移行済みフラグと保有データ全件をチェックする。
   */
  retryFailedPhotoIds?: string[];
}

/**
 * ゲスト→クラウド移行を1回分実行する。
 *
 * 使用例(初回実行):
 * ```ts
 * const outcome = await runGuestMigration({ guestStore, apiClient, onProgress });
 * if (outcome.phase === "partial_failure") {
 *   // outcome.failedPhotoIds を保持しておき、再試行ボタンでretryFailedPhotoIdsに渡す
 * }
 * ```
 *
 * 使用例(再試行):
 * ```ts
 * const outcome = await runGuestMigration({
 *   guestStore, apiClient, onProgress,
 *   retryFailedPhotoIds: previousOutcome.failedPhotoIds,
 * });
 * ```
 */
export async function runGuestMigration(options: RunGuestMigrationOptions): Promise<MigrationOutcome> {
  const { guestStore, apiClient, onProgress = () => {}, retryFailedPhotoIds } = options;
  const isRetry = retryFailedPhotoIds !== undefined;

  if (!isRetry) {
    const state = await guestStore.getGuestMigrationState();
    if (state.migrated) {
      return { phase: "no_data" };
    }
  }

  const textData = await guestStore.collectAllGuestTextData();
  const allPhotos = await guestStore.listAllGuestPhotos();

  if (!isRetry && textData.shiori.length === 0 && allPhotos.length === 0) {
    // 元々ゲストしおりが0件だった場合(docs/design/screens/S6_設定アカウント.md「状態」表
    // 「ログイン済み・移行対象なし」)。移行済みフラグを立て、以後は毎回このチェックをしない。
    await guestStore.markGuestDataMigrated();
    return { phase: "no_data" };
  }

  const photosToSend = isRetry
    ? allPhotos.filter((photo) => retryFailedPhotoIds.includes(photo.id))
    : allPhotos;

  const totalCount = 1 + photosToSend.length;
  let migratedCount = 0;
  onProgress(migratedCount, totalCount);

  const textResult = await apiClient.migrateText(buildGuestMigrationRequestBody(textData));
  if (!textResult.ok) {
    // テキストが入っていない状態で写真だけアップロードしても、サーバー側の所有権確認
    // (`shiori_id`がこのユーザー所有か)に失敗するだけなので、写真送信は試みない。
    return { phase: "partial_failure", failedPhotoIds: photosToSend.map((p) => p.id), textFailed: true };
  }
  migratedCount += 1;
  onProgress(migratedCount, totalCount);

  const failedPhotoIds: string[] = [];
  for (const photo of photosToSend) {
    const result = await apiClient.migratePhoto({
      shioriId: photo.shiori_id,
      photoId: photo.id,
      dayDate: photo.day_date,
      caption: photo.caption,
      blob: photo.blob,
    });
    if (result.ok) {
      migratedCount += 1;
      onProgress(migratedCount, totalCount);
    } else {
      failedPhotoIds.push(photo.id);
    }
  }

  if (failedPhotoIds.length > 0) {
    return { phase: "partial_failure", failedPhotoIds, textFailed: false };
  }

  await guestStore.markGuestDataMigrated();
  return { phase: "success" };
}
