"use client";

import { useEffect, useMemo } from "react";

/**
 * 写真Blob(IndexedDB `photos`ストア由来)をObjectURL化する。
 * `Photo.blob`は常に存在する(Blob型・nullable無し)ため、このフックも非nullのBlobのみ扱う。
 * URLの生成自体は`blob`が変わった時だけ行いたいので`useMemo`で計算し、
 * 生成したURLの破棄(`revokeObjectURL`)のみを`useEffect`のクリーンアップで行う
 * (`useEffect`本体で直接`setState`する形は避け、react-hooksのsetState-in-effect指摘を避ける設計)。
 * ブラウザ専用API(`URL.createObjectURL`)に依存するため、Node環境のvitestではテスト対象外。
 */
export function useObjectUrl(blob: Blob): string {
  const url = useMemo(() => URL.createObjectURL(blob), [blob]);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [url]);

  return url;
}
