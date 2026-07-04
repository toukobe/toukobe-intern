import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'お問い合わせ | トウコべインターン',
  description: 'トウコべインターンへのお問い合わせはこちらのフォームからお送りください。',
};

export default function ContactFormLayout({ children }: { children: React.ReactNode }) {
  return children;
}
