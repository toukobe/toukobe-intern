'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useIsMobile } from '@/utils/useIsMobile';
import SiteFooter from '@/components/SiteFooter';

interface JobDetail {
  id: string;
  company_id: string;
  job_title: string;
  salary: string;
  location: string;
  job_description: string;
  requirements: string;
  status: string;
  job_categories: string[];
  work_days: string[];
  work_conditions: string[];
  job_features: string[];
  cover_image_url?: string;
  cover_image_position?: string;
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

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const isMobile = useIsMobile();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [favLoading, setFavLoading] = useState(false);
  const [relatedJobs, setRelatedJobs] = useState<{ id: string; job_title: string; salary: string; location: string; cover_image_url?: string; cover_image_position?: string; companies?: { company_name: string; logo_url?: string } | null }[]>([]);
  const [studentProfile, setStudentProfile] = useState<{ last_name?: string; first_name?: string; birth_date?: string; university?: string; department?: string; grade?: string; contact_email?: string; skills?: string[]; experience?: string } | null>(null);
  const [contactEmail, setContactEmail] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

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
            status,
            job_categories,
            work_days,
            work_conditions,
            job_features,
            cover_image_url,
            cover_image_position
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
            .select('company_name, industry, contact_email, description, location, employee_count, website, founded_year, logo_url, cover_url')
            .eq('id', (jobData as any).company_id)
            .maybeSingle();
          companyData = c;
        }

        const mergedJob = { ...(jobData as any), companies: companyData };
        setJob(mergedJob);

        // おすすめ求人：同カテゴリから最大4件（自分除く）
        const cats: string[] = (jobData as any).job_categories || [];
        if (cats.length > 0) {
          const { data: related } = await supabase
            .from('jobs')
            .select('id, job_title, salary, location, cover_image_url, cover_image_position, company_id')
            .eq('status', 'published')
            .neq('id', (jobData as any).id)
            .contains('job_categories', [cats[0]])
            .limit(4);
          if (related && related.length > 0) {
            const cIds = [...new Set(related.map((r: any) => r.company_id).filter(Boolean))];
            const { data: relCos } = await supabase.from('companies').select('id, company_name, logo_url').in('id', cIds);
            const coMap: Record<string, any> = {};
            (relCos || []).forEach((c: any) => { coMap[c.id] = c; });
            setRelatedJobs(related.map((r: any) => ({ ...r, companies: coMap[r.company_id] || null })));
          }
        }
      } catch (e) {
        console.error('Unexpected error:', e);
        setError('予期しないエラーが発生しました');
      } finally {
        setLoading(false);
      }
    }
    fetchJobDetail();
  }, [jobId]);

  // Update page title when job loads
  useEffect(() => {
    if (job) {
      document.title = `${job.job_title}${job.companies?.company_name ? ` | ${job.companies.company_name}` : ''} | トウコべインターン`;
    }
    return () => { document.title = 'トウコべインターン'; };
  }, [job]);

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

  // Fetch student profile (連絡先メールの確認・プロフィール完成度チェック用)
  useEffect(() => {
    async function fetchProfile() {
      if (!user || userType?.user_type !== 'student') return;
      const { data } = await supabase
        .from('student_profiles')
        .select('last_name, first_name, birth_date, university, department, grade, contact_email, skills, experience')
        .eq('user_id', user.id)
        .maybeSingle();
      setStudentProfile(data);
      setContactEmail(data?.contact_email || user.email || '');
    }
    fetchProfile();
  }, [user, userType]);

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

    if (job?.status !== 'published') {
      showToast('この求人は現在募集を停止しています', 'error');
      return;
    }

    // 連絡先メールの確認（モーダルで変更可能）
    const email = contactEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('連絡先メールアドレスの形式が正しくありません', 'error');
      return;
    }

    // Check profile completeness (70% = 7/9 fields required)
    const profile = studentProfile;
    const profileFields = profile ? [
      profile.last_name, profile.first_name, profile.birth_date,
      profile.university, profile.department, profile.grade,
      email,
      Array.isArray(profile.skills) ? (profile.skills.length > 0 ? profile.skills[0] : null) : profile.skills,
      profile.experience,
    ] : [];
    const filled = profileFields.filter(v => v !== null && v !== undefined && v !== '').length;
    const pct = Math.round((filled / 9) * 100);

    if (!profile || pct < 70) {
      setShowApplyModal(false);
      showToast(`プロフィールを70%以上入力してから応募してください（現在${pct}%）`, 'error');
      setTimeout(() => router.push('/dashboard/student'), 1500);
      return;
    }

    setShowApplyModal(false);
    setIsApplying(true);
    setError(null);
    try {
      // 変更された連絡先メールをプロフィールに保存
      if (email !== profile.contact_email) {
        await supabase.from('student_profiles').update({ contact_email: email }).eq('user_id', user.id);
        setStudentProfile({ ...profile, contact_email: email });
      }
      const { data: appData, error } = await supabase
        .from('applications')
        .insert([{ user_id: user.id, job_id: jobId, status: 'unread' }])
        .select('id')
        .single();
      if (error) {
        setError('応募に失敗しました');
      } else {
        showToast('応募しました！');
        setHasApplied(true);
        // 企業へ応募通知メール
        if (job?.companies?.contact_email) {
          const { data: { session } } = await supabase.auth.getSession();
          fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
            body: JSON.stringify({
              type: 'application_received',
              to: job.companies.contact_email,
              jobTitle: job.job_title,
              companyName: job.companies.company_name || '',
              studentName: profile ? `${profile.last_name || ''} ${profile.first_name || ''}`.trim() : '',
              studentUniversity: profile?.university,
              studentGrade: profile?.grade,
              studentEmail: email,
              applicationId: appData?.id,
            }),
          }).catch(console.error);
        }
      }
    } catch {
      setError('エラーが発生しました');
    } finally {
      setIsApplying(false);
    }
  };

  const FF = "var(--font-sans)";
  const MONO = "var(--font-mono)";

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#FBF8F4', fontFamily: FF }}>
        <div style={{ background: 'rgba(255,255,255,.95)', borderBottom: '1px solid #EFE8DF', padding: isMobile ? '14px 16px' : '14px 48px', display: 'flex', alignItems: 'center' }}>
          <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 36 }} />
        </div>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '20px 12px' : '32px 24px' }}>
          <div className="skeleton" style={{ height: 14, width: 220, marginBottom: 24 }} />
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', gap: 24, alignItems: 'start' }}>
            <div>
              <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 18, overflow: 'hidden', marginBottom: 20 }}>
                <div className="skeleton" style={{ height: isMobile ? 160 : 260, borderRadius: 0 }} />
                <div style={{ padding: isMobile ? '20px 16px' : '24px 32px' }}>
                  <div className="skeleton" style={{ height: 14, width: '30%', marginBottom: 12 }} />
                  <div className="skeleton" style={{ height: 24, width: '75%', marginBottom: 16 }} />
                  <div className="skeleton" style={{ height: 14, width: '50%' }} />
                </div>
              </div>
              <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 14, padding: isMobile ? '20px 16px' : '28px 32px' }}>
                <div className="skeleton" style={{ height: 18, width: '25%', marginBottom: 16 }} />
                <div className="skeleton" style={{ height: 12, width: '100%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 12, width: '92%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 12, width: '80%' }} />
              </div>
            </div>
            {!isMobile && (
              <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, overflow: 'hidden' }}>
                <div className="skeleton" style={{ height: 80, borderRadius: 0 }} />
                <div style={{ padding: '16px 20px 20px' }}>
                  <div className="skeleton" style={{ height: 16, width: '60%', marginBottom: 12 }} />
                  <div className="skeleton" style={{ height: 44, width: '100%' }} />
                </div>
              </div>
            )}
          </div>
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
  const isOpenForApplication = job.status === 'published';

  return (
    <div style={{ minHeight: '100vh', background: '#FBF8F4', fontFamily: FF, color: '#1C1813', paddingBottom: 100 }}>

      {toast && (
        <div className="anim-fade-up" style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: toast.type === 'error' ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${toast.type === 'error' ? '#FECACA' : '#BBF7D0'}`, color: toast.type === 'error' ? '#B91C1C' : '#15803D', borderRadius: 12, padding: '14px 24px', fontWeight: 700, fontSize: 14, boxShadow: '0 8px 32px rgba(0,0,0,.12)', whiteSpace: 'nowrap' }}>
          {toast.type === 'success' ? '✓ ' : '✕ '}{toast.msg}
        </div>
      )}

      {/* NAV */}
      <div style={{ background: 'rgba(255,255,255,.95)', borderBottom: '1px solid #EFE8DF', padding: isMobile ? '14px 16px' : '14px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 36, cursor: 'pointer' }} onClick={() => router.push('/')} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {user ? (
            <>
              {isStudent && (
                <button onClick={() => router.push('/dashboard/student')} style={{ background: '#FFF1E8', color: '#F2620C', border: 'none', borderRadius: 8, padding: '9px 18px', fontFamily: FF, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>マイページ</button>
              )}
              {userType?.user_type === 'company' && (
                <button onClick={() => router.push('/dashboard/company')} style={{ background: '#FFF1E8', color: '#F2620C', border: 'none', borderRadius: 8, padding: '9px 18px', fontFamily: FF, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>ダッシュボード</button>
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

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '20px 12px 80px' : '32px 24px 100px' }}>
        {/* BREADCRUMB */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 13, color: '#938B81' }}>
          <span style={{ cursor: 'pointer', color: '#F2620C' }} onClick={() => router.push('/')}>トップ</span>
          <span>›</span>
          <span style={{ cursor: 'pointer', color: '#F2620C' }} onClick={() => router.push('/search')}>求人検索</span>
          <span>›</span>
          <span style={{ color: '#57514A' }}>{job.job_title}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', gap: 24, alignItems: 'start' }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ minWidth: 0 }}>

            {/* HEADER CARD */}
            <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 18, marginBottom: 20, position: 'relative' }}>
              {(() => {
                const coverSrc = job.cover_image_url;
                return coverSrc ? (
                  <div style={{ height: 260, overflow: 'hidden', position: 'relative', borderRadius: '18px 18px 0 0' }}>
                    <img src={coverSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: job.cover_image_position || '50% 50%', display: 'block' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,.45) 100%)' }} />
                  </div>
                ) : (
                  <div style={{ height: 180, background: 'linear-gradient(135deg,#F2620C,#FB8A3C)', position: 'relative', overflow: 'hidden', borderRadius: '18px 18px 0 0' }}>
                    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: .1 }} viewBox="0 0 860 180" preserveAspectRatio="xMidYMid slice">
                      <circle cx="760" cy="-30" r="220" fill="#fff"/><circle cx="60" cy="200" r="160" fill="#fff"/>
                    </svg>
                  </div>
                );
              })()}
              <div style={{ padding: isMobile ? '0 16px 24px' : '0 32px 32px' }}>
                <div style={{ marginTop: -36, marginBottom: 16, position: 'relative', zIndex: 10 }}>
                  {job.companies?.logo_url ? (
                    <img src={job.companies.logo_url} alt={job.companies.company_name} style={{ width: 72, height: 72, borderRadius: 16, objectFit: 'contain', border: '3px solid #fff', background: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,.14)', padding: 4, display: 'block' }} />
                  ) : (
                    <div style={{ width: 72, height: 72, borderRadius: 16, background: 'linear-gradient(135deg,#FFF1E8,#FFE0CC)', border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, boxShadow: '0 4px 16px rgba(0,0,0,.10)' }}>🏢</div>
                  )}
                </div>
                <div style={{ fontSize: 13, color: '#938B81', marginBottom: 6, cursor: 'pointer' }} onClick={() => router.push(`/companies/${job.company_id}`)}>
                  {job.companies?.company_name}
                  {job.companies?.industry && <span style={{ marginLeft: 10, background: '#FFF1E8', color: '#F2620C', fontSize: 11, fontWeight: 700, borderRadius: 4, padding: '2px 8px' }}>{job.companies.industry}</span>}
                </div>
                <h1 style={{ fontWeight: 900, fontSize: isMobile ? 20 : 26, margin: '0 0 18px', lineHeight: 1.45 }}>{job.job_title}</h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 14, color: '#57514A', marginBottom: 14 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B6ADA2" strokeWidth="2"><path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11Z"/><circle cx="12" cy="10" r="2.4"/></svg>
                    {job.location}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B6ADA2" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    {job.salary}
                  </span>
                </div>
                {job.job_categories && job.job_categories.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {job.job_categories.map(cat => (
                      <span key={cat} style={{ fontSize: 12, background: '#FFF1E8', color: '#F2620C', border: '1px solid #FBD5C0', borderRadius: 6, padding: '4px 12px', fontWeight: 600 }}>{cat}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 業務内容 */}
            <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 14, padding: isMobile ? '20px 16px' : '28px 32px', marginBottom: 16 }}>
              <h2 style={{ fontWeight: 900, fontSize: 18, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 4, height: 20, background: '#F2620C', borderRadius: 2, display: 'inline-block' }} />業務内容
              </h2>
              <p style={{ fontSize: 14, lineHeight: 1.9, color: '#3A352F', margin: 0, whiteSpace: 'pre-wrap' }}>{job.job_description}</p>
            </div>

            {/* 応募要件 */}
            {job.requirements && (
              <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 14, padding: isMobile ? '20px 16px' : '28px 32px', marginBottom: 16 }}>
                <h2 style={{ fontWeight: 900, fontSize: 18, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 4, height: 20, background: '#F2620C', borderRadius: 2, display: 'inline-block' }} />応募要件
                </h2>
                <p style={{ fontSize: 14, lineHeight: 1.9, color: '#3A352F', margin: 0, whiteSpace: 'pre-wrap' }}>{job.requirements}</p>
              </div>
            )}

            {/* 求人情報 */}
            <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 14, padding: isMobile ? '20px 16px' : '28px 32px', marginBottom: 16 }}>
              <h2 style={{ fontWeight: 900, fontSize: 18, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 4, height: 20, background: '#F2620C', borderRadius: 2, display: 'inline-block' }} />求人情報
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
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
            </div>

            {/* 企業情報 */}
            {job.companies && (
              <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 14, padding: isMobile ? '20px 16px' : '28px 32px' }}>
                <h2 style={{ fontWeight: 900, fontSize: 18, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 4, height: 20, background: '#F2620C', borderRadius: 2, display: 'inline-block' }} />企業情報
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                  {job.companies.logo_url ? (
                    <img src={job.companies.logo_url} alt={job.companies.company_name} style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'contain', border: '1px solid #EFE8DF', background: '#fff', padding: 4, flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 52, height: 52, borderRadius: 12, background: '#FFF1E8', border: '1px solid #FBD5C0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🏢</div>
                  )}
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 17, color: '#1C1813' }}>{job.companies.company_name}</div>
                    {job.companies.industry && <div style={{ fontSize: 13, color: '#938B81', marginTop: 2 }}>{job.companies.industry}</div>}
                  </div>
                </div>
                {job.companies.description && (
                  <p style={{ fontSize: 14, lineHeight: 1.85, color: '#57514A', margin: '0 0 18px', padding: '14px 16px', background: '#FBF8F4', borderRadius: 10 }}>{job.companies.description}</p>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 18 }}>
                  {job.companies.location && <div style={{ background: '#FBF8F4', borderRadius: 10, padding: '12px 14px' }}><div style={{ fontSize: 11, color: '#938B81', marginBottom: 4 }}>📍 所在地</div><div style={{ fontWeight: 600, fontSize: 13 }}>{job.companies.location}</div></div>}
                  {job.companies.employee_count && <div style={{ background: '#FBF8F4', borderRadius: 10, padding: '12px 14px' }}><div style={{ fontSize: 11, color: '#938B81', marginBottom: 4 }}>👥 従業員数</div><div style={{ fontWeight: 600, fontSize: 13 }}>{job.companies.employee_count}</div></div>}
                  {job.companies.founded_year && <div style={{ background: '#FBF8F4', borderRadius: 10, padding: '12px 14px' }}><div style={{ fontSize: 11, color: '#938B81', marginBottom: 4 }}>📅 設立年</div><div style={{ fontWeight: 600, fontSize: 13 }}>{job.companies.founded_year}年</div></div>}
                  {job.companies.website && <div style={{ background: '#FBF8F4', borderRadius: 10, padding: '12px 14px' }}><div style={{ fontSize: 11, color: '#938B81', marginBottom: 4 }}>🌐 ウェブサイト</div><a href={job.companies.website} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, fontSize: 13, color: '#F2620C', textDecoration: 'none' }}>サイトを見る →</a></div>}
                </div>
                <button onClick={() => router.push(`/companies/${job.company_id}`)} style={{ background: '#FFF1E8', color: '#F2620C', border: '1px solid #FBD5C0', borderRadius: 10, padding: '11px 20px', fontFamily: FF, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  この企業の詳細・求人一覧を見る →
                </button>
              </div>
            )}

            {error && (
              <div style={{ marginTop: 16, padding: '14px 18px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, color: '#B91C1C', fontSize: 14 }}>
                {error}
              </div>
            )}
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div style={{ position: 'sticky', top: 24 }}>

            {/* 企業カード */}
            <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
              {/* ミニカバー */}
              {job.companies?.cover_url ? (
                <div style={{ height: 80, overflow: 'hidden' }}>
                  <img src={job.companies.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              ) : (
                <div style={{ height: 70, background: 'linear-gradient(135deg,#F2620C,#FB8A3C)' }} />
              )}
              <div style={{ padding: '16px 20px 20px' }}>
                {/* ロゴ */}
                <div style={{ marginTop: -28, marginBottom: 12, position: 'relative', zIndex: 2 }}>
                  {job.companies?.logo_url ? (
                    <img src={job.companies.logo_url} alt="" style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'contain', border: '3px solid #fff', background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,.12)', padding: 3, display: 'block' }} />
                  ) : (
                    <div style={{ width: 52, height: 52, borderRadius: 12, background: '#FFF1E8', border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 2px 10px rgba(0,0,0,.1)' }}>🏢</div>
                  )}
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#1C1813', marginBottom: 4, cursor: 'pointer' }} onClick={() => router.push(`/companies/${job.company_id}`)}>
                  {job.companies?.company_name}
                </div>
                {job.companies?.industry && <div style={{ fontSize: 12, color: '#938B81', marginBottom: 10 }}>{job.companies.industry}</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#57514A', marginBottom: 18 }}>
                  {job.companies?.location && <span>📍 {job.companies.location}</span>}
                  {job.companies?.employee_count && <span>👥 {job.companies.employee_count}名</span>}
                </div>

                {/* CTA buttons */}
                {!user && (
                  <>
                    <button className="btn-primary" onClick={() => router.push(`/auth/login?redirect=/jobs/${jobId}`)}
                      style={{ width: '100%', background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontFamily: FF, fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 14px rgba(242,98,12,.28)', marginBottom: 10 }}>
                      エントリーする
                    </button>
                    <button onClick={() => router.push(`/auth/login?redirect=/jobs/${jobId}`)}
                      style={{ width: '100%', background: '#fff', color: '#57514A', border: '1px solid #EFE8DF', borderRadius: 10, padding: '12px', fontFamily: FF, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                      ♡ お気に入りに追加
                    </button>
                  </>
                )}
                {user && isStudent && !hasApplied && isOpenForApplication && (
                  <>
                    <button className="btn-primary" onClick={() => setShowApplyModal(true)}
                      style={{ width: '100%', background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontFamily: FF, fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 14px rgba(242,98,12,.28)', marginBottom: 10 }}>
                      エントリーする
                    </button>
                    <button onClick={handleToggleFavorite} disabled={favLoading}
                      style={{ width: '100%', background: isFavorited ? '#FFF1E8' : '#fff', color: isFavorited ? '#F2620C' : '#57514A', border: `1px solid ${isFavorited ? '#FBD5C0' : '#EFE8DF'}`, borderRadius: 10, padding: '12px', fontFamily: FF, fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: '.15s' }}>
                      {isFavorited ? '♥ お気に入り済み' : '♡ お気に入りに追加'}
                    </button>
                  </>
                )}
                {user && isStudent && !hasApplied && !isOpenForApplication && (
                  <div style={{ width: '100%', background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: 10, padding: '14px', fontWeight: 700, fontSize: 14, textAlign: 'center' }}>
                    募集を終了しています
                  </div>
                )}
                {user && isStudent && hasApplied && (
                  <div style={{ width: '100%', background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', borderRadius: 10, padding: '14px', fontWeight: 700, fontSize: 14, textAlign: 'center' }}>
                    ✓ 応募済み
                  </div>
                )}
                {/* 企業詳細リンク */}
                {job.company_id && (
                  <button
                    onClick={() => router.push(`/companies/${job.company_id}`)}
                    style={{ width: '100%', background: '#FBF8F4', color: '#57514A', border: '1px solid #EFE8DF', borderRadius: 10, padding: '11px', fontFamily: FF, fontWeight: 600, fontSize: 12, cursor: 'pointer', marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F3EDE5')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#FBF8F4')}
                  >
                    🏢 この企業の詳細・求人情報を見る
                    <span style={{ color: '#C2B8AC' }}>›</span>
                  </button>
                )}
              </div>
            </div>

            {/* この求人の特徴 */}
            {((job.job_features && job.job_features.length > 0) || (job.work_conditions && job.work_conditions.length > 0)) && (
              <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: '18px 20px', marginBottom: 16 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#57514A', marginBottom: 12 }}>この求人の特徴</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {(job.work_conditions || []).map(c => (
                    <span key={c} style={{ fontSize: 11, background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', borderRadius: 5, padding: '3px 10px' }}>{c}</span>
                  ))}
                  {(job.job_features || []).map(f => (
                    <span key={f} style={{ fontSize: 11, background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A', borderRadius: 5, padding: '3px 10px' }}>{f}</span>
                  ))}
                </div>
              </div>
            )}

            {/* おすすめ求人 */}
            {relatedJobs.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: '18px 20px', marginBottom: 16 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#57514A', marginBottom: 14 }}>おすすめの求人</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {relatedJobs.map(r => (
                    <div
                      key={r.id}
                      onClick={() => router.push(`/jobs/${r.id}`)}
                      style={{ display: 'flex', gap: 10, cursor: 'pointer', borderRadius: 10, padding: '8px 6px', transition: '.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FBF8F4')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* サムネ */}
                      <div style={{ width: 60, height: 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(135deg,#F2620C,#FB8A3C)', position: 'relative' }}>
                        {r.cover_image_url
                          ? <img src={r.cover_image_url} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: r.cover_image_position || '50% 50%', display: 'block' }} />
                          : r.companies?.logo_url
                            ? <img src={r.companies.logo_url} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 6, display: 'block', background: '#fff' }} />
                            : null
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#1C1813', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>{r.job_title}</div>
                        <div style={{ fontSize: 11, color: '#938B81', marginTop: 3 }}>{r.companies?.company_name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 職種から探す */}
            <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: '18px 20px', marginBottom: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#57514A', marginBottom: 14 }}>職種から探す</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[
                  { label: 'コンサルティング', icon: '💼' },
                  { label: '経営・企画',        icon: '📊' },
                  { label: '金融・ファイナンス', icon: '💹' },
                  { label: 'マーケティング',    icon: '📣' },
                  { label: 'エンジニア',        icon: '💻' },
                  { label: 'デザイナー',        icon: '🎨' },
                  { label: '営業',              icon: '🤝' },
                  { label: 'ライター・メディア', icon: '✏️' },
                  { label: '経理',              icon: '🧾' },
                  { label: '人事・広報',        icon: '📢' },
                  { label: 'その他',            icon: '📁' },
                ].map(cat => (
                  <button
                    key={cat.label}
                    onClick={() => router.push(`/search?category=${encodeURIComponent(cat.label)}`)}
                    style={{ width: '100%', background: 'transparent', border: 'none', borderRadius: 8, padding: '9px 10px', fontFamily: FF, fontSize: 13, color: '#1C1813', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, transition: '.12s', textAlign: 'left', fontWeight: job.job_categories?.includes(cat.label) ? 800 : 500 }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FFF6EE')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontSize: 15 }}>{cat.icon}</span>
                    <span style={{ flex: 1 }}>{cat.label}</span>
                    {job.job_categories?.includes(cat.label) && (
                      <span style={{ fontSize: 10, background: '#F2620C', color: '#fff', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>この求人</span>
                    )}
                    <span style={{ color: '#C2B8AC', fontSize: 12 }}>›</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ナビリンク */}
            <button
              onClick={() => router.push('/search')}
              style={{ width: '100%', background: '#fff', color: '#1C1813', border: '1px solid #EFE8DF', borderRadius: 12, padding: '13px 16px', fontFamily: FF, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: '.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#FBF8F4')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
            >
              <span style={{ width: 32, height: 32, borderRadius: 8, background: '#FFF1E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🔍</span>
              <span>求人を探す</span>
              <span style={{ marginLeft: 'auto', color: '#C2B8AC' }}>›</span>
            </button>
          </div>

        </div>
      </div>

      {/* 応募確認モーダル */}
      {showApplyModal && (
        <div
          className="anim-fade"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animationDuration: '.25s' }}
          onClick={() => setShowApplyModal(false)}
        >
          <div
            className="anim-fade-up"
            style={{ background: '#fff', borderRadius: 20, padding: '36px 32px', maxWidth: 460, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,.2)', fontFamily: FF, animationDuration: '.35s' }}
            onClick={e => e.stopPropagation()}
          >
            {/* 企業ロゴ・求人名 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #EFE8DF' }}>
              {job.companies?.logo_url ? (
                <img src={job.companies.logo_url} alt="" style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'contain', border: '1px solid #EFE8DF', background: '#fff', padding: 4, flexShrink: 0 }} />
              ) : (
                <div style={{ width: 52, height: 52, borderRadius: 12, background: '#FFF1E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🏢</div>
              )}
              <div>
                <div style={{ fontSize: 12, color: '#938B81', marginBottom: 3 }}>{job.companies?.company_name}</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#1C1813', lineHeight: 1.4 }}>{job.job_title}</div>
              </div>
            </div>

            {/* 確認メッセージ */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 22, marginBottom: 12 }}>📩</div>
              <div style={{ fontWeight: 900, fontSize: 20, color: '#1C1813', marginBottom: 10 }}>この求人に応募しますか？</div>
              <p style={{ fontSize: 13, color: '#57514A', lineHeight: 1.8, margin: 0 }}>
                応募すると企業の担当者に通知が届きます。<br />
                プロフィールと連絡先メールアドレスが企業に共有されます。
              </p>
            </div>

            {/* 求人サマリー */}
            <div style={{ background: '#FBF8F4', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 20, fontSize: 13, color: '#57514A' }}>
              <span>📍 {job.location}</span>
              <span>💰 {job.salary}</span>
            </div>

            {/* 連絡先メールの確認 */}
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 8 }}>📧 選考連絡はこのメールに届きます</div>
              <input
                type="email"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                placeholder="example@university.ac.jp"
                style={{ width: '100%', border: '1px solid #FDE68A', borderRadius: 8, padding: '11px 14px', fontFamily: FF, fontSize: 14, color: '#1C1813', outline: 'none', boxSizing: 'border-box', background: '#fff' }}
                onFocus={e => (e.target.style.borderColor = '#F2620C')}
                onBlur={e => (e.target.style.borderColor = '#FDE68A')}
              />
              <p style={{ fontSize: 11, color: '#92400E', margin: '6px 0 0', lineHeight: 1.6 }}>
                間違いがないかご確認ください。変更するとプロフィールにも保存されます。
              </p>
              {job.companies?.contact_email && (
                <p style={{ fontSize: 12, color: '#92400E', margin: '10px 0 0', paddingTop: 10, borderTop: '1px dashed #FDE68A', lineHeight: 1.7 }}>
                  企業からの連絡は <strong style={{ wordBreak: 'break-all' }}>{job.companies.contact_email}</strong> から届きます。迷惑メールフォルダに振り分けられないようご注意ください。
                </p>
              )}
            </div>

            {/* ボタン */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                className="btn-primary"
                onClick={handleApply}
                disabled={isApplying}
                style={{ width: '100%', background: '#F2620C', color: '#fff', border: 'none', borderRadius: 12, padding: '15px', fontFamily: FF, fontWeight: 700, fontSize: 15, cursor: isApplying ? 'not-allowed' : 'pointer', opacity: isApplying ? 0.7 : 1, boxShadow: '0 4px 14px rgba(242,98,12,.3)' }}
              >
                {isApplying ? '応募中...' : '応募する'}
              </button>
              <button
                onClick={() => setShowApplyModal(false)}
                style={{ width: '100%', background: '#fff', color: '#57514A', border: '1px solid #EFE8DF', borderRadius: 12, padding: '14px', fontFamily: FF, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER（固定CTAに隠れないよう下に余白を確保） */}
      <div style={{ paddingBottom: isMobile ? 84 : 80 }}>
        <SiteFooter />
      </div>

      {/* STICKY BOTTOM CTA */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #EFE8DF', padding: isMobile ? '12px 16px' : '14px 48px', display: 'flex', alignItems: 'center', gap: 12, zIndex: 100, boxShadow: '0 -4px 20px rgba(28,24,19,.08)' }}>
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
              className="btn-primary"
              onClick={() => router.push(`/auth/login?redirect=/jobs/${jobId}`)}
              style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '0 28px', height: 48, fontFamily: FF, fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 14px rgba(242,98,12,.3)' }}
            >
              ログインして応募
            </button>
          )}
          {user && isStudent && !hasApplied && isOpenForApplication && (
            <button
              className="btn-primary"
              onClick={() => setShowApplyModal(true)}
              style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '0 28px', height: 48, fontFamily: FF, fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 14px rgba(242,98,12,.3)' }}
            >
              この求人に応募する
            </button>
          )}
          {user && isStudent && !hasApplied && !isOpenForApplication && (
            <button
              disabled
              style={{ background: '#EFE8DF', color: '#938B81', border: 'none', borderRadius: 10, padding: '0 28px', height: 48, fontFamily: FF, fontWeight: 700, fontSize: 14, cursor: 'not-allowed' }}
            >
              募集終了
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
