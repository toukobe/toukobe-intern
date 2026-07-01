import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
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
    card: "summary",
    title: "トウコべインターン",
    description: "難関大生に特化した長期インターンマッチングサービス",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        {children}
      </body>
    </html>
  );
}
