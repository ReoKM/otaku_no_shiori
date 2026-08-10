/**
 * Supabase疎通確認スクリプト(CLI版)。
 *
 * 実行:
 *   npm run check:supabase
 *
 * `.env.local` を読み込み、環境変数の有無 → DBへの疎通 の順に確認して結果を表示する。
 * ブラウザやdevサーバーを起動せずに「オーナーが設定した鍵で本当に繋がるか」を確かめるために使う。
 *
 * 出力例(成功):
 *   ✓ NEXT_PUBLIC_SUPABASE_URL      https://xxxxxxxx.supabase.co
 *   ✓ NEXT_PUBLIC_SUPABASE_ANON_KEY sb_publishable_… (46文字)
 *   ✓ SUPABASE_SERVICE_ROLE_KEY     設定済み (41文字)
 *   ✓ spots テーブルへ接続成功 (anonキーで見えている行数: 0)
 *
 * 出力例(失敗):
 *   ✗ spots テーブルへの接続に失敗しました
 *     code: PGRST205
 *     message: Could not find the table 'public.spots' in the schema cache
 *     hint: テーブル spots が見つかりません。supabase/migrations/0001_initial_schema.sql を…
 *
 * 秘密情報は表示しない(anon/service_roleキーは長さのみ、anonキーは公開可の接頭辞まで)。
 * CIでは実行しない(Secretsを必要とさせないため)。
 */

import { createClient } from "@supabase/supabase-js";

import { checkSupabaseConnection } from "../src/lib/supabase/health.ts";

/** 環境変数を1件確認して表示用の行を作る。未設定ならnullを返す。 */
function reportEnv(
  name: string,
  options: { reveal: boolean } = { reveal: false },
): string | null {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`✗ ${name} が設定されていません`);
    return null;
  }
  if (options.reveal) {
    console.log(`✓ ${name} ${value}`);
  } else {
    // 鍵そのものは出さない。種別が分かる接頭辞と長さだけを出す。
    const prefix = value.startsWith("sb_")
      ? `${value.slice(0, value.indexOf("_", 3) + 1)}…`
      : "設定済み";
    console.log(`✓ ${name} ${prefix} (${value.length}文字)`);
  }
  return value;
}

async function main(): Promise<void> {
  console.log("Supabase接続チェック\n");

  // URLは公開情報なのでそのまま表示してよい(打ち間違いの発見に必要)。
  const url = reportEnv("NEXT_PUBLIC_SUPABASE_URL", { reveal: true });
  const anonKey = reportEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  // service_roleキーはこのスクリプトでは使わない。設定漏れの検知だけを行う。
  reportEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !anonKey) {
    console.error(
      "\n環境変数が不足しています。supabase/README.md の手順で .env.local を作成してください。",
    );
    process.exitCode = 1;
    return;
  }

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const result = await checkSupabaseConnection(supabase);

  console.log("");
  if (result.ok) {
    console.log(
      `✓ ${result.table} テーブルへ接続成功 (anonキーで見えている行数: ${result.visibleRowCount ?? "不明"})`,
    );
    return;
  }

  console.error(`✗ ${result.table} テーブルへの接続に失敗しました`);
  console.error(`  code: ${result.error.code ?? "(なし)"}`);
  console.error(`  message: ${result.error.message}`);
  console.error(`  hint: ${result.hint}`);
  process.exitCode = 1;
}

await main();
