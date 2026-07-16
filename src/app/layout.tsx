import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { ServiceWorkerRegistration } from "@/components/common/ServiceWorkerRegistration";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "オタクのしおり",
  description:
    "遠征(ライブ・イベント・聖地巡礼)の持ち物・TODO・旅程を1冊のしおりにまとめられる遠征準備ツール",
  manifest: "/manifest.webmanifest",
};

// theme_colorはUIで使用しているTailwind pink-500相当(manifest.webmanifestと揃える)
export const viewport: Viewport = {
  themeColor: "#f6339a",
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
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
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
