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
      .select('job_title, job_description, cover_image_url, company_id, status, location, salary, created_at')
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
    directApply: true,
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      )}
      <JobDetailClient />
    </>
  );
}
