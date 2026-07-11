import { BackButton } from "@/components/common/BackButton";
import { ShioriCreateForm } from "@/components/shiori-form/ShioriCreateForm";

/**
 * S2 しおり作成。
 * 参照: docs/design/screens/S2_しおり作成.md
 */
export default function NewShioriPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-neutral-50">
      <header className="sticky top-0 z-10 flex items-center border-b border-neutral-200 bg-white">
        <BackButton />
        <h1 className="mx-auto pr-11 text-xl font-bold text-neutral-900">しおりを作る</h1>
      </header>
      <ShioriCreateForm />
    </div>
  );
}
