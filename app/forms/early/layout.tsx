import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '早期申し込み | トウコべインターン',
  description: 'トウコべインターンの早期申し込みフォームです。',
};

export default function EarlyFormLayout({ children }: { children: React.ReactNode }) {
  return children;
}
