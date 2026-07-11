import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '利用規約（企業版） | トウコべインターン',
  description: 'トウコべインターンの企業会員向け利用規約です。',
};

export default function CompanyTermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
