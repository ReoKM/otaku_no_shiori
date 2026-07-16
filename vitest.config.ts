import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // tsconfig.jsonの "@/*" → "./src/*" と同じエイリアスをvitestにも適用する
    // (値としてのimportをテストから解決できるようにする)。
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // guest-store.ts(IndexedDBラッパー)のテスト用にNode環境へIndexedDB互換実装を注入する。
    setupFiles: ["fake-indexeddb/auto"],
  },
});
