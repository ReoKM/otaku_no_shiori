"use client";

import { useEffect, useRef } from "react";

interface BottomSheetProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * 画面下からせり上がる共通ボトムシート(並べ替え・行メニューで使う)。
 * 参照: docs/design/screens/S3a_持ち物.md「並べ替えシート」
 *
 * 背景の暗幕タップとEscキーで閉じる。開いている間は背面のスクロールを止める。
 */
export function BottomSheet({ title, onClose, children }: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);

    // シートを開いている間は背面がスクロールしないようにする
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // 開いた直後にシート内へフォーカスを移し、キーボード操作の起点を暗幕の外に出さない
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-[rgba(35,28,22,0.4)]"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        // 暗幕のonClickへ伝播させない(シート内の操作で閉じてしまうのを防ぐ)
        onClick={(event) => event.stopPropagation()}
        className="w-full animate-[paper-sheet-up_0.2s_ease] rounded-t-[18px] bg-paper-surface px-4 pt-2.5 pb-6 outline-none"
      >
        <div aria-hidden="true" className="mx-auto mb-3.5 h-1 w-9 rounded-full bg-paper-track-border" />
        <p className="px-1 pb-2 text-sm font-bold text-ink-label">{title}</p>
        {children}
      </div>
    </div>
  );
}
