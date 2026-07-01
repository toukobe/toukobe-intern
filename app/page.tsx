'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useIsMobile } from '@/utils/useIsMobile';

interface Job {
  id: string;
  job_title: string;
  salary: string;
  location: string;
  job_categories?: string[];
  cover_image_url?: string;
  cover_image_position?: string;
  companies: {
    company_name: string;
    logo_url?: string;
    cover_url?: string;
  } | null;
}

interface User {
  id: string;
  email?: string;
}

interface UserType {
  user_type: string;
}

const cats = [
  { name: 'コンサルティング', en: 'Consulting' },
  { name: '経営・企画', en: 'Management' },
  { name: '金融・ファイナンス', en: 'Finance' },
  { name: 'マーケティング', en: 'Marketing' },
  { name: 'エンジニア', en: 'Engineering' },
  { name: 'デザイナー', en: 'Design' },
  { name: '営業', en: 'Sales' },
  { name: 'ライター・メディア', en: 'Media' },
];

const stats = [
  { num: '480', unit: '社', label: '厳選された提携企業', pre: '' },
  { num: '92', unit: '%', label: '登録学生の難関大比率', pre: '' },
  { num: '1,650', unit: '', label: '平均時給', pre: '¥' },
  { num: '2', unit: '週間', label: '最短マッチング', pre: '' },
];

const steps = [
  { no: '1', title: '無料で登録', desc: 'プロフィールを登録。難関大生であることが、あなたの強みになります。' },
  { no: '2', title: '求人を探す', desc: '職種・勤務地・働き方の条件から、あなたに合うインターンを検索。' },
  { no: '3', title: '応募・面談', desc: '気になる企業へ応募。最短2週間でインターンをスタートできます。' },
];

const pills = ['コンサルティング', '事業開発', '投資銀行', 'プロダクト', 'マーケティング'];

const categoryList = [
  'マーケティング', 'エンジニア', 'コンサルティング', '経営・企画',
  '営業', '金融・ファイナンス', 'ライター・メディア', '経理',
  '人事・広報', 'デザイナー', '事務・アシスタント', 'その他',
];

