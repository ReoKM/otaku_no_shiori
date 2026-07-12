"use client";

import { useEffect, useRef, useState } from "react";

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
 * このレジストリを使い「参照が0になって実際にrevokeされた後、同じBlobが再度acquireされたら
 * 新しいURLを作り直す」ことで、フックが返すURLが常に有効な状態を保証する。
 */
export function createObjectUrlRegistry(provider: ObjectUrlProvider) {
  const entries = new Map<Blob, RegistryEntry>();

  return {
    acquire(blob: Blob): string {
      const existing = entries.get(blob);
      if (existing) {
        existing.refCount += 1;
        return existing.url;
      }
      const url = provider.create(blob);
      entries.set(blob, { url, refCount: 1 });
      return url;
    },
    release(blob: Blob): void {
      const existing = entries.get(blob);
      if (!existing) {
        return;
      }
      existing.refCount -= 1;
      if (existing.refCount <= 0) {
        provider.revoke(existing.url);
        entries.delete(blob);
      }
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
 * 初回描画から画像を表示できるよう、URLの取得自体は`useState`の初期化関数で同期的に行う。
 * `useEffect`はマウント直後の1回目(useStateの初期化と対になる)は何もせず、
 * それ以降にeffectが再実行された場合(Blobが変わった場合、またはStrict Modeでの
 * 二重発火によるcleanup直後の再実行)にのみURLを取り直す。これにより、cleanupで
 * revokeされたURLがそのまま表示され続けることを防ぐ(Issue #62)。
 * ブラウザ専用API(`URL.createObjectURL`)に依存するため、Node環境のvitestではテスト対象外。
 * 参照カウントロジック自体(`createObjectUrlRegistry`)は`useObjectUrl.test.ts`でテストする。
 */
export function useObjectUrl(blob: Blob): string {
  const [url, setUrl] = useState(() => browserObjectUrlRegistry.acquire(blob));
  const hasRunEffectRef = useRef(false);

  useEffect(() => {
    if (!hasRunEffectRef.current) {
      // useStateの初期化で既に1回acquire済みのため、mount直後の1回目は再取得しない
      hasRunEffectRef.current = true;
    } else {
      setUrl(browserObjectUrlRegistry.acquire(blob));
    }
    return () => {
      browserObjectUrlRegistry.release(blob);
    };
  }, [blob]);

  return url;
}
