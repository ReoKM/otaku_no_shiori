"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  consumeShioriJustCreated,
  dismissLoginPromptBannerForever,
  isLoginPromptBannerDismissed,
} from "@/lib/login-prompt-banner";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * F8「しおり保存後のバナー表示」。
 * 参照: docs/01_service_spec.md F8「ログインを促すタイミング: しおり保存後のバナー表示、
 * 共有画像生成後の一言、の2箇所のみ。しつこくしない」
 *
 * 表示条件(仮置き。仕様に画面定義が無いため独自に設計。完了報告に記載):
 * - S2(しおり作成)の送信成功直後にS3(しおり詳細)へ遷移してきた、そのタイミングでのみ表示する
 *   (`src/lib/login-prompt-banner.ts`の`consumeShioriJustCreated`が一度読んだら消費するため、
 *   同じしおりへ再訪問しても出ない)
 * - ログイン済みユーザーには出さない(Supabaseセッションを確認できてから表示するため、
 *   一瞬の判定待ちで非表示のまま画面が始まる。判定に失敗した場合はゲスト扱いで表示する)
 * - 一度閉じたら、以後どのしおりでも二度と表示しない(localStorage、永続)
 *
 * 文言はF8向けにS5(共有画像プレビュー)の`LoginHint`で既に承認されている
 * 「ログインすると、しおりを他の端末からも見られるようになります」をそのまま流用する
 * (S3向けの文言は画面仕様に定義が無いため。完了報告に記載)。
 */
export function LoginPromptBanner({ shioriId }: { shioriId: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!consumeShioriJustCreated(shioriId) || isLoginPromptBannerDismissed()) {
      return;
    }

    let cancelled = false;

    try {
      // 環境変数未設定(`MissingSupabaseEnvError`)等はここで同期的に投げられうるため、
      // Promiseチェーンの外側もtry/catchで囲む(src/lib/supabase/middleware.tsと同じ考え方:
      // 判定できない場合はゲスト利用者を巻き込んで壊さず、ゲスト扱いでバナーを表示する)。
      getSupabaseBrowserClient()
        .auth.getSession()
        .then(({ data }) => {
          if (!cancelled && !data.session) {
            setVisible(true);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setVisible(true);
          }
        });
    } catch {
      // 同期的なsetStateはeffect内では避ける(react-hooks/set-state-in-effect)ため、
      // マイクロタスクへずらして呼ぶ。
      queueMicrotask(() => {
        if (!cancelled) {
          setVisible(true);
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [shioriId]);

  if (!visible) {
    return null;
  }

  function handleClose() {
    dismissLoginPromptBannerForever();
    setVisible(false);
  }

  return (
    <div
      role="status"
      className="mx-6 mt-4 flex items-start gap-3 rounded-xl border border-paper-border bg-sakura-soft px-4 py-3.5"
    >
      <span aria-hidden="true" className="text-base leading-none">
        💡
      </span>
      <div className="flex flex-1 flex-col gap-2">
        <p className="text-[13px] leading-[1.6] text-ink-sub">
          ログインすると、しおりを他の端末からも見られるようになります
        </p>
        <Link href="/settings" className="self-start text-[13px] font-bold text-sakura-ink underline">
          ログインする
        </Link>
      </div>
      <button
        type="button"
        onClick={handleClose}
        aria-label="バナーを閉じる"
        className="grid h-8 w-8 flex-none place-items-center rounded-full text-ink-faint"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}
