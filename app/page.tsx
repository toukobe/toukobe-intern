'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useIsMobile } from '@/utils/useIsMobile';
import { fetchFeatureTagOptions } from '@/utils/featureTags';
import { COVER_ASPECT } from '@/utils/coverImage';
import SiteFooter from '@/components/SiteFooter';

// スクロールで1回だけふわっと表示する（globals.cssに依存しない自己完結実装）
function FadeIn({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } },
      { threshold: 0.12, rootMargin: '0px 0px -36px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(26px)', transition: `opacity .8s var(--ease-out) ${delay}s, transform .8s var(--ease-out) ${delay}s`, ...style }}>
      {children}
    </div>
  );
}

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
  'コンサルティング', '経営・企画', '金融・ファイナンス', 'マーケティング',
  'エンジニア', 'デザイナー', '営業', 'ライター・メディア',
];

const features = [
  { title: '学生は完全無料', label: '登録から応募まで費用ゼロ' },
  { title: '難関大生に特化', label: '東大生を中心とした難関大生が対象' },
  { title: '掲載企業は審査制', label: '実在性・給与水準等を掲載前に確認' },
  { title: '長期インターン専門', label: '実務経験が積める求人に限定' },
];

const steps = [
  { no: '1', title: '無料で登録', desc: 'プロフィールを登録。難関大生であることが、あなたの強みになります。' },
  { no: '2', title: '求人を探す', desc: '職種・勤務地・働き方の条件から、あなたに合うインターンを検索。' },
  { no: '3', title: '応募・面談', desc: '気になる企業へ応募。選考・面談を経てインターンをスタートできます。' },
];

