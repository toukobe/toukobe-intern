import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import JobDetailClient from './JobDetailClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: job } = await supabase
      .from('jobs')
      .select('job_title, job_description, cover_image_url, company_id, status')
      .eq('id', id)
      .single();
    if (!job || job.status !== 'published') return {};

    const { data: company } = await supabase
      .from('companies')
      .select('company_name')
      .eq('id', job.company_id)
      .single();

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
      alternates: { canonical: `https://toukobe-intern.com/jobs/${id}` },
    };
  } catch {
    return {};
  }
}

export default function JobDetailPage() {
  return <JobDetailClient />;
}
