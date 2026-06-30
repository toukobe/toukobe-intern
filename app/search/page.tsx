'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';

interface Job {
  id: string;
  company_id: string;
  job_title: string;
  salary: string;
  location: string;
  job_description: string;
  job_categories: string[];
  status: string;
  companies: { company_name: string; industry: string } | null;
}

interface User {
  id: string;
  email?: string;
}

interface UserType {
  user_type: string;
}

const FF = "'Zen Kaku Gothic New', sans-serif";

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

  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [condition, setCondition] = useState(searchParams.get('condition') || '');
  const [feature, setFeature] = useState(searchParams.get('feature') || '');

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

  useEffect(() => {
    const q = searchParams.get('q') || '';
    const cat = searchParams.get('category') || '';
    const loc = searchParams.get('location') || '';
    const cond = searchParams.get('condition') || '';
    const feat = searchParams.get('feature') || '';
    setKeyword(q);
    setCategory(cat);
    setLocation(loc);
    setCondition(cond);
    setFeature(feat);
    fetchJobs(q, cat, loc, cond, feat);
  }, [searchParams]);

  useEffect(() => {
    if (!user || userType?.user_type !== 'student') return;
    async function fetchFavorites() {
      const { data } = await supabase.from('favorites').select('id, job_id').eq('user_id', user!.id);
      if (data) {
        const favSet = new Set(data.map(f => f.job_id as string));
        const favMap = new Map(data.map(f => [f.job_id as string, f.id as string]));
        setFavorites(favSet);
        setFavoriteIds(favMap);
      }
    }
    fetchFavorites();
  }, [user, userType]);

  const fetchJobs = async (kw: string, cat: string, loc: string, cond: string = '', feat: string = '') => {
    setLoading(true);
    try {
      // Step 1: fetch jobs without join
      let query = supabase
        .from('jobs')
        .select('id, company_id, job_title, salary, location, job_description, job_categories, status')
        .in('status', ['published', 'paused']);

      if (cat) query = (query as any).contains('job_categories', [cat]);
      if (cond) query = (query as any).contains('work_conditions', [cond]);
      if (feat) query = (query as any).contains('job_features', [feat]);
      if (loc) query = query.ilike('location', `%${loc}%`);
      if (kw) query = query.or(`job_title.ilike.%${kw}%,job_description.ilike.%${kw}%`);

      const { data: jobRows, error } = await query;
      if (error) throw error;
      if (!jobRows || jobRows.length === 0) { setJobs([]); return; }

      // Step 2: fetch company names for those jobs
      const companyIds = [...new Set(jobRows.map((j: any) => j.company_id).filter(Boolean))];
      let companyMap: Record<string, { company_name: string; industry: string }> = {};
      if (companyIds.length > 0) {
        const { data: companies } = await supabase
          .from('companies')
          .select('id, company_name, industry')
          .in('id', companyIds);
        if (companies) {
          companies.forEach((c: any) => { companyMap[c.id] = { company_name: c.company_name, industry: c.industry }; });
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
    const params = new URLSearchParams();
    if (keyword) params.set('q', keyword);
    if (category) params.set('category', category);
    if (location) params.set('location', location);
    if (condition) params.set('condition', condition);
    if (feature) params.set('feature', feature);
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
      <link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;700;900&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* NAV */}
      <div style={{ background: 'rgba(255,255,255,.95)', borderBottom: '1px solid #EFE8DF', padding: '14px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 36, cursor: 'pointer' }} onClick={() => router.push('/')} />
          <nav style={{ display: 'flex', gap: 20 }}>
            {[
              { label: '求人検索', href: '/search' },
              { label: '職種一覧', href: '/categories' },
              { label: '使い方', href: '/how-it-works' },
              { label: '企業の方へ', href: '/for-companies' },
            ].map(item => (
              <span key={item.href} onClick={() => router.push(item.href)} style={{ fontSize: 13, color: item.href === '/search' ? '#F2620C' : '#57514A', fontWeight: item.href === '/search' ? 700 : 500, cursor: 'pointer', textDecoration: item.href === '/search' ? 'underline' : 'none', textUnderlineOffset: 3 }}>{item.label}</span>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {user ? (
            <>
              {userType?.user_type === 'student' && <button onClick={() => router.push('/dashboard/student')} style={{ background: '#fff', color: '#57514A', border: '1px solid #EFE8DF', borderRadius: 8, padding: '9px 18px', fontFamily: FF, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>マイページ</button>}
              {userType?.user_type === 'company' && <button onClick={() => router.push('/dashboard/company')} style={{ background: '#fff', color: '#57514A', border: '1px solid #EFE8DF', borderRadius: 8, padding: '9px 18px', fontFamily: FF, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>ダッシュボード</button>}
              <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} style={{ background: '#fff', color: '#57514A', border: '1px solid #EFE8DF', borderRadius: 8, padding: '9px 18px', fontFamily: FF, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>ログアウト</button>
            </>
          ) : (
            <>
              <button onClick={() => router.push('/auth/login')} style={{ background: '#fff', color: '#57514A', border: '1px solid #EFE8DF', borderRadius: 8, padding: '9px 18px', fontFamily: FF, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>ログイン</button>
              <button onClick={() => router.push('/auth/signup')} style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontFamily: FF, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>無料で登録</button>
            </>
          )}
        </div>
      </div>

      {/* SEARCH BAR */}
      <div style={{ background: 'linear-gradient(160deg,#FFF6EE,#FFEFE2)', padding: '48px 48px 40px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h1 style={{ fontWeight: 900, fontSize: 28, margin: '0 0 24px' }}>求人検索</h1>
          <form onSubmit={handleSearch}>
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 12px 36px rgba(28,24,19,.10)', padding: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 0 12px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C2B8AC" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /></svg>
                <input
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  placeholder="職種・キーワード"
                  style={{ flex: 1, border: 'none', padding: '14px 0', fontFamily: FF, fontSize: 14, outline: 'none', color: '#1C1813', background: 'transparent' }}
                />
              </div>
              <div style={{ position: 'relative', flex: 1 }}>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{ width: '100%', border: 'none', borderLeft: '1px solid #EFE8DF', padding: '14px 28px 14px 16px', fontFamily: FF, fontSize: 13, color: '#57514A', outline: 'none', background: '#fff', cursor: 'pointer', appearance: 'none' as const }}
                >
                  <option value="">職種</option>
                  {categoryList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#C2B8AC', pointerEvents: 'none', fontSize: 10 }}>▼</span>
              </div>
              <div style={{ position: 'relative', flex: 1 }}>
                <select
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  style={{ width: '100%', border: 'none', borderLeft: '1px solid #EFE8DF', padding: '14px 28px 14px 16px', fontFamily: FF, fontSize: 13, color: '#57514A', outline: 'none', background: '#fff', cursor: 'pointer', appearance: 'none' as const }}
                >
                  <option value="">勤務地</option>
                  <option value="東京">東京</option>
                  <option value="大阪">大阪</option>
                  <option value="名古屋">名古屋</option>
                  <option value="福岡">福岡</option>
                  <option value="リモート">リモート</option>
                </select>
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#C2B8AC', pointerEvents: 'none', fontSize: 10 }}>▼</span>
              </div>
              <button type="submit" style={{ background: '#F2620C', color: '#fff', border: 'none', padding: '14px 32px', borderRadius: 10, fontFamily: FF, fontWeight: 700, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(242,98,12,.28)' }}>
                検索
              </button>
            </div>

            {/* 勤務条件・求人特徴 フィルター */}
            <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
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
          </form>
        </div>
      </div>

      {/* RESULTS */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 48px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: 44, height: 44, border: '3px solid #F2620C', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin .8s linear infinite' }} />
            <p style={{ color: '#57514A' }}>検索中...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>求人が見つかりませんでした</p>
            <p style={{ color: '#938B81', fontSize: 14, marginBottom: 28 }}>検索条件を変えてお試しください</p>
            <button onClick={() => router.push('/search')} style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontFamily: FF, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              全件表示
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontWeight: 900, fontSize: 20, margin: 0 }}>
                検索結果
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, color: '#938B81', fontWeight: 400, marginLeft: 10 }}>{jobs.length} 件</span>
              </h2>
              <button
                onClick={() => { setKeyword(''); setCategory(''); setLocation(''); setCondition(''); setFeature(''); router.push('/search'); }}
                style={{ fontSize: 13, color: '#938B81', background: '#fff', border: '1px solid #EFE8DF', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontFamily: FF }}
              >
                条件をリセット
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
              {jobs.map(j => {
                const faved = favorites.has(j.id);
                const fl = favLoading.has(j.id);
                return (
                  <div
                    key={j.id}
                    style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: '.2s', cursor: 'pointer', position: 'relative' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 14px 36px rgba(28,24,19,.10)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
                  >
                    <div style={{ height: 4, background: j.status === 'paused' ? '#9CA3AF' : 'linear-gradient(90deg,#F2620C,#FB8A3C)' }} />

                    {/* 募集停止バッジ */}
                    {j.status === 'paused' && (
                      <div style={{ position: 'absolute', top: 12, left: 12, background: '#374151', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 4, padding: '3px 8px', zIndex: 3, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '.06em' }}>募集停止</div>
                    )}

                    {/* Heart button */}
                    {(user && isStudent) && (
                      <button
                        onClick={e => { e.stopPropagation(); handleToggleFavorite(j.id); }}
                        disabled={fl}
                        style={{ position: 'absolute', top: 14, right: 14, width: 34, height: 34, borderRadius: '50%', border: `1px solid ${faved ? '#F2620C' : '#EFE8DF'}`, background: faved ? '#FFF1E8' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, zIndex: 2, transition: '.2s' }}
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
                        style={{ marginTop: 16, width: '100%', background: '#F2620C', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontFamily: FF, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                      >
                        {!user ? 'ログインして応募' : '詳細を見る'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF8F4', fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>
        <p style={{ color: '#57514A' }}>読み込み中...</p>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
