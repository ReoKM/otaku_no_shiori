"use client";

import type { ShareImageTemplateId } from "@/templates/share-image/types";

/**
 * S5 TemplateSection(テンプレート選択、Step1)。
 * 参照: docs/design/screens/S5_共有画像プレビュー.md「TemplateSection」
 *
 * スウォッチ(「Aa」「✨🎀」)は選択肢を区別するための仮のUI表現であり、
 * 最終的なテンプレートデザインを規定しない(仕様「不明点・仮置き」参照)。
 */
interface TemplateOption {
  id: ShareImageTemplateId;
  name: string;
  description: string;
}

const TEMPLATES: TemplateOption[] = [
  { id: "simple", name: "シンプル", description: "写真中心の落ち着いたデザイン" },
  { id: "nigiyaka", name: "にぎやか", description: "絵文字や装飾多めの賑やかなデザイン" },
];

interface TemplateSectionProps {
  selected: ShareImageTemplateId;
  onSelect: (id: ShareImageTemplateId) => void;
}

export function TemplateSection({ selected, onSelect }: TemplateSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-neutral-900">テンプレートを選ぶ</h2>
      <div className="flex flex-col gap-3">
        {TEMPLATES.map((template) => {
          const active = template.id === selected;
          return (
            <button
              key={template.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(template.id)}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left ${
                active ? "border-2 border-pink-500 bg-pink-100" : "border border-neutral-200 bg-white"
              }`}
            >
              <div
                aria-hidden="true"
                className={`flex h-20 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md ${
                  template.id === "simple" ? "bg-neutral-50" : "bg-pink-100"
                }`}
              >
                {template.id === "simple" ? (
                  <span className="text-base font-semibold text-neutral-500">Aa</span>
                ) : (
                  <span className="text-base">✨🎀</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-neutral-900">{template.name}</p>
                <p className="text-sm text-neutral-500">{template.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
