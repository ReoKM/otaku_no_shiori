import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import Script from "next/script";
import { ServiceWorkerRegistration } from "@/components/common/ServiceWorkerRegistration";
import "./globals.css";

// 単一ファミリー(見出し・本文とも共通)。Space GroteskはCJKグリフを含まないため、
// 日本語部分はフォントスタック(system-ui, sans-serif)に自動フォールバックする
// (英数字・記号のみSpace Groteskで描画される)。
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "オタクのしおり | 遠征のすべてを、1冊のしおりに。",
  description:
    "ライブ・イベント・聖地巡礼などオタクの遠征準備を1冊の「しおり」に。持ち物リスト・TODO・旅程・行きたいスポット・写真の記録が、登録なしで無料で使える遠征ツールです。",
  manifest: "/manifest.webmanifest",
};

// theme_colorはUIで使用しているブランドプライマリ相当(manifest.webmanifestと揃える)
export const viewport: Viewport = {
  themeColor: "#747bd9",
};

// 計測スタブ: NEXT_PUBLIC_GA_IDが設定されており、かつ測定IDとして妥当な形式
// (英数字とハイフンのみ)の場合のみGA4を読み込む。値はインラインスクリプトへ埋め込むため、
// 想定外の文字列を弾いてスクリプトインジェクションを防ぐ(多層防御)。
// 未設定なら一切何も読み込まない(計測ツールの最終選定・アカウント作成はオーナー判断)。
const rawGaId = process.env.NEXT_PUBLIC_GA_ID;
const gaId = rawGaId && /^[A-Za-z0-9-]+$/.test(rawGaId) ? rawGaId : undefined;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${spaceGrotesk.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <ServiceWorkerRegistration />
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
