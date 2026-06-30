'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

interface JobDetail {
  id: string;
  company_id: string;
  job_title: string;
  salary: string;
  location: string;
  job_description: string;
  requirements: string;
  job_categories: string[];
  work_days: string[];
  work_conditions: string[];
  job_features: string[];
  companies: {
    company_name: string;
    industry: string;
    contact_email: string;
    description?: string;
    location?: string;
    employee_count?: string;
    website?: string;
    founded_year?: number;
    logo_url?: string;
  } | null;
}

interface User {
  id: string;
  email?: string;
}

interface UserType {
  user_type: string;
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [favLoading, setFavLoading] = useState(false);

  // Fetch job — no auth required
  useEffect(() => {
    async function fetchJobDetail() {
      try {
        // Fetch job without join
        const { data: jobData, error: jobError } = await supabase
          .from('jobs')
          .select(`
            id,
            company_id,
            job_title,
            salary,
            location,
            job_description,
            requirements,
            job_categories,
            work_days,
            work_conditions,
            job_features
          `)
          .eq('id', jobId)
          .single();

        if (jobError || !jobData) {
          console.error('Job fetch error:', jobError);
          setError('求人情報の取得に失敗しました');
          setLoading(false);
          return;
        }

        // Fetch company separately
        let companyData = null;
        if ((jobData as any).company_id) {
          const { data: c } = await supabase
            .from('companies')
            .select('company_name, industry, contact_email, description, location, employee_count, website, founded_year, logo_url')
            .eq('id', (jobData as any).company_id)
            .maybeSingle();
          companyData = c;
        }

        setJob({ ...(jobData as any), companies: companyData });
      } catch (e) {
        console.error('Unexpected error:', e);
        setError('予期しないエラーが発生しました');
      } finally {
        setLoading(false);
      }
    }
    fetchJobDetail();
  }, [jobId]);

  // Check auth separately
  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUser(session.user as User);

