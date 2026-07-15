import type { Metadata, Viewport } from "next";
import { Zen_Kaku_Gothic_New, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const zenKaku = Zen_Kaku_Gothic_New({
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  preload: false,
});

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://intern.toukobe.com"),
  // Google Search Console のサイト所有権確認（HTMLタグ方式）
  verification: { google: "L68jr_DK0S9tcfW_84sJJYLxyKG4a3w3xjEl7cpIQpI" },
  title: "トウコべインターン | 難関大生に特化した長期インターン",
  description: "東大・京大・早慶など難関大生のための長期インターンマッチングサービス。厳選企業の求人に、簡単に応募できます。",
  openGraph: {
    title: "トウコべインターン | 難関大生に特化した長期インターン",
    description: "東大・京大・早慶など難関大生のための長期インターンマッチングサービス。厳選企業の求人に、簡単に応募できます。",
    type: "website",
    locale: "ja_JP",
    siteName: "トウコべインターン",
  },
  twitter: {
    card: "summary_large_image",
    title: "トウコべインターン",
    description: "難関大生に特化した長期インターンマッチングサービス",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F2620C",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${zenKaku.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <body>
        {/* 全ページがクライアントからSupabaseへfetchするため事前接続しておく */}
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="anonymous" />
        )}
        {/* JSが有効な環境でだけスクロールリビールの初期非表示を適用する */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        {/* サイト全体の構造化データ（検索エンジン向け） */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: 'トウコべインターン',
                url: 'https://intern.toukobe.com',
                logo: 'https://intern.toukobe.com/toukobe-intern-logo.png',
              },
              {
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'トウコべインターン',
                url: 'https://intern.toukobe.com',
                potentialAction: {
                  '@type': 'SearchAction',
                  target: 'https://intern.toukobe.com/search?q={search_term_string}',
                  'query-input': 'required name=search_term_string',
                },
              },
            ]).replace(/</g, '\\u003c'),
          }}
        />
        {children}
      </body>
    </html>
  );
}
