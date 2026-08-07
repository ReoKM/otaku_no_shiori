"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShareTab } from "@/components/share/ShareTab";
import { FEATURE_SHARE } from "@/lib/feature-flags";

/**
 * S5 共有画像プレビュー画面のクライアント側本体。
 * 参照: docs/design/screens/S5_共有画像プレビュー.md
 *
 * 共有機能はファーストリリースでは閉じている(src/lib/feature-flags.ts)。
 * 導線を隠すだけでは直リンク・履歴から到達できてしまうため、この画面でも記録タブへ戻す。
 * `FEATURE_SHARE`を`true`に戻せば元どおり表示される。
 *
 * ページファイル(`app/shiori/[id]/share/page.tsx`)をServer Componentに保ちつつ
 * このクライアント処理を分けている(ページを`"use client"`にすると`export const dynamic`が
 * 効かず、ルートがリクエストごとのNetlify Functions起動になるため)。
 */
export function ShareRoute({ shioriId }: { shioriId: string }) {
  const router = useRouter();

  useEffect(() => {
    if (!FEATURE_SHARE) {
      router.replace(`/shiori/${shioriId}/log`);
    }
  }, [router, shioriId]);

  if (!FEATURE_SHARE) {
    return null;
  }

  return <ShareTab shioriId={shioriId} />;
}
