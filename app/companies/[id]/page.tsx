import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import CompanyDetailClient from './CompanyDetailClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
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
      alternates: { canonical: `https://toukobe-intern.com/companies/${id}` },
    };
  } catch {
    return {};
  }
}

export default function CompanyDetailPage() {
  return <CompanyDetailClient />;
}
