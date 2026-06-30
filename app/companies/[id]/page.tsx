'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

interface Company {
  id: string;
  company_name: string;
  industry: string;
  contact_email: string;
  description?: string;
  employee_count?: string;
  location?: string;
  website?: string;
  founded_year?: string;
  logo_url?: string;
}

interface Job {
  id: string;
  job_title: string;
  salary: string;
  location: string;
  job_categories: string[];
  status: string;
}

const FF = "'Zen Kaku Gothic New', sans-serif";
const MONO = "'IBM Plex Mono', monospace";

// Placeholder info shown when fields are empty
const PLACEHOLDER: Partial<Company> = {
  description: 'この企業はまだ会社概要を登録していません。求人詳細や企業サイトをご参照ください。',
  employee_count: '—',
  location: '—',
  website: '—',
  founded_year: '—',
};

export default function CompanyProfilePage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .single();

        if (companyError || !companyData) {
          setError('企業情報が見つかりません');
          setLoading(false);
          return;
        }
        setCompany(companyData as Company);

        const { data: jobData } = await supabase
          .from('jobs')
          .select('id, job_title, salary, location, job_categories, status')
          .eq('company_id', companyId)
          .in('status', ['published', 'paused'])
          .order('created_at', { ascending: false });

        setJobs((jobData as Job[]) || []);
      } catch {
        setError('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [companyId]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF8F4', fontFamily: FF }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: '3px solid #F2620C', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin .8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#57514A', fontSize: 15 }}>読み込み中...</p>
      </div>
    </div>
  );

  if (error || !company) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF8F4', fontFamily: FF }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 18, color: '#57514A', marginBottom: 20 }}>{error || '企業情報が見つかりません'}</p>
        <button onClick={() => router.push('/')} style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontFamily: FF, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>トップへ戻る</button>
      </div>
    </div>
  );

  const publishedJobs = jobs.filter(j => j.status === 'published');
  const pausedJobs = jobs.filter(j => j.status === 'paused');

  const get = (field: keyof Company) => company[field] || PLACEHOLDER[field] || '—';

  return (
    <div style={{ minHeight: '100vh', background: '#FBF8F4', fontFamily: FF, color: '#1C1813' }}>
      <link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;700;900&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* NAV */}
      <div style={{ background: 'rgba(255,255,255,.95)', borderBottom: '1px solid #EFE8DF', padding: '14px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 36, cursor: 'pointer' }} onClick={() => router.push('/')} />
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => router.push('/search')} style={{ background: '#fff', color: '#57514A', border: '1px solid #EFE8DF', borderRadius: 8, padding: '9px 18px', fontFamily: FF, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>求人を探す</button>
          <button onClick={() => router.push('/auth/signup')} style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontFamily: FF, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>無料で登録</button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px 80px' }}>
        {/* BREADCRUMB */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 13, color: '#938B81' }}>
          <span style={{ cursor: 'pointer', color: '#F2620C' }} onClick={() => router.push('/')}>トップ</span>
          <span>›</span>
          <span style={{ cursor: 'pointer', color: '#F2620C' }} onClick={() => router.push('/search')}>求人検索</span>
          <span>›</span>
          <span>{company.company_name}</span>
        </div>

        {/* COMPANY HEADER */}
        <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 18, overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ height: 5, background: 'linear-gradient(90deg,#F2620C,#FB8A3C)' }} />
          <div style={{ padding: '36px 40px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, marginBottom: 24 }}>
              {/* ロゴ */}
              {company.logo_url ? (
                <img src={company.logo_url} alt={company.company_name} style={{ width: 80, height: 80, borderRadius: 16, objectFit: 'contain', border: '1px solid #EFE8DF', background: '#fff', padding: 6, flexShrink: 0 }} />
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: 16, background: 'linear-gradient(135deg,#FFF1E8,#FFE0CC)', border: '1px solid #FBD5C0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>🏢</div>
              )}
              <div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: '#F2620C', letterSpacing: '.14em', marginBottom: 6 }}>{company.industry || '業種未登録'}</div>
                <h1 style={{ fontWeight: 900, fontSize: 28, margin: '0 0 10px', lineHeight: 1.3 }}>{company.company_name}</h1>
                <div style={{ display: 'flex', gap: 18, fontSize: 13, color: '#57514A', flexWrap: 'wrap' }}>
                  {company.location && <span>📍 {company.location}</span>}
                  {company.employee_count && <span>👥 {company.employee_count}名</span>}
                  {company.founded_year && <span>📅 設立 {company.founded_year}</span>}
                  <span style={{ color: publishedJobs.length > 0 ? '#15803D' : '#938B81', fontWeight: 700 }}>
                    💼 求人 {publishedJobs.length}件
                  </span>
                </div>
              </div>
            </div>

            {/* 会社概要 */}
            <div style={{ background: '#FBF8F4', borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ fontSize: 12, color: '#938B81', marginBottom: 8, fontFamily: MONO, letterSpacing: '.1em' }}>ABOUT</div>
              <p style={{ fontSize: 14, lineHeight: 1.9, color: '#3A352F', margin: 0 }}>
                {company.description || PLACEHOLDER.description}
              </p>
            </div>

            {/* 詳細情報グリッド */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 20 }}>
              {[
                { label: '業種', value: company.industry || '—' },
                { label: '従業員数', value: company.employee_count ? `${company.employee_count}名` : '—' },
                { label: '所在地', value: company.location || '—' },
                { label: '設立年', value: company.founded_year || '—' },
                { label: 'Webサイト', value: company.website || '—', link: company.website },
                { label: 'お問い合わせ', value: company.contact_email || '—' },
              ].map(item => (
                <div key={item.label} style={{ background: '#FBF8F4', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 11, color: '#938B81', marginBottom: 4 }}>{item.label}</div>
                  {item.link ? (
                    <a href={item.link} target="_blank" rel="noreferrer" style={{ fontWeight: 600, fontSize: 13, color: '#F2620C', textDecoration: 'none' }}>{item.value}</a>
                  ) : (
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#1C1813', wordBreak: 'break-all' }}>{item.value}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* JOB LISTINGS */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontWeight: 900, fontSize: 22, margin: 0 }}>
              この企業の求人
              <span style={{ fontFamily: MONO, fontSize: 13, color: '#938B81', fontWeight: 400, marginLeft: 10 }}>{jobs.length} 件</span>
            </h2>
          </div>

          {jobs.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
              <p style={{ color: '#938B81', fontSize: 15, margin: 0 }}>現在公開中の求人はありません</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {jobs.map(job => (
                <div
                  key={job.id}
                  onClick={() => router.push(`/jobs/${job.id}`)}
                  style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 14, padding: '22px 28px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 20, transition: '.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 28px rgba(28,24,19,.09)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
                >
                  <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 4, background: job.status === 'paused' ? '#9CA3AF' : '#F2620C', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 17 }}>{job.job_title}</div>
                      {job.status === 'paused' && (
                        <span style={{ fontSize: 10, fontWeight: 700, background: '#374151', color: '#fff', borderRadius: 4, padding: '2px 8px', fontFamily: MONO }}>募集停止</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#57514A', marginBottom: job.job_categories?.length ? 10 : 0 }}>
                      <span>📍 {job.location}</span>
                      <span>💰 {job.salary}</span>
                    </div>
                    {job.job_categories && job.job_categories.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {job.job_categories.slice(0, 4).map(cat => (
                          <span key={cat} style={{ fontSize: 11, background: '#FFF1E8', color: '#F2620C', border: '1px solid #FBD5C0', borderRadius: 4, padding: '2px 8px' }}>{cat}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 20, color: '#C2B8AC', flexShrink: 0 }}>›</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
