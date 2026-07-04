import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '職種一覧 | トウコべインターン',
  description: 'コンサル・エンジニア・マーケティングなど、職種から長期インターン求人を探せます。',
};

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
