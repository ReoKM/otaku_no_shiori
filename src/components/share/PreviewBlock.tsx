"use client";

import { LoginHint } from "./LoginHint";

/**
 * S5 PreviewBlock(プレビュー完了)。
 * 参照: docs/design/screens/S5_共有画像プレビュー.md「PreviewBlock(プレビュー完了)」「SaveButton」
 */
interface PreviewBlockProps {
  imageUrl: string;
  /** trueならWeb Share API(ファイル共有)分岐、falseならBlobダウンロード分岐。 */
  canShareFiles: boolean;
  /** 保存ボタンをタップ済みか(タップ後は再タップ可能なまま、確認表示のみ追加)。 */
  saved: boolean;
  onSave: () => void;
  onBackToTemplate: () => void;
}

export function PreviewBlock({
  imageUrl,
  canShareFiles,
  saved,
  onSave,
  onBackToTemplate,
}: PreviewBlockProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- Netlify Functionが返すPNG BlobのObjectURLのためnext/imageの最適化対象外 */}
      <img
        src={imageUrl}
        alt="生成された共有画像のプレビュー"
        className="w-full rounded-xl border border-neutral-200"
      />
      <p className="text-center text-sm text-neutral-500">
        保存した画像はご自身でX/Instagramなどに投稿してください
      </p>
      <button
        type="button"
        onClick={onSave}
        className="h-11 w-full rounded-lg bg-pink-500 text-base font-semibold text-white"
      >
        {canShareFiles ? "保存 / 共有" : "画像を保存"}
      </button>
      {saved && <p className="text-sm font-semibold text-pink-500">✓ 保存を開始しました</p>}
      <p className="text-center text-xs text-neutral-400">
        保存できない場合は、画像を長押しして「画像を保存」を選んでください
      </p>
      <button type="button" onClick={onBackToTemplate} className="h-11 text-sm font-semibold text-pink-500">
        テンプレートを選び直す
      </button>
      <LoginHint />
    </div>
  );
}