const FALLBACK_TAGS = ['営業', 'コンサルティング', 'フルリモート', '未経験OK', '週2からOK', 'スタートアップ', '機械学習・AI', '事業立案'];

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
  const [deletedNotice, setDeletedNotice] = useState(false);
  const [popularTags, setPopularTags] = useState<string[]>(FALLBACK_TAGS);
  useEffect(() => { fetchFeatureTagOptions().then(t => setPopularTags(t.length ? t : FALLBACK_TAGS)); }, []);

  // 退会完了直後の通知（/?deleted=1 で遷移してくる）
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('deleted') === '1') {
      setDeletedNotice(true);
      window.history.replaceState(null, '', '/');
      const t = setTimeout(() => setDeletedNotice(false), 6000);
      return () => clearTimeout(t);
    }
  }, []);

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
        // 管理者が選んだ注目求人(featured)を先頭に表示。featuredカラム未追加の環境では従来通りに取得
        let { data, error } = await supabase
          .from('jobs')
          .select(`id, job_title, salary, location, cover_image_url, cover_image_position, companies (company_name, logo_url, cover_url)`)
          .eq('status', 'published')
          .order('featured', { ascending: false })
          .order('created_at', { ascending: false });
        if (error) {
          ({ data, error } = await supabase
            .from('jobs')
            .select(`id, job_title, salary, location, cover_image_url, cover_image_position, companies (company_name, logo_url, cover_url)`)
            .eq('status', 'published'));
        }
        if (error) {
          console.error('データの取得に失敗しました:', error);
        } else {
          // トップページの表示を時間で動かす: 求人が多いときは1時間ごとに並びを回転させ、
          // 訪問・時間帯で「注目の長期インターン」に出る求人が入れ替わるようにする。
          const list = ((data as unknown) as Job[]) || [];
          const rotated = (() => {
            if (list.length <= 3) return list;
            const offset = Math.floor(Date.now() / 3_600_000) % list.length;
            return [...list.slice(offset), ...list.slice(0, offset)];
          })();
          setJobs(rotated);
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

  return (
    <div style={{ width: '100%', fontFamily: "var(--font-sans)", color: '#1C1813' }}>
      {deletedNotice && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D', borderRadius: 12, padding: '14px 24px', fontWeight: 700, fontSize: 14, boxShadow: '0 8px 32px rgba(0,0,0,.12)', whiteSpace: 'nowrap' }}>
          ✓ 退会が完了しました。ご利用ありがとうございました
        </div>
      )}
      {/* NAV */}
      <div style={{ background: '#fff', borderBottom: '1px solid #EFE8DF', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '12px 20px' : '14px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: isMobile ? 28 : 36, width: 'auto', cursor: 'pointer' }} onClick={() => router.push('/')} />
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 30 }}>
            {!isMobile && <>
              <span className="nav-link" style={{ fontSize: 14, color: '#3A352F', fontWeight: 500, cursor: 'pointer' }} onClick={() => router.push('/search')}>求人検索</span>
              <span className="nav-link" style={{ fontSize: 14, color: '#3A352F', fontWeight: 500, cursor: 'pointer' }} onClick={() => router.push('/categories')}>職種一覧</span>
              <span className="nav-link" style={{ fontSize: 14, color: '#3A352F', fontWeight: 500, cursor: 'pointer' }} onClick={() => router.push('/how-it-works')}>使い方</span>
              <span className="nav-link" style={{ fontSize: 14, color: '#3A352F', fontWeight: 500, cursor: 'pointer' }} onClick={() => router.push('/for-companies')}>企業の方へ</span>
            </>}
            {user ? (
              <>
                {!isMobile && userType?.user_type === 'company' && (
                  <span className="nav-link" style={{ fontSize: 14, color: '#3A352F', fontWeight: 500, cursor: 'pointer' }} onClick={() => router.push('/dashboard/company')}>ダッシュボード</span>
                )}
                {!isMobile && userType?.user_type === 'student' && (
                  <span className="nav-link" style={{ fontSize: 14, color: '#3A352F', fontWeight: 500, cursor: 'pointer' }} onClick={() => router.push('/dashboard/student')}>マイページ</span>
                )}
                {!isMobile && user.email === 'ru_matsumoto@manabiph.com' && (
                  <span className="nav-link" style={{ fontSize: 14, color: '#3A352F', fontWeight: 500, cursor: 'pointer' }} onClick={() => router.push('/dashboard/admin')}>管理者</span>
                )}
                {isMobile && (
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: '#F2620C', borderRadius: 6, padding: '9px 16px', cursor: 'pointer' }} onClick={() => router.push(userType?.user_type === 'company' ? '/dashboard/company' : '/dashboard/student')}>マイページ</span>
                )}
                {!isMobile && <span className="nav-link" style={{ fontSize: 14, color: '#3A352F', fontWeight: 500, cursor: 'pointer' }} onClick={handleLogout}>ログアウト</span>}
              </>
            ) : (
              <>
                {!isMobile && <span className="nav-link" style={{ fontSize: 14, color: '#3A352F', fontWeight: 500, cursor: 'pointer' }} onClick={() => router.push('/auth/login')}>ログイン</span>}
                <span className="btn-primary" style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: '#fff', background: '#F2620C', borderRadius: 6, padding: isMobile ? '9px 16px' : '10px 22px', cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => router.push('/auth/signup')}>無料で登録</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* HERO */}
      <div style={{ background: '#FFF7F0', borderBottom: '1px solid #F3E8DC' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '40px 20px 36px' : '64px 48px 56px', display: 'flex', gap: 56, alignItems: 'stretch' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ maxWidth: 720 }}>
            <p className="anim-fade-up" style={{ fontSize: isMobile ? 12 : 13.5, fontWeight: 700, color: '#C2530A', margin: '0 0 14px' }}>難関大生のための長期インターン求人サイト</p>
            <h1 className="anim-fade-up anim-delay-1" style={{ fontWeight: 800, fontSize: isMobile ? 30 : 46, lineHeight: 1.4, margin: '0 0 18px' }}>最初のキャリアを、<br />本気で選ぶ。</h1>
            <p className="anim-fade-up anim-delay-2" style={{ fontSize: isMobile ? 13.5 : 15.5, lineHeight: 2, color: '#57514A', margin: isMobile ? '0 0 26px' : '0 0 36px' }}>
              掲載するのは、審査を通過した企業の長期インターンのみ。<br />
              実務の経験を積みながら、自分に合うキャリアを見極める。その一歩目を支えます。
            </p>
          </div>

          {/* Search */}
          {isMobile ? (
            <div className="anim-fade-up anim-delay-3" style={{ background: '#fff', border: '1px solid #E9DFD2', borderRadius: 10, boxShadow: '0 1px 3px rgba(28,24,19,.06)', padding: 12, display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C2B8AC" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /></svg>
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="職種・企業名・キーワード" style={{ flex: 1, border: 'none', padding: '10px 0', fontFamily: "var(--font-sans)", fontSize: 14, outline: 'none', color: '#1C1813', background: 'transparent' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ width: '100%', border: '1px solid #EFE8DF', borderRadius: 6, padding: '10px 28px 10px 12px', fontFamily: "var(--font-sans)", fontSize: 13, color: '#57514A', outline: 'none', background: '#fff', cursor: 'pointer' }}>
                    <option value="">職種</option>
                    {categoryList.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#C2B8AC', pointerEvents: 'none', fontSize: 10 }}>▼</span>
                </div>
                <div style={{ position: 'relative', flex: 1 }}>
                  <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} style={{ width: '100%', border: '1px solid #EFE8DF', borderRadius: 6, padding: '10px 28px 10px 12px', fontFamily: "var(--font-sans)", fontSize: 13, color: '#57514A', outline: 'none', background: '#fff', cursor: 'pointer' }}>
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
              <button className="btn-primary" onClick={() => { const p = new URLSearchParams(); if (searchQuery) p.set('q', searchQuery); if (selectedCategory) p.set('category', selectedCategory); if (selectedLocation) p.set('location', selectedLocation); router.push(`/search?${p.toString()}`); }} style={{ background: '#F2620C', color: '#fff', border: 'none', padding: '13px', borderRadius: 6, fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>検索する</button>
            </div>
          ) : (
            <div className="anim-fade-up anim-delay-3" style={{ maxWidth: 860, background: '#fff', border: '1px solid #E9DFD2', borderRadius: 12, boxShadow: '0 1px 3px rgba(28,24,19,.06)', padding: 10, display: 'flex', gap: 8, alignItems: 'center', textAlign: 'left' }}>
              <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 0 14px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C2B8AC" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /></svg>
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="職種・企業名・キーワード" style={{ flex: 1, border: 'none', padding: '14px 0', fontFamily: "var(--font-sans)", fontSize: 15, outline: 'none', color: '#1C1813', background: 'transparent' }} />
              </div>
              <div style={{ position: 'relative', flex: 1 }}>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ width: '100%', border: 'none', borderLeft: '1px solid #EFE8DF', padding: '14px 32px 14px 18px', fontFamily: "var(--font-sans)", fontSize: 14, color: '#57514A', outline: 'none', background: '#fff', cursor: 'pointer' }}>
                  <option value="">職種を選ぶ</option>
                  {categoryList.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: '#C2B8AC', pointerEvents: 'none', fontSize: 11 }}>▼</span>
              </div>
              <div style={{ position: 'relative', flex: 1 }}>
                <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} style={{ width: '100%', border: 'none', borderLeft: '1px solid #EFE8DF', padding: '14px 32px 14px 18px', fontFamily: "var(--font-sans)", fontSize: 14, color: '#57514A', outline: 'none', background: '#fff', cursor: 'pointer' }}>
                  <option value="">勤務地</option>
                  <option value="東京">東京</option>
                  <option value="大阪">大阪</option>
                  <option value="名古屋">名古屋</option>
                  <option value="福岡">福岡</option>
                  <option value="リモート">リモート</option>
                </select>
                <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: '#C2B8AC', pointerEvents: 'none', fontSize: 11 }}>▼</span>
              </div>
              <button className="btn-primary" onClick={() => { const params = new URLSearchParams(); if (searchQuery) params.set('q', searchQuery); if (selectedCategory) params.set('category', selectedCategory); if (selectedLocation) params.set('location', selectedLocation); router.push(`/search?${params.toString()}`); }} style={{ background: '#F2620C', color: '#fff', border: 'none', padding: '15px 34px', borderRadius: 8, fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15, cursor: 'pointer', whiteSpace: 'nowrap' }}>検索する</button>
            </div>
          )}

          <div className="anim-fade-up anim-delay-4" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11.5, color: '#938B81' }}>人気：</span>
            {(isMobile ? popularTags.slice(0, 4) : popularTags.slice(0, 8)).map((p) => (
              <span key={p} className="pill-link" style={{ fontSize: 11.5, color: '#6D28D9', background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 999, padding: '5px 12px', cursor: 'pointer' }} onClick={() => router.push(`/search?tag=${encodeURIComponent(p)}`)}>
                #{p}
              </span>
            ))}
          </div>
          </div>

          {!isMobile && (
            <div className="anim-fade anim-delay-2" style={{ width: 400, flexShrink: 0, position: 'relative' }}>
              <img src="/images/hero-office.jpg" alt="" fetchPriority="high" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 18, display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: 18, background: 'linear-gradient(205deg, rgba(242,98,12,.16) 0%, rgba(242,98,12,0) 42%, rgba(28,24,19,.10) 100%)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: 18, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.35)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', left: 18, bottom: 18, background: 'rgba(255,255,255,.94)', backdropFilter: 'blur(4px)', borderRadius: 10, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src="/icon.svg" alt="" style={{ width: 26, height: 26 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1C1813', lineHeight: 1.4 }}>審査を通過した企業のみ掲載</div>
                  <div style={{ fontSize: 11, color: '#938B81' }}>上場企業・資金調達済スタートアップ</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FEATURES */}
      <div style={{ background: '#fff', borderBottom: '1px solid #F0EAE2' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '20px 20px' : '26px 48px', display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 0 : 24 }}>
          {features.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: isMobile ? '10px 8px' : undefined, borderRight: !isMobile && i < features.length - 1 ? '1px solid #F0EAE2' : 'none', borderLeft: isMobile && i % 2 === 1 ? '1px solid #F0EAE2' : 'none' }}>
              <div style={{ fontWeight: 700, color: '#1C1813', lineHeight: 1.4, marginBottom: 4, fontSize: isMobile ? 13.5 : 16 }}>{s.title}</div>
              <div style={{ fontSize: isMobile ? 10.5 : 12, color: '#938B81' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CATEGORIES */}
      <div style={{ background: '#FBF8F4' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '40px 20px' : '60px 48px' }}>
          <FadeIn>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: isMobile ? 20 : 28 }}>
            <h2 style={{ fontWeight: 700, fontSize: isMobile ? 19 : 24, margin: 0 }}>職種から探す</h2>
            <span className="nav-link" style={{ fontSize: 13, color: '#F2620C', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => router.push('/categories')}>職種一覧へ</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 14 }}>
            {cats.map((c) => (
              <div
                key={c}
                className="cat-card"
                onClick={() => router.push(`/search?category=${encodeURIComponent(c)}`)}
                style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 8, padding: isMobile ? '14px 14px' : '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              >
                <span style={{ fontWeight: 600, fontSize: isMobile ? 13 : 14.5 }}>{c}</span>
                <span style={{ color: '#C2B8AC', fontSize: isMobile ? 12 : 14 }}>›</span>
              </div>
            ))}
          </div>
          </FadeIn>
        </div>
      </div>

      {/* FEATURED JOBS */}
      <div style={{ background: '#fff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '40px 20px' : '60px 48px' }}>
          <FadeIn>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: isMobile ? 20 : 28 }}>
            <h2 style={{ fontWeight: 700, fontSize: isMobile ? 19 : 24, margin: 0 }}>注目の長期インターン</h2>
            <span className="nav-link" style={{ fontSize: 13, color: '#F2620C', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => router.push('/search')}>すべて見る</span>
          </div>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: isMobile ? 12 : 24 }}>
              {Array.from({ length: isMobile ? 2 : 3 }).map((_, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 12, overflow: 'hidden' }}>
                  <div className="skeleton" style={{ height: isMobile ? 100 : 148, borderRadius: 0 }} />
                  <div style={{ padding: isMobile ? '12px 14px 16px' : 22 }}>
                    <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: 10 }} />
                    <div className="skeleton" style={{ height: 18, width: '85%', marginBottom: 16 }} />
                    <div className="skeleton" style={{ height: 14, width: '55%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#938B81', fontSize: 15 }}>現在公開中の求人はありません</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: isMobile ? 12 : 24 }}>
              {jobs.slice(0, isMobile ? 2 : 3).map((j) => (
                <div
                  key={j.id}
                  className="job-card"
                  onClick={() => router.push(`/jobs/${j.id}`)}
                  style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                >
                  <div style={{ aspectRatio: COVER_ASPECT, position: 'relative', overflow: 'hidden', background: '#F3EEE7', flexShrink: 0 }}>
                    {(j.cover_image_url || j.companies?.cover_url) ? (
                      <img className="job-cover" src={j.cover_image_url || j.companies?.cover_url || ''} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: j.cover_image_position || '50% 50%', display: 'block' }} />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, background: '#FFF1E8' }} />
                    )}
                    {j.companies?.logo_url && (
                      <div style={{ position: 'absolute', bottom: isMobile ? 8 : 12, left: isMobile ? 10 : 16, width: isMobile ? 30 : 40, height: isMobile ? 30 : 40, borderRadius: 6, background: '#fff', border: '1px solid #EFE8DF', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <img src={j.companies.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                    )}
                  </div>
                  <div style={{ padding: isMobile ? '12px 14px 16px' : 22 }}>
                    <div style={{ fontSize: isMobile ? 10 : 12, color: '#938B81', marginBottom: isMobile ? 5 : 8 }}>{j.companies?.company_name || '企業名不明'}</div>
                    <h4 className={isMobile ? 'title-clamp' : ''} style={{ fontWeight: 700, fontSize: isMobile ? 13 : 17, margin: isMobile ? '0 0 10px' : '0 0 16px', lineHeight: 1.5 }}>{j.job_title}</h4>
                    {!isMobile && <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11.5, color: '#C2530A', background: '#FFF1E8', padding: '5px 11px', borderRadius: 4 }}>長期インターン</span>
                      <span style={{ fontSize: 11.5, color: '#57514A', background: '#F3EEE7', padding: '5px 11px', borderRadius: 4 }}>週3〜</span>
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
          </FadeIn>
        </div>
      </div>

      {/* ALL JOBS */}
      {filteredJobs.length > (isMobile ? 2 : 3) && (
        <div style={{ background: '#fff' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '0 20px 40px' : '0 48px 60px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? 16 : 24 }}>
              <h2 style={{ fontWeight: 700, fontSize: isMobile ? 16 : 20, margin: 0, color: '#1C1813' }}>
                求人一覧 <span style={{ fontSize: isMobile ? 12 : 14, color: '#938B81', fontWeight: 400 }}>{filteredJobs.length}件</span>
              </h2>
              <button onClick={() => { setSearchQuery(''); setSelectedCategory(''); setSelectedLocation(''); }} style={{ fontSize: 12, color: '#938B81', background: 'none', border: '1px solid #EFE8DF', borderRadius: 6, padding: '7px 12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>リセット</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: isMobile ? 12 : 20 }}>
              {filteredJobs.slice(isMobile ? 2 : 3, isMobile ? 8 : undefined).map((j) => (
                <div
                  key={j.id}
                  className="job-card"
                  onClick={() => router.push(`/jobs/${j.id}`)}
                  style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                >
                  <div style={{ aspectRatio: COVER_ASPECT, position: 'relative', overflow: 'hidden', background: '#F3EEE7', flexShrink: 0 }}>
                    {(j.cover_image_url || j.companies?.cover_url) ? (
                      <img
                        className="job-cover"
                        src={j.cover_image_url || j.companies?.cover_url || ''}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: j.cover_image_position || '50% 50%', display: 'block' }}
                      />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, background: '#FFF1E8' }} />
                    )}
                    {j.companies?.logo_url && (
                      <div style={{ position: 'absolute', bottom: 10, left: 12, width: 34, height: 34, borderRadius: 6, background: '#fff', border: '1px solid #EFE8DF', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
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
                <button onClick={() => router.push('/search')} style={{ background: '#fff', color: '#F2620C', border: '1.5px solid #F2620C', borderRadius: 8, padding: '13px 40px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  求人をもっと見る（{filteredJobs.length}件）
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* HOW IT WORKS */}
      <div style={{ background: '#FBF8F4' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '40px 20px' : '60px 48px' }}>
          <FadeIn>
            <h2 style={{ fontWeight: 700, fontSize: isMobile ? 19 : 24, margin: isMobile ? '0 0 20px' : '0 0 28px' }}>ご利用の流れ</h2>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: isMobile ? 12 : 20 }}>
            {steps.map((v, i) => (
              <FadeIn key={v.no} delay={isMobile ? 0 : i * 0.12}>
                <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 8, padding: isMobile ? '18px 20px' : '26px 28px', height: '100%' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#C2530A', marginBottom: 10 }}>STEP {v.no}</div>
                  <h4 style={{ fontWeight: 700, fontSize: isMobile ? 15 : 17, margin: '0 0 8px' }}>{v.title}</h4>
                  <p style={{ fontSize: isMobile ? 12.5 : 13.5, lineHeight: 1.9, color: '#57514A', margin: 0 }}>{v.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>

      {/* COMPANY CTA */}
      <div style={{ background: '#FBF8F4' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '0 20px 40px' : '0 48px 60px' }}>
          <FadeIn>
          <div style={{ position: 'relative', background: '#1C1813', borderRadius: 12, overflow: 'hidden', padding: isMobile ? '32px 24px' : '44px 48px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: isMobile ? 24 : 40 }}>
            <img src="/images/cta-skyline.jpg" alt="" loading="lazy" decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 30%', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(95deg, rgba(21,17,13,.93) 0%, rgba(21,17,13,.82) 55%, rgba(21,17,13,.62) 100%)' }} />
            <div style={{ position: 'relative' }}>
              <h3 style={{ fontWeight: 700, fontSize: isMobile ? 18 : 24, color: '#fff', margin: '0 0 10px', lineHeight: 1.5 }}>難関大生の採用をお考えの企業様へ</h3>
              <p style={{ fontSize: isMobile ? 13 : 14.5, color: '#C9C0B6', margin: 0, lineHeight: 1.9 }}>月額定額で何件でも求人を掲載いただけます。まずは資料をご覧ください。</p>
            </div>
            <span className="btn-primary" onClick={() => router.push('/for-companies')} style={{ position: 'relative', whiteSpace: 'nowrap', background: '#F2620C', color: '#fff', fontWeight: 700, fontSize: isMobile ? 14 : 15, padding: isMobile ? '13px 28px' : '15px 36px', borderRadius: 8, cursor: 'pointer' }}>
              資料を請求する
            </span>
          </div>
          </FadeIn>
        </div>
      </div>

      {/* FOOTER */}
      <SiteFooter />
    </div>
  );
}
