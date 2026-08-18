import type { Metadata } from 'next';
import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';
import JobDetailClient from './JobDetailClient';

const getJobForMeta = cache(async (id: string) => {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: job } = await supabase
      .from('jobs')
      .select('job_title, job_description, cover_image_url, company_id, status, location, salary, created_at, work_conditions')
      .eq('id', id)
      .single();
    if (!job || job.status !== 'published') return null;

    const { data: company } = await supabase
      .from('companies')
      .select('company_name, website, logo_url')
      .eq('id', job.company_id)
      .single();
    return { job, company };
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const data = await getJobForMeta(id);
  if (!data) return {};
  const { job, company } = data;

  const title = `${job.job_title}${company?.company_name ? ` | ${company.company_name}` : ''} | トウコべインターン`;
  const description = (job.job_description || '').replace(/\s+/g, ' ').trim().slice(0, 120) || '難関大生に特化した長期インターンの求人情報です。';
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      ...(job.cover_image_url ? { images: [{ url: job.cover_image_url }] } : {}),
    },
    twitter: {
      card: job.cover_image_url ? 'summary_large_image' : 'summary',
      title,
      description,
    },
    alternates: { canonical: `https://intern.toukobe.com/jobs/${id}` },
  };
}

// 給与は「時給1,500〜2,000円」のような自由入力なので、構造化データ用に数値へ読み替える。
// 単位が読み取れない・数値が無い場合は baseSalary 自体を出さない（誤った金額を出すより安全）。
function parseSalary(raw?: string | null) {
  if (!raw) return null;
  const unitText =
    raw.includes('年収') ? 'YEAR' :
    raw.includes('月給') ? 'MONTH' :
    raw.includes('日給') ? 'DAY' :
    raw.includes('時給') ? 'HOUR' : null;
  if (!unitText) return null;

  // 「20万円」のような表記は 万 を掛けて円に直す
  const nums = [...raw.matchAll(/([\d,]+(?:\.\d+)?)\s*(万)?/g)]
    .map(m => {
      const n = Number(m[1].replace(/,/g, ''));
      return m[2] ? n * 10000 : n;
    })
    .filter(n => Number.isFinite(n) && n > 0);
  if (nums.length === 0) return null;

  const value = nums.length >= 2 && nums[1] > nums[0]
    ? { '@type': 'QuantitativeValue', minValue: nums[0], maxValue: nums[1], unitText }
    : { '@type': 'QuantitativeValue', value: nums[0], unitText };
  return { '@type': 'MonetaryAmount', currency: 'JPY', value };
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getJobForMeta(id);

  // Googleしごと検索向けの JobPosting 構造化データ（公開中の求人のみ）
  const jsonLd = data ? {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: data.job.job_title,
    description: data.job.job_description || '',
    datePosted: data.job.created_at || undefined,
    employmentType: 'INTERN',
    hiringOrganization: {
      '@type': 'Organization',
      name: data.company?.company_name || 'トウコべインターン掲載企業',
      ...(data.company?.website ? { sameAs: data.company.website } : {}),
      ...(data.company?.logo_url ? { logo: data.company.logo_url } : {}),
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'JP',
        ...(data.job.location ? { addressLocality: data.job.location } : {}),
      },
    },
    // 給与（Googleしごと検索の検索結果に時給が表示される）
    ...(parseSalary(data.job.salary) ? { baseSalary: parseSalary(data.job.salary) } : {}),
    // フルリモート求人は在宅可であることを明示する（Googleの要件）
    ...((data.job.work_conditions || []).includes('フルリモート')
      ? {
          jobLocationType: 'TELECOMMUTE',
          applicantLocationRequirements: { '@type': 'Country', name: 'JP' },
        }
      : {}),
    identifier: { '@type': 'PropertyValue', name: 'トウコべインターン', value: id },
    directApply: true,
  } : null;

  // パンくずリスト（検索結果に「トウコべインターン > 求人検索 > 求人名」と表示される）
  const breadcrumbLd = data ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トウコべインターン', item: 'https://intern.toukobe.com/' },
      { '@type': 'ListItem', position: 2, name: '求人検索', item: 'https://intern.toukobe.com/search' },
      { '@type': 'ListItem', position: 3, name: data.job.job_title, item: `https://intern.toukobe.com/jobs/${id}` },
    ],
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, breadcrumbLd]).replace(/</g, '\\u003c') }}
        />
      )}
      <JobDetailClient />
    </>
  );
}
