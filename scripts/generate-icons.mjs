// PWAアイコン生成用の一回限りのスクリプト(public/icon.svgからPNGを書き出す)。
// リポジトリには残さない(生成物のPNGのみコミットする想定)。
// 実行: node scripts/generate-icons.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";

const svg = readFileSync(new URL("../public/icon.svg", import.meta.url));

const targets = [
  { file: "public/icon-192.png", size: 192 },
  { file: "public/icon-512.png", size: 512 },
  { file: "public/apple-touch-icon.png", size: 180 },
];

for (const { file, size } of targets) {
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: size } });
  const png = resvg.render().asPng();
  writeFileSync(new URL(`../${file}`, import.meta.url), png);
  console.log(`✓ ${file} (${size}x${size})`);
}
