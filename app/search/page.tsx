'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useIsMobile } from '@/utils/useIsMobile';
import { PREFECTURES, TOKYO_AREAS } from '@/utils/constants';
import { fetchFeatureTagOptions } from '@/utils/featureTags';
import { COVER_ASPECT } from '@/utils/coverImage';
import SiteFooter from '@/components/SiteFooter';

interface Job {
  id: string;
  company_id: string;
  job_title: string;
  salary: string;
  location: string;
  job_description: string;
  job_categories: string[];
  status: string;
  cover_image_url?: string;
  cover_image_position?: string;
  companies: { company_name: string; industry: string; logo_url?: string; cover_url?: string } | null;
}

interface User {
  id: string;
  email?: string;
}

interface UserType {
  user_type: string;
}

const FF = "var(--font-sans)";

const categoryList = [
  'マーケティング', 'エンジニア', 'コンサルティング', '経営・企画',
  '営業', '金融・ファイナンス', 'ライター・メディア', '経理',
  '人事・広報', 'デザイナー', '事務・アシスタント', 'その他',
];
const conditionList = ['フルリモート', '一部リモート', 'フレックス勤務', '土日勤務可'];
const featureList = ['未経験OK', '交通費支給', '服装髪型自由'];

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();

  const [menuOpen, setMenuOpen] = useState(false);
  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [tokyoArea, setTokyoArea] = useState(searchParams.get('area') || '');
  const [condition, setCondition] = useState(searchParams.get('condition') || '');
  const [feature, setFeature] = useState(searchParams.get('feature') || '');
  const [tag, setTag] = useState(searchParams.get('tag') || '');
  const [activeOnly, setActiveOnly] = useState(searchParams.get('active') === '1');
  const [tagOptions, setTagOptions] = useState<string[]>([]);
  useEffect(() => { fetchFeatureTagOptions().then(setTagOptions); }, []);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoriteIds, setFavoriteIds] = useState<Map<string, string>>(new Map());
  const [favLoading, setFavLoading] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUser(session.user as User);
      const { data: ut } = await supabase.from('user_types').select('user_type').eq('user_id', session.user.id).single();
      if (ut) setUserType(ut as UserType);
    }
    checkAuth();
  }, []);

  // 学生ユーザーのお気に入りを初期ロード
  useEffect(() => {
    if (!user || userType?.user_type !== 'student') return;
    supabase
      .from('favorites')
      .select('id, job_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) {
          setFavorites(new Set(data.map((f: { job_id: string }) => f.job_id)));
          setFavoriteIds(new Map(data.map((f: { id: string; job_id: string }) => [f.job_id, f.id])));
        }
      });
  }, [user, userType]);

  // URLパラメータの変化に追従して検索を実行
  useEffect(() => {
    const kw = searchParams.get('q') || '';
    const cat = searchParams.get('category') || '';
    const loc = searchParams.get('location') || '';
    const area = searchParams.get('area') || '';
    const cond = searchParams.get('condition') || '';
    const feat = searchParams.get('feature') || '';
    const tg = searchParams.get('tag') || '';
    const active = searchParams.get('active') === '1';
    setKeyword(kw);
    setCategory(cat);
    setLocation(loc);
    setTokyoArea(area);
    setCondition(cond);
    setFeature(feat);
    setTag(tg);
    setActiveOnly(active);
    fetchJobs(kw, cat, loc, area, cond, feat, active, tg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchJobs = async (kw: string, cat: string, loc: string, area: string = '', cond: string = '', feat: string = '', active: boolean = false, tg: string = '') => {
    setLoading(true);
    try {
      // Step 1: fetch jobs without join
      let query = supabase
        .from('jobs')
        .select('id, company_id, job_title, salary, location, job_description, job_categories, status, cover_image_url, cover_image_position')
        .in('status', active ? ['published'] : ['published', 'paused']);

      if (cat) query = (query as any).contains('job_categories', [cat]);
      if (cond) query = (query as any).contains('work_conditions', [cond]);
      if (feat) query = (query as any).contains('job_features', [feat]);
      if (tg) query = (query as any).contains('feature_tags', [tg]);
      // 東京の詳細地域が選ばれていればそちらで絞り込む
      if (area) query = query.ilike('location', `%${area}%`);
      else if (loc) query = query.ilike('location', `%${loc}%`);

      const { data: jobRows, error } = await query;
      if (error) throw error;
      if (!jobRows || jobRows.length === 0) { setJobs([]); return; }

      // Step 2: fetch company names for those jobs
      const companyIds = [...new Set(jobRows.map((j: any) => j.company_id).filter(Boolean))];
      let companyMap: Record<string, { company_name: string; industry: string; logo_url?: string; cover_url?: string }> = {};
      if (companyIds.length > 0) {
        const { data: companies } = await supabase
          .from('companies')
          .select('id, company_name, industry, logo_url, cover_url')
          .in('id', companyIds);
        if (companies) {
          companies.forEach((c: any) => { companyMap[c.id] = { company_name: c.company_name, industry: c.industry, logo_url: c.logo_url, cover_url: c.cover_url }; });
        }
      }

      // Step 3: merge + keyword filter on company name
      let merged: Job[] = jobRows.map((j: any) => ({
        ...j,
        companies: companyMap[j.company_id] || null,
      }));

      // Also filter by company name if keyword given
      if (kw) {
        const kwLower = kw.toLowerCase();
        merged = merged.filter(j =>
          j.job_title.toLowerCase().includes(kwLower) ||
          (j.job_description || '').toLowerCase().includes(kwLower) ||
          (j.companies?.company_name || '').toLowerCase().includes(kwLower)
        );
      }

      // 募集停止を最後に
      merged.sort((a, b) => {
        if (a.status === 'paused' && b.status !== 'paused') return 1;
        if (a.status !== 'paused' && b.status === 'paused') return -1;
        return 0;
      });

      setJobs(merged);
    } catch (e) {
      console.error('Search error:', e);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(); if (tag) params.set('tag', tag);
    if (keyword) params.set('q', keyword);
    if (category) params.set('category', category);
    if (location) params.set('location', location);
    if (location === '東京都' && tokyoArea) params.set('area', tokyoArea);
    if (condition) params.set('condition', condition);
    if (feature) params.set('feature', feature);
    if (activeOnly) params.set('active', '1');
    router.push(`/search?${params.toString()}`);
  };

  const handleToggleFavorite = async (jobId: string) => {
    if (!user) { router.push('/auth/login'); return; }
    if (userType?.user_type !== 'student') return;

    setFavLoading(prev => new Set(prev).add(jobId));
    try {
      if (favorites.has(jobId)) {
        const favId = favoriteIds.get(jobId);
        if (favId) {
          await supabase.from('favorites').delete().eq('id', favId);
          setFavorites(prev => { const n = new Set(prev); n.delete(jobId); return n; });
          setFavoriteIds(prev => { const n = new Map(prev); n.delete(jobId); return n; });
        }
      } else {
        const { data } = await supabase
          .from('favorites')
          .upsert({ user_id: user.id, job_id: jobId }, { onConflict: 'user_id,job_id' })
          .select('id')
          .single();
        setFavorites(prev => new Set(prev).add(jobId));
        if (data) setFavoriteIds(prev => new Map(prev).set(jobId, data.id));
      }
    } finally {
      setFavLoading(prev => { const n = new Set(prev); n.delete(jobId); return n; });
    }
  };

  const isStudent = userType?.user_type === 'student';

  return (
    <div style={{ minHeight: '100vh', background: '#FBF8F4', fontFamily: FF, color: '#1C1813' }}>

      {/* NAV */}
      <div style={{ background: 'rgba(255,255,255,.95)', borderBottom: '1px solid #EFE8DF', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ padding: isMobile ? '14px 16px' : '14px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 36, cursor: 'pointer' }} onClick={() => router.push('/')} />
            {!isMobile && (
              <nav style={{ display: 'flex', gap: 20 }}>
                {[
                  { label: '求人検索', href: '/search' },
                  { label: '職種一覧', href: '/categories' },
                  { label: '使い方', href: '/how-it-works' },
                  { label: '企業の方へ', href: '/for-companies' },
                ].map(item => (
                  <span key={item.href} className="nav-link" onClick={() => router.push(item.href)} style={{ fontSize: 13, color: item.href === '/search' ? '#F2620C' : '#57514A', fontWeight: item.href === '/search' ? 700 : 500, cursor: 'pointer', textDecoration: item.href === '/search' ? 'underline' : 'none', textUnderlineOffset: 3 }}>{item.label}</span>
                ))}
              </nav>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {!isMobile && user && (
              <>
                {userType?.user_type === 'student' && <button onClick={() => router.push('/dashboard/student')} style={{ background: '#fff', color: '#57514A', border: '1px solid #EFE8DF', borderRadius: 8, padding: '9px 18px', fontFamily: FF, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>マイページ</button>}
                {userType?.user_type === 'company' && <button onClick={() => router.push('/dashboard/company')} style={{ background: '#fff', color: '#57514A', border: '1px solid #EFE8DF', borderRadius: 8, padding: '9px 18px', fontFamily: FF, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>ダッシュボード</button>}
                <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} style={{ background: '#fff', color: '#57514A', border: '1px solid #EFE8DF', borderRadius: 8, padding: '9px 18px', fontFamily: FF, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>ログアウト</button>
              </>
            )}
            {!isMobile && !user && (
              <>
                <button onClick={() => router.push('/auth/login')} style={{ background: '#fff', color: '#57514A', border: '1px solid #EFE8DF', borderRadius: 8, padding: '9px 18px', fontFamily: FF, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>ログイン</button>
                <button onClick={() => router.push('/auth/signup')} style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontFamily: FF, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>無料で登録</button>
              </>
            )}
            {isMobile && (
              <button onClick={() => setMenuOpen(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', display: 'flex', flexDirection: 'column', gap: 5 }} aria-label="メニュー">
                <span style={{ display: 'block', width: 22, height: 2, background: menuOpen ? '#F2620C' : '#555', borderRadius: 2, transition: 'all .2s', transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none' }} />
                <span style={{ display: 'block', width: 22, height: 2, background: menuOpen ? 'transparent' : '#555', borderRadius: 2, transition: 'all .2s' }} />
                <span style={{ display: 'block', width: 22, height: 2, background: menuOpen ? '#F2620C' : '#555', borderRadius: 2, transition: 'all .2s', transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
              </button>
            )}
          </div>
        </div>
        {isMobile && menuOpen && (
          <div style={{ background: '#fff', borderTop: '1px solid #EBEBEB', padding: '12px 20px 20px' }}>
            {[['求人検索','/search'],['職種一覧','/categories'],['使い方','/how-it-works'],['企業の方へ','/for-companies'],['よくある質問','/faq']].map(([l,h]) => (
              <div key={h} onClick={() => { router.push(h); setMenuOpen(false); }}
                style={{ padding: '13px 0', borderBottom: '1px solid #F5F2EE', fontSize: 15, fontWeight: h === '/search' ? 700 : 600, color: h === '/search' ? '#F2620C' : '#1C1813', cursor: 'pointer' }}>
                {l}
              </div>
            ))}
            {user ? (
              <>
                {userType?.user_type === 'student' && <div onClick={() => { router.push('/dashboard/student'); setMenuOpen(false); }} style={{ padding: '13px 0', borderBottom: '1px solid #F5F2EE', fontSize: 15, fontWeight: 600, color: '#1C1813', cursor: 'pointer' }}>マイページ</div>}
                {userType?.user_type === 'company' && <div onClick={() => { router.push('/dashboard/company'); setMenuOpen(false); }} style={{ padding: '13px 0', borderBottom: '1px solid #F5F2EE', fontSize: 15, fontWeight: 600, color: '#1C1813', cursor: 'pointer' }}>ダッシュボード</div>}
                <div onClick={() => { supabase.auth.signOut().then(() => router.push('/')); setMenuOpen(false); }} style={{ padding: '13px 0', fontSize: 15, fontWeight: 600, color: '#938B81', cursor: 'pointer' }}>ログアウト</div>
              </>
            ) : (
              <>
                <div onClick={() => { router.push('/auth/login'); setMenuOpen(false); }} style={{ padding: '13px 0', borderBottom: '1px solid #F5F2EE', fontSize: 15, fontWeight: 600, color: '#1C1813', cursor: 'pointer' }}>ログイン</div>
                <div onClick={() => { router.push('/auth/signup'); setMenuOpen(false); }} style={{ padding: '13px 0', fontSize: 15, fontWeight: 700, color: '#F2620C', cursor: 'pointer' }}>無料で登録</div>
              </>
            )}
          </div>
        )}
      </div>

      {/* SEARCH BAR */}
      <div style={{ background: 'linear-gradient(160deg,#FFF6EE,#FFEFE2)', padding: isMobile ? '24px 16px 20px' : '48px 48px 40px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h1 style={{ fontWeight: 900, fontSize: isMobile ? 18 : 28, margin: '0 0 24px' }}>求人検索</h1>
          <form onSubmit={handleSearch}>
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 12px 36px rgba(28,24,19,.10)', padding: 10, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 6 : 8, alignItems: 'center' }}>
              <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 0 12px', width: isMobile ? '100%' : undefined }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C2B8AC" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /></svg>
                <input
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  placeholder="職種・キーワード"
                  style={{ flex: 1, border: 'none', padding: '14px 0', fontFamily: FF, fontSize: 14, outline: 'none', color: '#1C1813', background: 'transparent' }}
                />
              </div>
              <div style={{ position: 'relative', flex: 1, width: isMobile ? '100%' : undefined }}>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{ width: '100%', border: 'none', borderLeft: isMobile ? 'none' : '1px solid #EFE8DF', borderTop: isMobile ? '1px solid #EFE8DF' : 'none', padding: '14px 28px 14px 16px', fontFamily: FF, fontSize: 13, color: '#57514A', outline: 'none', background: '#fff', cursor: 'pointer', appearance: 'none' as const }}
                >
                  <option value="">職種</option>
                  {categoryList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#C2B8AC', pointerEvents: 'none', fontSize: 10 }}>▼</span>
              </div>
              <div style={{ position: 'relative', flex: 1, width: isMobile ? '100%' : undefined }}>
                <select
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  style={{ width: '100%', border: 'none', borderLeft: isMobile ? 'none' : '1px solid #EFE8DF', borderTop: isMobile ? '1px solid #EFE8DF' : 'none', padding: '14px 28px 14px 16px', fontFamily: FF, fontSize: 13, color: '#57514A', outline: 'none', background: '#fff', cursor: 'pointer', appearance: 'none' as const }}
                >
                  <option value="">勤務地</option>
                  {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#C2B8AC', pointerEvents: 'none', fontSize: 10 }}>▼</span>
              </div>
              <button type="submit" className="btn-primary" style={{ background: '#F2620C', color: '#fff', border: 'none', padding: isMobile ? '14px' : '14px 32px', width: isMobile ? '100%' : 'auto', borderRadius: 10, fontFamily: FF, fontWeight: 700, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(242,98,12,.28)' }}>
                検索
              </button>
            </div>

            {/* 募集中のみ チェックボックス */}
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' as const }}>
                <div
                  onClick={() => {
                    const next = !activeOnly;
                    setActiveOnly(next);
                    const params = new URLSearchParams(); if (tag) params.set('tag', tag);
                    if (keyword) params.set('q', keyword);
                    if (category) params.set('category', category);
                    if (location) params.set('location', location);
                    if (location === '東京都' && tokyoArea) params.set('area', tokyoArea);
                    if (condition) params.set('condition', condition);
                    if (feature) params.set('feature', feature);
                    if (next) params.set('active', '1');
                    router.push(`/search?${params.toString()}`);
                  }}
                  style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${activeOnly ? '#F2620C' : '#C2B8AC'}`, background: activeOnly ? '#F2620C' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: '.15s', cursor: 'pointer' }}
                >
                  {activeOnly && (
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: 13, color: activeOnly ? '#F2620C' : '#57514A', fontWeight: activeOnly ? 700 : 400 }}>募集中のみ表示</span>
              </label>
            </div>

            {/* 東京 詳細エリア */}
            {location === '東京都' && (
              <div style={{ marginTop: 12, background: 'rgba(255,255,255,.7)', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: '#F2620C', marginBottom: 8, fontWeight: 700, letterSpacing: '.04em' }}>🗼 東京 詳細エリア</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {TOKYO_AREAS.map(a => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setTokyoArea(tokyoArea === a ? '' : a)}
                      style={{ fontSize: 12, padding: '5px 12px', borderRadius: 999, border: `1px solid ${tokyoArea === a ? '#F2620C' : '#EFE8DF'}`, background: tokyoArea === a ? '#F2620C' : '#fff', color: tokyoArea === a ? '#fff' : '#57514A', fontFamily: FF, fontWeight: tokyoArea === a ? 700 : 400, cursor: 'pointer', transition: '.15s' }}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 勤務条件・求人特徴 フィルター */}
            <div style={{ marginTop: isMobile ? 12 : 16, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, color: '#938B81', marginBottom: 8, fontWeight: 600 }}>勤務条件</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {conditionList.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCondition(condition === c ? '' : c)}
                      style={{ fontSize: 12, padding: '6px 14px', borderRadius: 999, border: `1px solid ${condition === c ? '#F2620C' : '#EFE8DF'}`, background: condition === c ? '#FFF1E8' : '#fff', color: condition === c ? '#F2620C' : '#57514A', fontFamily: FF, fontWeight: condition === c ? 700 : 400, cursor: 'pointer', transition: '.15s' }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#938B81', marginBottom: 8, fontWeight: 600 }}>求人の特徴</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {featureList.map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFeature(feature === f ? '' : f)}
                      style={{ fontSize: 12, padding: '6px 14px', borderRadius: 999, border: `1px solid ${feature === f ? '#F2620C' : '#EFE8DF'}`, background: feature === f ? '#FFF1E8' : '#fff', color: feature === f ? '#F2620C' : '#57514A', fontFamily: FF, fontWeight: feature === f ? 700 : 400, cursor: 'pointer', transition: '.15s' }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 特徴タグ */}
            {tagOptions.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, color: '#938B81', marginBottom: 8, fontWeight: 600 }}>特徴タグ</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {tagOptions.map(t => {
                    const on = tag === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          const p = new URLSearchParams();
                          if (keyword) p.set('q', keyword);
                          if (category) p.set('category', category);
                          if (location) p.set('location', location);
                          if (location === '東京都' && tokyoArea) p.set('area', tokyoArea);
                          if (condition) p.set('condition', condition);
                          if (feature) p.set('feature', feature);
                          if (activeOnly) p.set('active', '1');
                          if (!on) p.set('tag', t); // 同じタグを再クリックで解除
                          router.push(`/search?${p.toString()}`);
                        }}
                        style={{ fontSize: 12, padding: '6px 14px', borderRadius: 999, border: `1px solid ${on ? '#6D28D9' : '#DDD6FE'}`, background: on ? '#6D28D9' : '#F5F3FF', color: on ? '#fff' : '#6D28D9', fontFamily: FF, fontWeight: on ? 700 : 500, cursor: 'pointer', transition: '.15s' }}
                      >
                        #{t}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* RESULTS */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '24px 16px' : '40px 48px' }}>
        {loading ? (
          <>
            <div style={{ height: 32, marginBottom: 24 }} />
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 20 }}>
              {[0,1,2,3,4,5].map(i => (
                <div key={i} style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, overflow: 'hidden' }}>
                  <div className="skeleton" style={{ aspectRatio: COVER_ASPECT, borderRadius: 0 }} />
                  <div style={{ padding: '16px 18px 20px' }}>
                    <div className="skeleton" style={{ height: 11, marginBottom: 10, width: '50%' }} />
                    <div className="skeleton" style={{ height: 16, marginBottom: 8, width: '80%' }} />
                    <div className="skeleton" style={{ height: 13, width: '35%' }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: isMobile ? 32 : 48, marginBottom: 16 }}>🔍</div>
            <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>求人が見つかりませんでした</p>
            <p style={{ color: '#938B81', fontSize: 14, marginBottom: 28 }}>検索条件を変えてお試しください</p>
            <button onClick={() => router.push('/search')} style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontFamily: FF, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              全件表示
            </button>
          </div>
        ) : (
          <>
            {/* アクティブフィルターチップ */}
            {(keyword || category || location || condition || feature || tag || activeOnly) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {tag && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, background: '#F5F3FF', color: '#6D28D9', border: '1px solid #DDD6FE', borderRadius: 999, padding: '5px 12px' }}>
                    #{tag}
                    <button onClick={() => { setTag(''); const p = new URLSearchParams(); if (keyword) p.set('q', keyword); if (category) p.set('category', category); if (location) p.set('location', location); if (condition) p.set('condition', condition); if (feature) p.set('feature', feature); if (activeOnly) p.set('active', '1'); router.push(`/search?${p.toString()}`); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6D28D9', padding: 0, lineHeight: 1, fontSize: 14, fontWeight: 900 }}>×</button>
                  </span>
                )}
                {keyword && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, background: '#FFF1E8', color: '#F2620C', border: '1px solid #FBD5C0', borderRadius: 999, padding: '5px 12px' }}>
                    🔍 {keyword}
                    <button onClick={() => { setKeyword(''); const p = new URLSearchParams(); if (tag) p.set('tag', tag); if (category) p.set('category', category); if (location) p.set('location', location); if (condition) p.set('condition', condition); if (feature) p.set('feature', feature); if (activeOnly) p.set('active', '1'); router.push(`/search?${p.toString()}`); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F2620C', padding: 0, lineHeight: 1, fontSize: 14, fontWeight: 900 }}>×</button>
                  </span>
                )}
                {category && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, background: '#FFF1E8', color: '#F2620C', border: '1px solid #FBD5C0', borderRadius: 999, padding: '5px 12px' }}>
                    {category}
                    <button onClick={() => { setCategory(''); const p = new URLSearchParams(); if (tag) p.set('tag', tag); if (keyword) p.set('q', keyword); if (location) p.set('location', location); if (condition) p.set('condition', condition); if (feature) p.set('feature', feature); if (activeOnly) p.set('active', '1'); router.push(`/search?${p.toString()}`); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F2620C', padding: 0, lineHeight: 1, fontSize: 14, fontWeight: 900 }}>×</button>
                  </span>
                )}
                {location && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, background: '#FFF1E8', color: '#F2620C', border: '1px solid #FBD5C0', borderRadius: 999, padding: '5px 12px' }}>
                    📍 {location}
                    <button onClick={() => { setLocation(''); setTokyoArea(''); const p = new URLSearchParams(); if (tag) p.set('tag', tag); if (keyword) p.set('q', keyword); if (category) p.set('category', category); if (condition) p.set('condition', condition); if (feature) p.set('feature', feature); if (activeOnly) p.set('active', '1'); router.push(`/search?${p.toString()}`); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F2620C', padding: 0, lineHeight: 1, fontSize: 14, fontWeight: 900 }}>×</button>
                  </span>
                )}
                {condition && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, background: '#FFF1E8', color: '#F2620C', border: '1px solid #FBD5C0', borderRadius: 999, padding: '5px 12px' }}>
                    {condition}
                    <button onClick={() => { setCondition(''); const p = new URLSearchParams(); if (tag) p.set('tag', tag); if (keyword) p.set('q', keyword); if (category) p.set('category', category); if (location) p.set('location', location); if (feature) p.set('feature', feature); if (activeOnly) p.set('active', '1'); router.push(`/search?${p.toString()}`); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F2620C', padding: 0, lineHeight: 1, fontSize: 14, fontWeight: 900 }}>×</button>
                  </span>
                )}
                {feature && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, background: '#FFF1E8', color: '#F2620C', border: '1px solid #FBD5C0', borderRadius: 999, padding: '5px 12px' }}>
                    ✓ {feature}
                    <button onClick={() => { setFeature(''); const p = new URLSearchParams(); if (tag) p.set('tag', tag); if (keyword) p.set('q', keyword); if (category) p.set('category', category); if (location) p.set('location', location); if (condition) p.set('condition', condition); if (activeOnly) p.set('active', '1'); router.push(`/search?${p.toString()}`); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F2620C', padding: 0, lineHeight: 1, fontSize: 14, fontWeight: 900 }}>×</button>
                  </span>
                )}
                {activeOnly && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, background: '#FFF1E8', color: '#F2620C', border: '1px solid #FBD5C0', borderRadius: 999, padding: '5px 12px' }}>
                    募集中のみ
                    <button onClick={() => { setActiveOnly(false); const p = new URLSearchParams(); if (tag) p.set('tag', tag); if (keyword) p.set('q', keyword); if (category) p.set('category', category); if (location) p.set('location', location); if (condition) p.set('condition', condition); if (feature) p.set('feature', feature); router.push(`/search?${p.toString()}`); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F2620C', padding: 0, lineHeight: 1, fontSize: 14, fontWeight: 900 }}>×</button>
                  </span>
                )}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: isMobile ? 10 : 0, marginBottom: 24 }}>
              <h2 style={{ fontWeight: 900, fontSize: 20, margin: 0 }}>
                検索結果
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: '#938B81', fontWeight: 400, marginLeft: 10 }}>{jobs.length} 件</span>
              </h2>
              <button
                onClick={() => { setKeyword(''); setCategory(''); setLocation(''); setTokyoArea(''); setCondition(''); setFeature(''); setTag(''); setActiveOnly(false); router.push('/search'); }}
                style={{ fontSize: 13, color: '#938B81', background: '#fff', border: '1px solid #EFE8DF', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontFamily: FF }}
              >
                条件をリセット
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 20 }}>
              {jobs.map(j => {
                const faved = favorites.has(j.id);
                const fl = favLoading.has(j.id);
                return (
                  <div
                    key={j.id}
                    className={j.status === 'paused' ? undefined : 'job-card'}
                    style={{ background: j.status === 'paused' ? '#F5F3F1' : '#fff', border: `1px solid ${j.status === 'paused' ? '#D8D2CA' : '#EFE8DF'}`, borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', position: 'relative', opacity: j.status === 'paused' ? 0.72 : 1 }}
                  >
                    {/* カバー画像エリア */}
                    {(() => {
                      const cats2 = [['#7C3AED','#4F46E5'],['#F2620C','#FB923C'],['#0EA5E9','#38BDF8'],['#10B981','#34D399'],['#EC4899','#F472B6'],['#8B5CF6','#A78BFA'],['#F59E0B','#FCD34D'],['#EF4444','#F87171'],['#06B6D4','#67E8F9']];
                      const idx = jobs.indexOf(j);
                      const [c1,c2] = cats2[idx % cats2.length];
                      return (
                        <div style={{ aspectRatio: COVER_ASPECT, position: 'relative', overflow: 'hidden', flexShrink: 0 }}
                          onClick={() => router.push(`/jobs/${j.id}`)}>
                          {j.cover_image_url || j.companies?.cover_url
                            ? <img className="job-cover" src={j.cover_image_url || j.companies?.cover_url || ''} alt="" loading="lazy" decoding="async" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:j.cover_image_position || '50% 50%', display:'block' }} />
                            : <>
                                <div style={{ position:'absolute', inset:0, background:`linear-gradient(135deg,${c1},${c2})` }} />
                                <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:.13 }} viewBox="0 0 320 120" preserveAspectRatio="xMidYMid slice">
                                  <circle cx="280" cy="-10" r="110" fill="#fff"/><circle cx="20" cy="130" r="90" fill="#fff"/>
                                </svg>
                              </>
                          }
                          {/* ロゴバッジ */}
                          <div style={{ position:'absolute', bottom:10, left:12, width:34, height:34, borderRadius:9, background:'rgba(255,255,255,.92)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:13, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,.15)' }}>
                            {j.companies?.logo_url
                              ? <img src={j.companies.logo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'contain', borderRadius:9 }} />
                              : <span style={{ color: j.companies?.cover_url ? '#57514A' : c1 }}>{(j.companies?.company_name || j.job_title).charAt(0)}</span>
                            }
                          </div>
                          {/* 募集停止オーバーレイ */}
                          {j.status === 'paused' && (
                            <>
                              <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.45)', zIndex:1 }} />
                              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:2 }}>
                                <span style={{ background:'rgba(0,0,0,.75)', color:'#fff', fontSize:12, fontWeight:700, borderRadius:6, padding:'6px 14px', letterSpacing:'.08em', backdropFilter:'blur(2px)' }}>募集停止</span>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })()}

                    {/* Heart button */}
                    {(user && isStudent) && (
                      <button
                        onClick={e => { e.stopPropagation(); handleToggleFavorite(j.id); }}
                        disabled={fl}
                        style={{ position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: '50%', border: `1px solid ${faved ? '#F2620C' : 'rgba(255,255,255,.6)'}`, background: faved ? '#FFF1E8' : 'rgba(255,255,255,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, zIndex: 2, transition: '.2s' }}
                        title={faved ? 'お気に入り解除' : 'お気に入りに追加'}
                      >
                        {faved ? '♥' : '♡'}
                      </button>
                    )}

                    <div style={{ padding: '20px 22px 22px', flex: 1, display: 'flex', flexDirection: 'column' }} onClick={() => router.push(`/jobs/${j.id}`)}>
                      <div style={{ fontSize: 11, color: '#938B81', marginBottom: 6 }}>{j.companies?.company_name || '企業名不明'}</div>
                      <h3 style={{ fontWeight: 700, fontSize: 16, margin: '0 0 12px', lineHeight: 1.5 }}>{j.job_title}</h3>

                      {j.job_categories && j.job_categories.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                          {j.job_categories.slice(0, 3).map(cat => (
                            <span key={cat} style={{ fontSize: 11, background: '#FFF1E8', color: '#F2620C', border: '1px solid #FBD5C0', borderRadius: 4, padding: '3px 9px' }}>{cat}</span>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#57514A', paddingTop: 14, borderTop: '1px solid #F0EAE2', marginTop: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B6ADA2" strokeWidth="2"><path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11Z" /><circle cx="12" cy="10" r="2.4" /></svg>
                          {j.location || '未設定'}
                        </div>
                        <div style={{ color: '#1C1813', fontWeight: 700, fontSize: 15 }}>{j.salary || '応相談'}</div>
                      </div>

                      <button
                        onClick={e => { e.stopPropagation(); router.push(`/jobs/${j.id}`); }}
                        style={{ marginTop: 16, width: '100%', background: j.status === 'paused' ? '#9CA3AF' : '#F2620C', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontFamily: FF, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                      >
                        {j.status === 'paused' ? '募集停止中' : !user ? 'ログインして応募' : '詳細を見る'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF8F4', fontFamily: "var(--font-sans)" }}>
        <div style={{ width: 36, height: 36, border: '2.5px solid #F2620C', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
