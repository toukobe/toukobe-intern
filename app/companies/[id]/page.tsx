import type { Metadata } from 'next';
import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';
import CompanyDetailClient from './CompanyDetailClient';

// metadata と構造化データで同じ企業を2回取りに行かないよう、リクエスト内でキャッシュする
const getCompanyForMeta = cache(async (id: string) => {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: company } = await supabase
      .from('companies')
      .select('company_name, industry, description, cover_url')
      .eq('id', id)
      .single();
    return company || null;
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const company = await getCompanyForMeta(id);
  if (!company) return {};

  const title = `${company.company_name}${company.industry ? ` | ${company.industry}` : ''} | トウコべインターン`;
  const description = (company.description || '').replace(/\s+/g, ' ').trim().slice(0, 120) || `${company.company_name}の企業情報と長期インターン求人一覧です。`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      ...(company.cover_url ? { images: [{ url: company.cover_url }] } : {}),
    },
    twitter: {
      card: company.cover_url ? 'summary_large_image' : 'summary',
      title,
      description,
    },
    alternates: { canonical: `https://intern.toukobe.com/companies/${id}` },
  };
}

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = await getCompanyForMeta(id);

  // パンくずリスト（検索結果に「トウコべインターン > 企業名」と表示される）
  const breadcrumbLd = company ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トウコべインターン', item: 'https://intern.toukobe.com/' },
      { '@type': 'ListItem', position: 2, name: company.company_name, item: `https://intern.toukobe.com/companies/${id}` },
    ],
  } : null;

  return (
    <>
      {breadcrumbLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd).replace(/</g, '\\u003c') }}
        />
      )}
      <CompanyDetailClient />
    </>
  );
}
