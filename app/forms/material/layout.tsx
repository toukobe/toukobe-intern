import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '資料請求 | トウコべインターン',
  description: 'トウコべインターンのサービス資料はこちらのフォームからご請求ください。',
};

export default function MaterialFormLayout({ children }: { children: React.ReactNode }) {
  return children;
}
