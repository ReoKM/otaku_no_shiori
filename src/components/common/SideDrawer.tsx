"use client";

import { useEffect, useRef } from "react";

interface SideDrawerProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * 右からスライドインする共通サイドドロワー(ハンバーガーメニュー用)。
 * 参照: `src/components/list-ui/BottomSheet.tsx`(下からのシート)と同じ
 * 暗幕タップ・Escキー・背面スクロール停止・開いた直後のフォーカス移動を踏襲し、
 * スライド方向だけを右からに変える(オーナーFB: 「サイドから出る方が直感的」)。
 */
export function SideDrawer({ title, onClose, children }: SideDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);

    // ドロワーを開いている間は背面がスクロールしないようにする
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // 開いた直後にドロワー内へフォーカスを移し、キーボード操作の起点を暗幕の外に出さない
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[rgba(35,28,22,0.4)]"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        // 暗幕のonClickへ伝播させない(ドロワー内の操作で閉じてしまうのを防ぐ)
        onClick={(event) => event.stopPropagation()}
        className="flex h-full w-[82%] max-w-[320px] animate-[paper-drawer-in_0.2s_ease] flex-col overflow-y-auto bg-paper-surface px-4 pt-6 pb-6 outline-none"
      >
        <p className="px-1 pb-4 text-sm font-bold text-ink-label">{title}</p>
        {children}
      </div>
    </div>
  );
}
