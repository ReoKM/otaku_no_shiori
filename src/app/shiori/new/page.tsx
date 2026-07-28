import { BackButton } from "@/components/common/BackButton";
import { ShioriCreateForm } from "@/components/shiori-form/ShioriCreateForm";

/**
 * S2 しおり作成。
 * 参照: docs/design/screens/S2_しおり作成.md
 */
export default function NewShioriPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-paper">
      <header className="sticky top-0 z-30 flex items-center border-b border-paper-border bg-paper-surface px-6 py-3">
        <BackButton />
        <h1 className="mx-auto pr-8 text-xl font-black tracking-[0.01em] text-ink">しおりを作る</h1>
      </header>
      <ShioriCreateForm />
    </div>
  );
}
