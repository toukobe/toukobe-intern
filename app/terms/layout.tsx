import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '利用規約 | トウコべインターン',
  description: 'トウコべインターンの利用規約です。',
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
