import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ご利用の流れ | トウコべインターン',
  description: '会員登録から応募・選考・インターン開始までの流れをご紹介します。',
};

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
