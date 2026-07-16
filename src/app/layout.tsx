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
  title: "オタクのしおり | 遠征のすべてを、1冊のしおりに。",
  description:
    "ライブ・イベント・聖地巡礼などオタクの遠征準備を1冊の「しおり」に。持ち物リスト・TODO・旅程・行きたいスポット・写真の記録が、登録なしで無料で使える遠征ツールです。",
  manifest: "/manifest.webmanifest",
};

// theme_colorはUIで使用しているTailwind pink-500相当(manifest.webmanifestと揃える)
export const viewport: Viewport = {
  themeColor: "#f6339a",
};

// 計測スタブ: NEXT_PUBLIC_GA_IDが設定されている場合のみGA4を読み込む。
// 未設定なら一切何も読み込まない(計測ツールの最終選定・アカウント作成はオーナー判断)。
const gaId = process.env.NEXT_PUBLIC_GA_ID;

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
