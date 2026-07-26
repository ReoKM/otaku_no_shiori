"use client";

import { useRouter } from "next/navigation";
import { PlusIcon } from "@/components/list-ui/icons";

/**
 * しおりが1件以上ある場合のみ表示する右下固定の「しおりを作る」ボタン。
 * 参照: docs/design/screens/S1_ホーム一覧.md「FabButton」
 *
 * S3の追従ボタンと同じ「白地+桜枠+文字つきピル」に揃える。
 * ＋アイコンだけの円形だと何が作られるか分からないため、文言を添える。
 */
export function FabButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/shiori/new")}
      className="fixed right-6 bottom-6 z-30 flex h-12.5 items-center gap-2 rounded-full border border-sakura-border bg-white px-4.5 text-[14.5px] font-bold text-sakura-ink shadow-[0_4px_14px_rgba(60,45,30,0.12)]"
    >
      <PlusIcon size={17} />
      しおりを作る
    </button>
  );
}