export default function Home() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user as User);
        const { data } = await supabase
          .from('user_types')
          .select('user_type')
          .eq('user_id', session.user.id)
          .single();
        if (data) setUserType(data);
      }
    }
    checkAuth();
  }, []);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select(`id, job_title, salary, location, cover_image_url, cover_image_position, companies (company_name, logo_url, cover_url)`);
        if (error) {
          console.error('データの取得に失敗しました:', error);
        } else {
          setJobs((data as unknown) as Job[]);
        }
      } catch (err) {
        console.error('エラー:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  useEffect(() => {
    let filtered = jobs;
    if (searchQuery) {
      filtered = filtered.filter(
        (job) =>
          job.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.companies?.company_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedLocation) {
      filtered = filtered.filter((job) => job.location === selectedLocation);
    }
    if (selectedCategory) {
      filtered = filtered.filter((job) => {
        const categories = Array.isArray(job.job_categories) ? job.job_categories : [];
        return categories.some((cat) => cat.includes(selectedCategory));
      });
    }
    setFilteredJobs(filtered);
  }, [jobs, searchQuery, selectedCategory, selectedLocation]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserType(null);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF8F4', fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid #F2620C', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#57514A', fontSize: 15 }}>読み込み中...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', fontFamily: "'Zen Kaku Gothic New', sans-serif", color: '#1C1813' }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700;900&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: #FBF8F4; }
        input::placeholder { color: #A89F94; }
        select { -webkit-appearance: none; appearance: none; }
        .cat-card:hover { border-color: #F2620C !important; box-shadow: 0 8px 24px rgba(242,98,12,.10) !important; transform: translateY(-2px) !important; }
        .job-card:hover { box-shadow: 0 14px 36px rgba(28,24,19,.10) !important; transform: translateY(-3px) !important; }
        .nav-link:hover { color: #F2620C !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .title-clamp { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>

      {/* NAV */}
      <div style={{ background: 'rgba(255,255,255,.95)', borderBottom: '1px solid #EFE8DF', position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'saturate(180%) blur(8px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '12px 20px' : '14px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: isMobile ? 28 : 36, width: 'auto', cursor: 'pointer' }} onClick={() => router.push('/')} />
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 30 }}>
            {!isMobile && <>
              <span className="nav-link" style={{ fontSize: 14, color: '#3A352F', fontWeight: 500, cursor: 'pointer', transition: 'color .2s' }} onClick={() => router.push('/search')}>求人検索</span>
              <span className="nav-link" style={{ fontSize: 14, color: '#3A352F', fontWeight: 500, cursor: 'pointer', transition: 'color .2s' }} onClick={() => router.push('/categories')}>職種一覧</span>
              <span className="nav-link" style={{ fontSize: 14, color: '#3A352F', fontWeight: 500, cursor: 'pointer', transition: 'color .2s' }} onClick={() => router.push('/how-it-works')}>使い方</span>
              <span className="nav-link" style={{ fontSize: 14, color: '#3A352F', fontWeight: 500, cursor: 'pointer', transition: 'color .2s' }} onClick={() => router.push('/for-companies')}>企業の方へ</span>
            </>}
            {user ? (
              <>
                {!isMobile && userType?.user_type === 'company' && (
                  <span className="nav-link" style={{ fontSize: 14, color: '#3A352F', fontWeight: 500, cursor: 'pointer', transition: 'color .2s' }} onClick={() => router.push('/dashboard/company')}>ダッシュボード</span>
                )}
                {!isMobile && userType?.user_type === 'student' && (
                  <span className="nav-link" style={{ fontSize: 14, color: '#3A352F', fontWeight: 500, cursor: 'pointer', transition: 'color .2s' }} onClick={() => router.push('/dashboard/student')}>マイページ</span>
                )}
                {!isMobile && user.email === 'ru_matsumoto@manabiph.com' && (
                  <span className="nav-link" style={{ fontSize: 14, color: '#3A352F', fontWeight: 500, cursor: 'pointer', transition: 'color .2s' }} onClick={() => router.push('/dashboard/admin')}>管理者</span>
                )}
                {isMobile && (
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: '#F2620C', borderRadius: 8, padding: '9px 16px', cursor: 'pointer' }} onClick={() => router.push(userType?.user_type === 'company' ? '/dashboard/company' : '/dashboard/student')}>マイページ</span>
                )}
                {!isMobile && <span className="nav-link" style={{ fontSize: 14, color: '#3A352F', fontWeight: 500, cursor: 'pointer', transition: 'color .2s' }} onClick={handleLogout}>ログアウト</span>}
              </>
            ) : (
              <>
                {!isMobile && <span className="nav-link" style={{ fontSize: 14, color: '#3A352F', fontWeight: 500, cursor: 'pointer', transition: 'color .2s' }} onClick={() => router.push('/auth/login')}>ログイン</span>}
                <span style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: '#fff', background: '#F2620C', borderRadius: 8, padding: isMobile ? '9px 16px' : '11px 24px', boxShadow: '0 2px 8px rgba(242,98,12,.28)', cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => router.push('/auth/signup')}>無料で登録</span>
                {!isMobile && <span className="nav-link" style={{ fontSize: 14, color: '#3A352F', fontWeight: 500, cursor: 'pointer', transition: 'color .2s' }} onClick={() => router.push('/auth/login')}></span>}
              </>
            )}
          </div>
        </div>
      </div>

      {/* HERO */}
      <div style={{ position: 'relative', background: 'linear-gradient(160deg,#FFF6EE 0%,#FFEFE2 55%,#FFE7D4 100%)', padding: isMobile ? '52px 0 44px' : '88px 0 80px', overflow: 'hidden' }}>
        {!isMobile && <svg viewBox="0 0 1280 640" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="wv" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#FFD9BE" /><stop offset="1" stopColor="#FFC59B" />
            </linearGradient>
          </defs>
          <path d="M0,380 C260,320 420,490 680,420 C900,360 1080,490 1280,420 L1280,640 L0,640 Z" fill="#FFE0C9" opacity=".5" />
          <path d="M0,470 C300,420 460,560 740,490 C980,430 1120,540 1280,490 L1280,640 L0,640 Z" fill="#FFD3B4" opacity=".45" />
          <path d="M-40,150 C240,90 460,250 720,170 C960,98 1140,210 1320,150" fill="none" stroke="url(#wv)" strokeWidth="1.5" opacity=".7" />
          <path d="M-40,205 C260,135 480,305 760,215 C1000,140 1160,255 1320,195" fill="none" stroke="url(#wv)" strokeWidth="1.5" opacity=".55" />
          <path d="M-40,260 C280,190 500,360 800,260 C1040,180 1180,300 1320,240" fill="none" stroke="url(#wv)" strokeWidth="1.5" opacity=".4" />
        </svg>}
        <div style={{ position: 'absolute', right: -140, top: -120, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle,#FFD0AE 0%, rgba(255,208,174,0) 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: 760, margin: '0 auto', textAlign: 'center', padding: isMobile ? '0 20px' : '0 48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 10 : 16, marginBottom: isMobile ? 20 : 30 }}>
            <span style={{ width: 30, height: 1, background: 'linear-gradient(90deg,rgba(242,98,12,0),#F2620C)', display: 'block' }} />
            <span style={{ fontSize: isMobile ? 10.5 : 12.5, fontWeight: 700, letterSpacing: '.16em', color: '#C2530A' }}>難関大生に特化した長期インターン</span>
            <span style={{ width: 30, height: 1, background: 'linear-gradient(90deg,#F2620C,rgba(242,98,12,0))', display: 'block' }} />
          </div>
          <h1 style={{ fontWeight: 900, fontSize: isMobile ? 36 : 58, lineHeight: 1.4, margin: '0 0 16px', letterSpacing: '.02em' }}>最初のキャリアを、<br />本気で選ぶ。</h1>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: isMobile ? 28 : 42 }}>
            <span style={{ fontWeight: 900, fontSize: isMobile ? 20 : 30, letterSpacing: '.06em', color: '#F2620C', lineHeight: 1 }}>トウコべインターン</span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: isMobile ? 9 : 11, letterSpacing: '.3em', color: '#B59A86', paddingLeft: '.3em' }}>TOUKOBE INTERN</span>
          </div>

          {/* Search */}
          {isMobile ? (
            <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 8px 30px rgba(28,24,19,.12)', padding: 12, display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C2B8AC" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /></svg>
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="職種・企業名・キーワード" style={{ flex: 1, border: 'none', padding: '10px 0', fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 14, outline: 'none', color: '#1C1813', background: 'transparent' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ width: '100%', border: '1px solid #EFE8DF', borderRadius: 8, padding: '10px 28px 10px 12px', fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 13, color: '#57514A', outline: 'none', background: '#fff', cursor: 'pointer' }}>
                    <option value="">職種</option>
                    {categoryList.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#C2B8AC', pointerEvents: 'none', fontSize: 10 }}>▼</span>
                </div>
                <div style={{ position: 'relative', flex: 1 }}>
                  <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} style={{ width: '100%', border: '1px solid #EFE8DF', borderRadius: 8, padding: '10px 28px 10px 12px', fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 13, color: '#57514A', outline: 'none', background: '#fff', cursor: 'pointer' }}>
                    <option value="">勤務地</option>
                    <option value="東京">東京</option>
                    <option value="大阪">大阪</option>
                    <option value="名古屋">名古屋</option>
                    <option value="福岡">福岡</option>
                    <option value="リモート">リモート</option>
                  </select>
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#C2B8AC', pointerEvents: 'none', fontSize: 10 }}>▼</span>
                </div>
              </div>
              <button onClick={() => { const p = new URLSearchParams(); if (searchQuery) p.set('q', searchQuery); if (selectedCategory) p.set('category', selectedCategory); if (selectedLocation) p.set('location', selectedLocation); router.push(`/search?${p.toString()}`); }} style={{ background: '#F2620C', color: '#fff', border: 'none', padding: '13px', borderRadius: 10, fontFamily: "'Zen Kaku Gothic New', sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 12px rgba(242,98,12,.3)' }}>検索する</button>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 20px 50px rgba(28,24,19,.13)', padding: 12, display: 'flex', gap: 8, alignItems: 'center', textAlign: 'left' }}>
              <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 0 14px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C2B8AC" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /></svg>
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="職種・企業名・キーワード" style={{ flex: 1, border: 'none', padding: '15px 0', fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 15, outline: 'none', color: '#1C1813', background: 'transparent' }} />
              </div>
              <div style={{ position: 'relative', flex: 1 }}>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ width: '100%', border: 'none', borderLeft: '1px solid #EFE8DF', padding: '15px 32px 15px 18px', fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 14, color: '#57514A', outline: 'none', background: '#fff', cursor: 'pointer' }}>
                  <option value="">職種を選ぶ</option>
                  {categoryList.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: '#C2B8AC', pointerEvents: 'none', fontSize: 11 }}>▼</span>
              </div>
              <div style={{ position: 'relative', flex: 1 }}>
                <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} style={{ width: '100%', border: 'none', borderLeft: '1px solid #EFE8DF', padding: '15px 32px 15px 18px', fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 14, color: '#57514A', outline: 'none', background: '#fff', cursor: 'pointer' }}>
                  <option value="">勤務地</option>
                  <option value="東京">東京</option>
                  <option value="大阪">大阪</option>
                  <option value="名古屋">名古屋</option>
                  <option value="福岡">福岡</option>
                  <option value="リモート">リモート</option>
                </select>
                <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: '#C2B8AC', pointerEvents: 'none', fontSize: 11 }}>▼</span>
              </div>
              <button onClick={() => { const params = new URLSearchParams(); if (searchQuery) params.set('q', searchQuery); if (selectedCategory) params.set('category', selectedCategory); if (selectedLocation) params.set('location', selectedLocation); router.push(`/search?${params.toString()}`); }} style={{ background: '#F2620C', color: '#fff', border: 'none', padding: '17px 38px', borderRadius: 12, fontFamily: "'Zen Kaku Gothic New', sans-serif", fontWeight: 700, fontSize: 15, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 14px rgba(242,98,12,.3)' }}>検索する</button>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11.5, color: '#938B81' }}>人気：</span>
            {(isMobile ? pills.slice(0, 3) : pills).map((p) => (
              <span key={p} style={{ fontSize: 11.5, color: '#57514A', background: '#fff', border: '1px solid #EFE8DF', borderRadius: 999, padding: '5px 12px', cursor: 'pointer' }} onClick={() => router.push(`/search?q=${encodeURIComponent(p)}`)}>
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* STATS BAND */}
      <div style={{ background: '#1C1813' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '28px 20px' : '34px 48px', display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 0 : 24 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: isMobile ? '16px 8px' : undefined, borderRight: !isMobile && i < stats.length - 1 ? '1px solid #332C24' : 'none', borderBottom: isMobile && i < 2 ? '1px solid #332C24' : 'none', borderLeft: isMobile && i % 2 === 1 ? '1px solid #332C24' : 'none' }}>
              <div style={{ fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: 8 }}>
                <span style={{ fontSize: isMobile ? 14 : 18, color: '#FBA94C' }}>{s.pre}</span>
                <span style={{ fontSize: isMobile ? 28 : 40 }}>{s.num}</span>
                <span style={{ fontSize: isMobile ? 14 : 18, marginLeft: 2, color: '#C9C0B6' }}>{s.unit}</span>
              </div>
              <div style={{ fontSize: isMobile ? 11 : 12.5, color: '#9A9086' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CATEGORIES */}
      <div style={{ background: '#FBF8F4' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '48px 20px' : '76px 48px' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 28 : 44 }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#F2620C', letterSpacing: '.18em', marginBottom: 10 }}>CATEGORIES</div>
            <h2 style={{ fontWeight: 900, fontSize: isMobile ? 22 : 32, margin: '0 0 8px' }}>職種から探す</h2>
            {!isMobile && <p style={{ fontSize: 14, color: '#7A7268', margin: 0 }}>関心のある領域から、最適なインターンへ。</p>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 16 }}>
            {cats.map((c) => (
              <div
                key={c.name}
                className="cat-card"
                onClick={() => router.push(`/search?category=${encodeURIComponent(c.name)}`)}
                style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 12, padding: isMobile ? '16px 14px' : '26px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: '.2s', cursor: 'pointer' }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: isMobile ? 13 : 16 }}>{c.name}</div>
                  {!isMobile && <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: '#B6ADA2', marginTop: 6 }}>{c.en}</div>}
                </div>
                <span style={{ width: isMobile ? 26 : 32, height: isMobile ? 26 : 32, borderRadius: '50%', background: '#FFF1E8', color: '#F2620C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 12 : 14, flexShrink: 0 }}>→</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURED JOBS */}
      <div style={{ background: '#fff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '48px 20px' : '76px 48px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: isMobile ? 20 : 34 }}>
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#F2620C', letterSpacing: '.18em', marginBottom: 8 }}>FEATURED</div>
              <h2 style={{ fontWeight: 900, fontSize: isMobile ? 20 : 32, margin: 0 }}>注目の長期インターン</h2>
            </div>
            <span style={{ fontSize: 13, color: '#F2620C', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => router.push('/search')}>すべて見る →</span>
          </div>
          {jobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#938B81', fontSize: 15 }}>求人を読み込んでいます...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: isMobile ? 12 : 24 }}>
              {jobs.slice(0, isMobile ? 2 : 3).map((j) => (
                <div
                  key={j.id}
                  className="job-card"
                  onClick={() => router.push(`/jobs/${j.id}`)}
                  style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: '.2s', cursor: 'pointer' }}
                >
                  <div style={{ height: isMobile ? 100 : 148, position: 'relative', overflow: 'hidden', background: '#F3EEE7', flexShrink: 0 }}>
                    {(j.cover_image_url || j.companies?.cover_url) ? (
                      <img src={j.cover_image_url || j.companies?.cover_url || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: j.cover_image_position || '50% 50%', display: 'block' }} />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,#F2620C,#FB8A3C)', opacity: 0.18 }} />
                    )}
                    {j.companies?.logo_url && (
                      <div style={{ position: 'absolute', bottom: isMobile ? 8 : 12, left: isMobile ? 10 : 16, width: isMobile ? 30 : 40, height: isMobile ? 30 : 40, borderRadius: 8, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <img src={j.companies.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                    )}
                  </div>
                  <div style={{ padding: isMobile ? '12px 14px 16px' : 22 }}>
                    <div style={{ fontSize: isMobile ? 10 : 12, color: '#938B81', marginBottom: isMobile ? 5 : 8 }}>{j.companies?.company_name || '企業名不明'}</div>
                    <h4 className={isMobile ? 'title-clamp' : ''} style={{ fontWeight: 700, fontSize: isMobile ? 13 : 17, margin: isMobile ? '0 0 10px' : '0 0 16px', lineHeight: 1.5 }}>{j.job_title}</h4>
                    {!isMobile && <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11.5, color: '#F2620C', background: '#FFF1E8', padding: '5px 11px', borderRadius: 6 }}>長期インターン</span>
                      <span style={{ fontSize: 11.5, color: '#57514A', background: '#F3EEE7', padding: '5px 11px', borderRadius: 6 }}>週3〜</span>
                    </div>}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 5 : 9, fontSize: isMobile ? 11 : 13, color: '#57514A', paddingTop: isMobile ? 10 : 14, borderTop: '1px solid #F0EAE2' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B6ADA2" strokeWidth="2"><path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11Z" /><circle cx="12" cy="10" r="2.4" /></svg>
                        {j.location || '未設定'}
                      </div>
                      <div style={{ color: '#1C1813', fontWeight: 700, fontSize: isMobile ? 13 : 16 }}>{j.salary || '応相談'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ALL JOBS */}
      {filteredJobs.length > (isMobile ? 2 : 3) && (
        <div style={{ background: '#fff' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '0 20px 48px' : '0 48px 76px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? 16 : 24 }}>
              <h2 style={{ fontWeight: 900, fontSize: isMobile ? 16 : 24, margin: 0, color: '#1C1813' }}>
                求人一覧 <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: isMobile ? 12 : 14, color: '#938B81', fontWeight: 400 }}>{filteredJobs.length}件</span>
              </h2>
              <button onClick={() => { setSearchQuery(''); setSelectedCategory(''); setSelectedLocation(''); }} style={{ fontSize: 12, color: '#938B81', background: 'none', border: '1px solid #EFE8DF', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>リセット</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: isMobile ? 12 : 20 }}>
              {filteredJobs.slice(isMobile ? 2 : 3, isMobile ? 8 : undefined).map((j) => (
                <div
                  key={j.id}
                  className="job-card"
                  onClick={() => router.push(`/jobs/${j.id}`)}
                  style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: '.2s', cursor: 'pointer' }}
                >
                  <div style={{ height: 110, position: 'relative', overflow: 'hidden', background: '#F3EEE7', flexShrink: 0 }}>
                    {(j.cover_image_url || j.companies?.cover_url) ? (
                      <img
                        src={j.cover_image_url || j.companies?.cover_url || ''}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: j.cover_image_position || '50% 50%', display: 'block' }}
                      />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,#F2620C,#FB8A3C)', opacity: 0.18 }} />
                    )}
                    {j.companies?.logo_url && (
                      <div style={{ position: 'absolute', bottom: 10, left: 12, width: 34, height: 34, borderRadius: 8, background: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <img src={j.companies.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '16px 20px 20px' }}>
                    <div style={{ fontSize: 11, color: '#938B81', marginBottom: 7 }}>{j.companies?.company_name || '企業名不明'}</div>
                    <h4 className={isMobile ? 'title-clamp' : ''} style={{ fontWeight: 700, fontSize: isMobile ? 13 : 15, margin: '0 0 12px', lineHeight: 1.5 }}>{j.job_title}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 13, color: '#57514A', paddingTop: 12, borderTop: '1px solid #F0EAE2' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B6ADA2" strokeWidth="2"><path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11Z" /><circle cx="12" cy="10" r="2.4" /></svg>
                        {j.location || '未設定'}
                      </div>
                      <div style={{ color: '#1C1813', fontWeight: 700, fontSize: 15 }}>{j.salary || '応相談'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {isMobile && filteredJobs.length > 8 && (
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <button onClick={() => router.push('/search')} style={{ background: '#fff', color: '#F2620C', border: '1.5px solid #F2620C', borderRadius: 10, padding: '13px 40px', fontFamily: "'Zen Kaku Gothic New', sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  求人をもっと見る（{filteredJobs.length}件）
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* HOW IT WORKS */}
      <div style={{ background: '#FBF8F4' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '48px 20px' : '76px 48px' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 28 : 50 }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#F2620C', letterSpacing: '.18em', marginBottom: 10 }}>HOW IT WORKS</div>
            <h2 style={{ fontWeight: 900, fontSize: isMobile ? 22 : 32, margin: 0 }}>ご利用の流れ</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: isMobile ? 12 : 28 }}>
            {steps.map((v) => (
              <div key={v.no} style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 14, padding: isMobile ? '20px 20px' : '36px 30px', display: isMobile ? 'flex' : 'block', alignItems: isMobile ? 'flex-start' : undefined, gap: isMobile ? 16 : undefined, textAlign: isMobile ? 'left' : 'center' }}>
                <div style={{ width: isMobile ? 40 : 58, height: isMobile ? 40 : 58, borderRadius: '50%', background: '#F2620C', color: '#fff', fontWeight: 900, fontSize: isMobile ? 16 : 22, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: isMobile ? '0' : '0 auto 22px', boxShadow: '0 4px 12px rgba(242,98,12,.28)', flexShrink: 0 }}>{v.no}</div>
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: isMobile ? 15 : 18, margin: isMobile ? '0 0 6px' : '0 0 12px' }}>{v.title}</h4>
                  <p style={{ fontSize: isMobile ? 12.5 : 13.5, lineHeight: 1.8, color: '#57514A', margin: 0 }}>{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* COMPANY CTA */}
      <div style={{ background: '#FBF8F4' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '0 20px 48px' : '0 48px 76px' }}>
          <div style={{ background: 'linear-gradient(120deg,#1C1813 0%,#2A231B 100%)', borderRadius: 20, padding: isMobile ? '36px 24px' : '60px 56px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: isMobile ? 24 : 40, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -60, bottom: -60, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle,rgba(242,98,12,.35) 0%,rgba(242,98,12,0) 70%)' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#FBA94C', letterSpacing: '.16em', marginBottom: 12 }}>FOR COMPANIES</div>
              <h3 style={{ fontWeight: 900, fontSize: isMobile ? 20 : 28, color: '#fff', margin: '0 0 12px', lineHeight: 1.4 }}>難関大生に、ダイレクトに出会う。</h3>
              <p style={{ fontSize: isMobile ? 13 : 15, color: '#C9C0B6', margin: 0, lineHeight: 1.8 }}>月額定額で何件でも求人掲載いただけます。まずは資料をご覧ください。</p>
            </div>
            <span onClick={() => router.push('/auth/company-login')} style={{ position: 'relative', whiteSpace: 'nowrap', background: '#F2620C', color: '#fff', fontWeight: 700, fontSize: isMobile ? 14 : 15, padding: isMobile ? '14px 28px' : '17px 42px', borderRadius: 12, boxShadow: '0 6px 18px rgba(242,98,12,.4)', cursor: 'pointer' }}>
              資料を請求する
            </span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ background: '#15110D' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '40px 20px 24px' : '60px 48px 34px' }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: isMobile ? 32 : 40, paddingBottom: isMobile ? 28 : 40, borderBottom: '1px solid #2C2620' }}>
            <div style={{ maxWidth: 320 }}>
              <div style={{ fontWeight: 900, fontSize: isMobile ? 16 : 20, color: '#fff', marginBottom: 12 }}>トウコべインターン</div>
              <p style={{ fontSize: 13, lineHeight: 1.9, color: '#8E857B', margin: 0 }}>難関大生のキャリア形成を支える、長期インターン求人プラットフォーム。</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3,1fr)' : undefined, gap: isMobile ? 0 : 0, alignItems: 'start' }}>
              <div style={{ marginRight: isMobile ? 0 : 64 }}>
                <div style={{ fontSize: 12, color: '#FBA94C', marginBottom: 14, letterSpacing: '.05em' }}>学生の方</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: 13, color: '#B8AFA4' }}>
                  <span style={{ cursor: 'pointer' }} onClick={() => router.push('/')}>求人検索</span>
                  <span style={{ cursor: 'pointer' }}>使い方</span>
                  <span style={{ cursor: 'pointer' }}>よくある質問</span>
                </div>
              </div>
              <div style={{ marginRight: isMobile ? 0 : 64 }}>
                <div style={{ fontSize: 12, color: '#FBA94C', marginBottom: 14, letterSpacing: '.05em' }}>企業の方</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: 13, color: '#B8AFA4' }}>
                  <span style={{ cursor: 'pointer' }}>資料請求</span>
                  <span style={{ cursor: 'pointer' }}>お問い合わせ</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#FBA94C', marginBottom: 14, letterSpacing: '.05em' }}>運営</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: 13, color: '#B8AFA4' }}>
                  <span style={{ cursor: 'pointer' }} onClick={() => window.open('https://www.manabiph.com/', '_blank')}>運営会社</span>
                  <span style={{ cursor: 'pointer' }} onClick={() => router.push('/privacy-policy')}>プライバシーポリシー</span>
                  <span style={{ cursor: 'pointer' }} onClick={() => router.push('/terms')}>利用規約</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ paddingTop: 20, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#665D53' }}>© 2026 トウコべインターン. All rights reserved.</div>
        </div>
      </div>
    </div>
  );
}
