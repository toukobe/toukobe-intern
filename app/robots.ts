import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

// サイトモードに応じてクロール可否を切り替えるため、リクエスト毎に評価する
export const dynamic = 'force-dynamic'

export default async function robots(): Promise<MetadataRoute.Robots> {
  let mode = 'public'
  try {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data } = await sb.from('site_settings').select('site_mode').eq('id', 1).maybeSingle()
    if (data?.site_mode === 'prelaunch' || data?.site_mode === 'maintenance') mode = data.site_mode
  } catch {
    // 取得失敗時は通常公開扱い（サイトの検索表示を誤って止めない）
  }

  // 公開前・メンテナンス中は全ページをクロール禁止（検索結果に出さない）
  if (mode !== 'public') {
    return { rules: { userAgent: '*', disallow: '/' } }
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/auth/', '/api/'],
    },
    sitemap: 'https://intern.toukobe.com/sitemap.xml',
  }
}
