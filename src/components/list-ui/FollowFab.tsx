"use client";

import { PlusIcon } from "./icons";

interface FollowFabProps {
  label: string;
  onClick: () => void;
}

/**
 * リスト末尾の「追加」行が画面外にあるときだけ出る追従ボタン。
 * 参照: docs/design/screens/S3a_持ち物.md「追従ボタン」
 *
 * 白地+差し色の文字にして、リスト本体の主役(項目名)より前に出ないようにする。
 * 表示条件の判定は`useFollowFab`が持つ。
 */
export function FollowFab({ label, onClick }: FollowFabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed right-6 bottom-6 z-30 flex h-12.5 animate-[paper-fade-up_0.18s_ease] items-center gap-2 rounded-full border border-sakura-border bg-white px-4.5 text-[14.5px] font-bold text-sakura-ink shadow-[0_4px_14px_rgba(60,45,30,0.12)]"
    >
      <PlusIcon size={17} />
      {label}
    </button>
  );
}