      const { data: ut } = await supabase
        .from('user_types')
        .select('user_type')
        .eq('user_id', session.user.id)
        .single();
      if (ut) setUserType(ut as UserType);
    }
    checkAuth();
  }, []);

  // Check if applied
  useEffect(() => {
    async function checkApplied() {
      if (!user) return;
      const { data } = await supabase
        .from('applications')
        .select('id')
        .eq('user_id', user.id)
        .eq('job_id', jobId)
        .maybeSingle();
      setHasApplied(!!data);
    }
    checkApplied();
  }, [user, jobId]);

  // Check if favorited
  useEffect(() => {
    async function checkFavorite() {
      if (!user || userType?.user_type !== 'student') return;
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('job_id', jobId)
        .maybeSingle();
      if (data) {
        setIsFavorited(true);
        setFavoriteId(data.id);
      }
    }
    checkFavorite();
  }, [user, userType, jobId]);

  const handleToggleFavorite = async () => {
    if (!user) { router.push(`/auth/login?redirect=/jobs/${jobId}`); return; }
    if (userType?.user_type !== 'student') return;
    setFavLoading(true);
    try {
      if (isFavorited && favoriteId) {
        await supabase.from('favorites').delete().eq('id', favoriteId);
        setIsFavorited(false);
        setFavoriteId(null);
      } else {
        const { data } = await supabase
          .from('favorites')
          .upsert({ user_id: user.id, job_id: jobId }, { onConflict: 'user_id,job_id' })
          .select('id')
          .single();
        setIsFavorited(true);
        if (data) setFavoriteId(data.id);
      }
    } finally {
      setFavLoading(false);
    }
  };

  const handleApply = async () => {
    if (!user) {
      router.push(`/auth/login?redirect=/jobs/${jobId}`);
      return;
    }
    if (userType?.user_type !== 'student') return;

    // Check profile completeness
    const { data: profile } = await supabase
      .from('student_profiles')
      .select('name, university, grade')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile || !profile.name || !profile.university || !profile.grade) {
      alert('プロフィールを完成させてから応募してください');
      router.push('/dashboard/student');
      return;
    }

    setIsApplying(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('applications')
        .insert([{ user_id: user.id, job_id: jobId, status: 'pending' }]);
      if (error) {
        setError('応募に失敗しました');
      } else {
        alert('応募しました！');
        setHasApplied(true);
      }
    } catch {
      setError('エラーが発生しました');
    } finally {
      setIsApplying(false);
    }
  };

  const FF = "'Zen Kaku Gothic New', sans-serif";
  const MONO = "'IBM Plex Mono', monospace";

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF8F4', fontFamily: FF }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, border: '3px solid #F2620C', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin .8s linear infinite' }} />
          <p style={{ color: '#57514A', fontSize: 15 }}>読み込み中...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF8F4', fontFamily: FF }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 18, color: '#57514A', marginBottom: 20 }}>求人が見つかりません</p>
          <button onClick={() => router.push('/')} style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontFamily: FF, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            トップページに戻る
          </button>
        </div>
      </div>
    );
  }

  const isStudent = userType?.user_type === 'student';

  return (
    <div style={{ minHeight: '100vh', background: '#FBF8F4', fontFamily: FF, color: '#1C1813', paddingBottom: 100 }}>
      <link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;700;900&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* NAV */}
      <div style={{ background: 'rgba(255,255,255,.95)', borderBottom: '1px solid #EFE8DF', padding: '14px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 36, cursor: 'pointer' }} onClick={() => router.push('/')} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {user ? (
            <>
              {isStudent && (
                <button onClick={() => router.push('/dashboard/student')} style={{ background: '#FFF1E8', color: '#F2620C', border: 'none', borderRadius: 8, padding: '9px 18px', fontFamily: FF, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>マイページ</button>
              )}
              <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} style={{ background: '#fff', color: '#57514A', border: '1px solid #EFE8DF', borderRadius: 8, padding: '9px 18px', fontFamily: FF, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>ログアウト</button>
            </>
          ) : (
            <>
              <button onClick={() => router.push(`/auth/login?redirect=/jobs/${jobId}`)} style={{ background: '#fff', color: '#57514A', border: '1px solid #EFE8DF', borderRadius: 8, padding: '9px 18px', fontFamily: FF, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>ログイン</button>
              <button onClick={() => router.push('/auth/signup')} style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontFamily: FF, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>無料で登録</button>
            </>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
        {/* BREADCRUMB */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 13, color: '#938B81' }}>
          <span style={{ cursor: 'pointer', color: '#F2620C' }} onClick={() => router.push('/')}>トップ</span>
          <span>›</span>
          <span style={{ cursor: 'pointer', color: '#F2620C' }} onClick={() => router.push('/search')}>求人検索</span>
          <span>›</span>
          <span style={{ color: '#57514A' }}>{job.job_title}</span>
        </div>

        {/* HEADER CARD */}
        <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 18, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ height: 5, background: 'linear-gradient(90deg,#F2620C,#FB8A3C)' }} />
          <div style={{ padding: '32px 36px' }}>
            <div style={{ fontSize: 13, color: '#938B81', marginBottom: 8 }}>{job.companies?.company_name}</div>
            <h1 style={{ fontWeight: 900, fontSize: 30, margin: '0 0 20px', lineHeight: 1.4 }}>{job.job_title}</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 14, color: '#57514A' }}>
              <span>📍 {job.location}</span>
              <span>💰 {job.salary}</span>
              {job.companies?.industry && <span>🏢 {job.companies.industry}</span>}
            </div>
            {job.job_categories && job.job_categories.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
                {job.job_categories.map(cat => (
                  <span key={cat} style={{ fontSize: 12, background: '#FFF1E8', color: '#F2620C', border: '1px solid #FBD5C0', borderRadius: 6, padding: '4px 12px', fontWeight: 600 }}>{cat}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* DETAILS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* 業務内容 */}
          <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 14, padding: '28px 32px' }}>
            <h2 style={{ fontWeight: 900, fontSize: 18, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 4, height: 20, background: '#F2620C', borderRadius: 2, display: 'inline-block' }} />
              業務内容
            </h2>
            <p style={{ fontSize: 14, lineHeight: 1.9, color: '#3A352F', margin: 0, whiteSpace: 'pre-wrap' }}>{job.job_description}</p>
          </div>

          {/* 応募要件 */}
          {job.requirements && (
            <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 14, padding: '28px 32px' }}>
              <h2 style={{ fontWeight: 900, fontSize: 18, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 4, height: 20, background: '#F2620C', borderRadius: 2, display: 'inline-block' }} />
                応募要件
              </h2>
              <p style={{ fontSize: 14, lineHeight: 1.9, color: '#3A352F', margin: 0, whiteSpace: 'pre-wrap' }}>{job.requirements}</p>
            </div>
          )}

          {/* 求人情報グリッド */}
          <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 14, padding: '28px 32px' }}>
            <h2 style={{ fontWeight: 900, fontSize: 18, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 4, height: 20, background: '#F2620C', borderRadius: 2, display: 'inline-block' }} />
              求人情報
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: '#FBF8F4', borderRadius: 10, padding: '16px 18px' }}>
                <div style={{ fontSize: 11, color: '#938B81', marginBottom: 6 }}>📍 勤務地</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{job.location}</div>
              </div>
              <div style={{ background: '#FBF8F4', borderRadius: 10, padding: '16px 18px' }}>
                <div style={{ fontSize: 11, color: '#938B81', marginBottom: 6 }}>💰 給与</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{job.salary}</div>
              </div>
              {job.work_days && job.work_days.length > 0 && (
                <div style={{ background: '#FBF8F4', borderRadius: 10, padding: '16px 18px' }}>
                  <div style={{ fontSize: 11, color: '#938B81', marginBottom: 6 }}>⏰ 勤務日数</div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{job.work_days.join(', ')}</div>
                </div>
              )}
            </div>

            {job.work_conditions && job.work_conditions.length > 0 && (
              <div style={{ marginTop: 18 }}>
                <div style={{ fontSize: 12, color: '#938B81', marginBottom: 10 }}>🏢 勤務条件</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {job.work_conditions.map(c => (
                    <span key={c} style={{ fontSize: 12, background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', borderRadius: 6, padding: '4px 12px' }}>{c}</span>
                  ))}
                </div>
              </div>
            )}

            {job.job_features && job.job_features.length > 0 && (
              <div style={{ marginTop: 18 }}>
                <div style={{ fontSize: 12, color: '#938B81', marginBottom: 10 }}>⭐ 求人の特徴</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {job.job_features.map(f => (
                    <span key={f} style={{ fontSize: 12, background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A', borderRadius: 6, padding: '4px 12px' }}>{f}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 企業情報 */}
          {job.company_id && (
            <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 14, padding: '28px 32px' }}>
              <h2 style={{ fontWeight: 900, fontSize: 18, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 4, height: 20, background: '#F2620C', borderRadius: 2, display: 'inline-block' }} />
                企業情報
              </h2>
              {job.companies && (
                <>
                  {/* Company header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                    {job.companies.logo_url ? (
                      <img src={job.companies.logo_url} alt={job.companies.company_name} style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'contain', border: '1px solid #EFE8DF', background: '#fff', padding: 4, flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 56, height: 56, borderRadius: 12, background: '#FFF1E8', border: '1px solid #FBD5C0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🏢</div>
                    )}
                    <div>
                      <div style={{ fontWeight: 900, fontSize: 18, color: '#1C1813' }}>{job.companies.company_name}</div>
                      {job.companies.industry && <div style={{ fontSize: 13, color: '#938B81', marginTop: 3 }}>{job.companies.industry}</div>}
                    </div>
                  </div>

                  {/* Description */}
                  {job.companies.description && (
                    <p style={{ fontSize: 14, lineHeight: 1.85, color: '#57514A', margin: '0 0 20px', padding: '16px 18px', background: '#FBF8F4', borderRadius: 10 }}>{job.companies.description}</p>
                  )}

                  {/* Info grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                    {job.companies.location && (
                      <div style={{ background: '#FBF8F4', borderRadius: 10, padding: '14px 16px' }}>
                        <div style={{ fontSize: 11, color: '#938B81', marginBottom: 5 }}>📍 所在地</div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{job.companies.location}</div>
                      </div>
                    )}
                    {job.companies.employee_count && (
                      <div style={{ background: '#FBF8F4', borderRadius: 10, padding: '14px 16px' }}>
                        <div style={{ fontSize: 11, color: '#938B81', marginBottom: 5 }}>👥 従業員数</div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{job.companies.employee_count}</div>
                      </div>
                    )}
                    {job.companies.founded_year && (
                      <div style={{ background: '#FBF8F4', borderRadius: 10, padding: '14px 16px' }}>
                        <div style={{ fontSize: 11, color: '#938B81', marginBottom: 5 }}>📅 設立年</div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{job.companies.founded_year}年</div>
                      </div>
                    )}
                    {job.companies.website && (
                      <div style={{ background: '#FBF8F4', borderRadius: 10, padding: '14px 16px' }}>
                        <div style={{ fontSize: 11, color: '#938B81', marginBottom: 5 }}>🌐 ウェブサイト</div>
                        <a href={job.companies.website} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, fontSize: 13, color: '#F2620C', textDecoration: 'none' }}>サイトを見る →</a>
                      </div>
                    )}
                  </div>
                </>
              )}
              <button
                onClick={() => router.push(`/companies/${job.company_id}`)}
                style={{ background: '#FFF1E8', color: '#F2620C', border: '1px solid #FBD5C0', borderRadius: 10, padding: '12px 22px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                この企業の詳細・求人一覧を見る →
              </button>
            </div>
          )}
        </div>

        {error && (
          <div style={{ marginTop: 16, padding: '14px 18px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, color: '#B91C1C', fontSize: 14 }}>
            {error}
          </div>
        )}
      </div>

      {/* STICKY BOTTOM CTA */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #EFE8DF', padding: '14px 48px', display: 'flex', alignItems: 'center', gap: 12, zIndex: 100, boxShadow: '0 -4px 20px rgba(28,24,19,.08)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.job_title}</div>
          <div style={{ fontSize: 12, color: '#938B81' }}>{job.companies?.company_name}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          {/* Favorite button — only if student */}
          {isStudent && (
            <button
              onClick={handleToggleFavorite}
              disabled={favLoading}
              style={{ width: 48, height: 48, borderRadius: 10, border: `1px solid ${isFavorited ? '#F2620C' : '#EFE8DF'}`, background: isFavorited ? '#FFF1E8' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 22, transition: '.2s' }}
              title={isFavorited ? 'お気に入りから削除' : 'お気に入りに追加'}
            >
              {isFavorited ? '♥' : '♡'}
            </button>
          )}
          {/* Apply button */}
          {!user && (
            <button
              onClick={() => router.push(`/auth/login?redirect=/jobs/${jobId}`)}
              style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '0 28px', height: 48, fontFamily: FF, fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 14px rgba(242,98,12,.3)' }}
            >
              ログインして応募
            </button>
          )}
          {user && isStudent && !hasApplied && (
            <button
              onClick={handleApply}
              disabled={isApplying}
              style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '0 28px', height: 48, fontFamily: FF, fontWeight: 700, fontSize: 14, cursor: isApplying ? 'not-allowed' : 'pointer', opacity: isApplying ? 0.7 : 1, boxShadow: '0 4px 14px rgba(242,98,12,.3)' }}
            >
              {isApplying ? '応募中...' : 'この求人に応募する'}
            </button>
          )}
          {user && isStudent && hasApplied && (
            <button
              disabled
              style={{ background: '#EFE8DF', color: '#938B81', border: 'none', borderRadius: 10, padding: '0 28px', height: 48, fontFamily: FF, fontWeight: 700, fontSize: 14, cursor: 'not-allowed' }}
            >
              応募済み
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
