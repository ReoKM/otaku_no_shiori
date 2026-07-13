"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * `URL.createObjectURL`/`revokeObjectURL`を注入可能にするためのインターフェース。
 * ブラウザAPIに依存する部分をテスト対象の参照カウントロジックから切り離すために使う。
 */
export interface ObjectUrlProvider {
  create: (blob: Blob) => string;
  revoke: (url: string) => void;
}

interface RegistryEntry {
  url: string;
  refCount: number;
  listeners: Set<() => void>;
}

/**
 * Blobをキーにした参照カウント付きURLレジストリを作る(純粋なファクトリ関数・ユニットテスト対象)。
 * 同じBlobを複数のフックインスタンスが同時に参照している間はURLを使い回し、
 * 参照カウントが0になった時だけ実際に`revoke`する。
 *
 * Issue #62対応: 単純な `useMemo(create) + useEffect(revoke)` 構成だと、React Strict Mode
 * (開発時のeffect二重発火: setup→cleanup→setup)で「cleanupがURLをrevokeした直後、
 * setupが再実行されてもuseMemoのキャッシュは再計算されない」ため、表示中のURLがrevoke済みの
 * ままになり `<img>` がbroken imageになっていた。
 * このレジストリを使い「参照が0になって実際にrevokeされた後、同じBlobが再度subscribeされたら
 * 新しいURLを作り直して購読者へ通知する」ことで、フックが返すURLが常に有効な状態を保証する。
 */
export function createObjectUrlRegistry(provider: ObjectUrlProvider) {
  const entries = new Map<Blob, RegistryEntry>();

  function acquire(blob: Blob): string {
    const existing = entries.get(blob);
    if (existing) {
      existing.refCount += 1;
      return existing.url;
    }
    const url = provider.create(blob);
    entries.set(blob, { url, refCount: 1, listeners: new Set() });
    return url;
  }

  function release(blob: Blob): void {
    const existing = entries.get(blob);
    if (!existing) {
      return;
    }
    existing.refCount -= 1;
    if (existing.refCount <= 0) {
      provider.revoke(existing.url);
      entries.delete(blob);
    }
  }

  return {
    acquire,
    release,
    /**
     * `useSyncExternalStore`用の購読。acquireでURLを確保し、確保によって
     * スナップショット(peekの返り値)が変わった購読者へ通知する。
     * 返り値の解除関数がreleaseを行う。
     */
    subscribe(blob: Blob, onStoreChange: () => void): () => void {
      const hadEntry = entries.has(blob);
      acquire(blob);
      const entry = entries.get(blob);
      entry?.listeners.add(onStoreChange);
      if (!hadEntry) {
        // 初回確保(またはrevoke後の再生成)でURLが生まれたので、購読者に再読取りさせる
        onStoreChange();
      }
      return () => {
        entries.get(blob)?.listeners.delete(onStoreChange);
        release(blob);
      };
    },
    /** `useSyncExternalStore`用のスナップショット。未確保のBlobは空文字を返す。 */
    peek(blob: Blob): string {
      return entries.get(blob)?.url ?? "";
    },
    /** テスト用: 現在管理中のエントリ数(revoke漏れ・二重登録が無いことの確認に使う) */
    size(): number {
      return entries.size;
    },
  };
}

const browserObjectUrlRegistry = createObjectUrlRegistry({
  create: (blob) => URL.createObjectURL(blob),
  revoke: (url) => URL.revokeObjectURL(url),
});

/**
 * 写真Blob(IndexedDB `photos`ストア由来)をObjectURL化する。
 * `Photo.blob`は常に存在する(Blob型・nullable無し)ため、このフックも非nullのBlobのみ扱う。
 *
 * ObjectURLは「外部システムのリソース」なので`useSyncExternalStore`で購読する:
 * - レンダー中に`URL.createObjectURL`を呼ばない(Strict Modeで破棄されるレンダー分の
 *   参照カウントリーク・SSR/ハイドレーション不一致を避ける)
 * - 購読解除でreleaseし、Strict Modeの二重発火(subscribe→解除→subscribe)は
 *   レジストリ側がrevoke後の再生成+通知で吸収する(Issue #62)
 * - effect内での直接setStateを使わないため`react-hooks/set-state-in-effect`にも適合する
 * 未確保の間(初回レンダー・SSR)は空文字を返す。
 * ブラウザ専用API(`URL.createObjectURL`)に依存するため、Node環境のvitestではフック自体は
 * テスト対象外。レジストリのロジックは`useObjectUrl.test.ts`でテストする。
 */
export function useObjectUrl(blob: Blob): string {
  const subscribe = useCallback(
    (onStoreChange: () => void) => browserObjectUrlRegistry.subscribe(blob, onStoreChange),
    [blob],
  );
  const getSnapshot = useCallback(() => browserObjectUrlRegistry.peek(blob), [blob]);
  const getServerSnapshot = useCallback(() => "", []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
