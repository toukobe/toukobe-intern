import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'プライバシーポリシー | トウコべインターン',
  description: 'トウコべインターンの個人情報の取り扱いについてのご案内です。',
};

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
