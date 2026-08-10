/**
 * シードスポット(`seeds/spots/*.json`、`seed-`プレフィックスの文字列ID)を
 * サーバー側`public.spots`テーブル(`id`列は`uuid`型)へ登録するための決定論的ID変換。
 *
 * 背景: `public.shiori_spots.spot_id`は`public.spots(id)`への外部キー(uuid)を持つが、
 * シードスポットは同梱JSONにのみ存在し、通常はDBへ行を持たない。
 * ゲスト→ログイン移行時に「行きたいスポット」がシードスポットを参照している場合、
 * 参照先の`spots`行をこの一括移行APIが作る必要がある(複数ユーザーが同じシードスポットを
 * 参照しうるため、`upsert`で複数ユーザー間で共有できる同一行になるようにする)。
 * 参照: docs/design/screens/S4_スポット検索.md「参照整合性の注記」
 *
 * 同じ`seed-`IDからは常に同じUUIDを導出する(UUID v5、名前空間+SHA-1)。
 * これにより複数ユーザー・複数回の移行が同じシードスポットを参照しても、
 * DB上は同一の`spots`行(初回作成者が作り、以降は`ignoreDuplicates`で無視)を指す。
 */
import { createHash } from "node:crypto";

// このアプリのシードスポットID変換専用の名前空間UUID(値そのものに意味は無い。固定であればよい)。
const SEED_SPOT_NAMESPACE_HEX = "e7f3a9d28b1c4e6a9f3d2c8b7a6e5d4f";

/**
 * `seed-`プレフィックス付きのシードスポットIDから、`public.spots.id`(uuid)用の
 * 決定論的なUUID文字列を導出する。
 *
 * 例: `seedSpotDbId("seed-hinatafes-001")` → 常に同じ文字列
 *     (例: `"3f1e2a4b-5c6d-5e7f-8a9b-0c1d2e3f4a5b"`)を返す。
 */
export function seedSpotDbId(seedId: string): string {
  const namespaceBytes = Buffer.from(SEED_SPOT_NAMESPACE_HEX, "hex");
  const nameBytes = Buffer.from(seedId, "utf8");
  const hash = createHash("sha1")
    .update(Buffer.concat([namespaceBytes, nameBytes]))
    .digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  // UUID v5仕様どおりversion/variantビットを設定する
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant RFC4122
  const hex = bytes.toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}
