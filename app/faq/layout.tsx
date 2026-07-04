import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'よくある質問（FAQ） | トウコべインターン',
  description: 'トウコべインターンのご利用に関するよくある質問と回答をまとめています。',
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
