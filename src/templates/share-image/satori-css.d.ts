/**
 * satoriはCSSの `lineClamp` という独自拡張プロパティ(標準のCSSProperties型には無い)を解釈する
 * (node_modules/satori/README.md「lineClamp: Supported」)。
 * `@types/react` の `CSSProperties` にはこのキーが無くTS型エラーになるため、
 * このテンプレートモジュール配下でのみ型を拡張する。
 */
import "react";

declare module "react" {
  interface CSSProperties {
    lineClamp?: number;
  }
}
