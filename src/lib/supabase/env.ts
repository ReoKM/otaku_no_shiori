/**
 * Supabase接続用の環境変数を読み出し・検証する。
 *
 * 値そのものは`supabase/README.md`の手順でオーナーがNetlify環境変数と
 * ローカルの`.env.local`に設定する。このファイルには値を書かない。
 *
 * 公開範囲の区別を必ず守る:
 * - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
 *   ブラウザに埋め込まれる。RLSに守られる前提の鍵。
 * - `SUPABASE_SERVICE_ROLE_KEY`
 *   サーバー専用。RLSを無視できるためクライアントへ渡してはいけない。
 */

/** 環境変数が未設定・空文字のときに投げるエラー。 */
export class MissingSupabaseEnvError extends Error {
  constructor(readonly variableName: string) {
    super(
      `環境変数 ${variableName} が設定されていません。.env.local(ローカル)またはNetlify環境変数(本番)に設定してください。設定手順: supabase/README.md`,
    );
    this.name = "MissingSupabaseEnvError";
  }
}

/**
 * 環境変数を1件取り出す。未設定・空白のみの場合は例外を投げる。
 *
 * `process.env.X` はNext.jsのビルド時置換の対象なので、
 * 変数名を動的に組み立てず必ずリテラルで参照する。
 */
function requireEnv(variableName: string, rawValue: string | undefined): string {
  const value = rawValue?.trim();
  if (!value) {
    throw new MissingSupabaseEnvError(variableName);
  }
  return value;
}

/** ブラウザ・サーバー両方から使う公開設定(URL + anonキー)。 */
export type SupabasePublicEnv = {
  url: string;
  anonKey: string;
};

/**
 * 公開設定を取得する。未設定なら`MissingSupabaseEnvError`。
 *
 * 例: `getSupabasePublicEnv()` → `{ url: "https://xxxx.supabase.co", anonKey: "sb_publishable_..." }`
 */
export function getSupabasePublicEnv(): SupabasePublicEnv {
  return {
    url: requireEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
    anonKey: requireEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  };
}

/**
 * service_roleキーを取得する。サーバーからのみ呼ぶこと。
 *
 * ブラウザ(`window`が存在する環境)から呼ばれた場合は値を返さず例外を投げ、
 * バンドルミスで管理者鍵が漏れる事故を実行時にも止める。
 */
export function getSupabaseServiceRoleKey(): string {
  if (typeof window !== "undefined") {
    throw new Error(
      "service_roleキーはサーバー専用です。クライアントコードから読み出さないでください。",
    );
  }
  return requireEnv(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
