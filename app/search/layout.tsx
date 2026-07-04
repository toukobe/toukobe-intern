import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '求人検索 | トウコべインターン',
  description: '難関大生向け長期インターンの求人を職種・勤務地・条件から検索できます。',
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
