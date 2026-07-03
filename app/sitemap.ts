import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const SITE = 'https://toukobe-intern.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE}/search`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE}/categories`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE}/how-it-works`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE}/for-companies`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE}/faq`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE}/forms/contact`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE}/forms/material`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE}/privacy-policy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE}/terms`, changeFrequency: 'yearly', priority: 0.2 },
  ]

  // 公開中の求人・企業ページ（RLS未設定などで取得できない場合は静的ページのみ返す）
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const [{ data: jobs }, { data: companies }] = await Promise.all([
      supabase.from('jobs').select('id, created_at').eq('status', 'published'),
      supabase.from('companies').select('id'),
    ])
    const jobPages: MetadataRoute.Sitemap = (jobs || []).map((j) => ({
      url: `${SITE}/jobs/${j.id}`,
      lastModified: j.created_at ? new Date(j.created_at) : undefined,
      changeFrequency: 'weekly',
      priority: 0.8,
    }))
    const companyPages: MetadataRoute.Sitemap = (companies || []).map((c) => ({
      url: `${SITE}/companies/${c.id}`,
      changeFrequency: 'weekly',
      priority: 0.5,
    }))
    return [...staticPages, ...jobPages, ...companyPages]
  } catch {
    return staticPages
  }
}
