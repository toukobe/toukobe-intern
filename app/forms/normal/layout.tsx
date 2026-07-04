import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '申し込みフォーム | トウコべインターン',
  description: 'トウコべインターンの申し込みフォームです。',
};

export default function NormalFormLayout({ children }: { children: React.ReactNode }) {
  return children;
}
