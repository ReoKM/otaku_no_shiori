import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // guest-store.ts(IndexedDBラッパー)のテスト用にNode環境へIndexedDB互換実装を注入する。
    setupFiles: ["fake-indexeddb/auto"],
  },
});
