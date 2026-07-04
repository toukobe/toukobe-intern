import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '企業の方へ | トウコべインターン',
  description: '難関大生の採用をお考えの企業様へ。長期インターン求人の掲載についてご案内します。',
};

export default function ForCompaniesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
