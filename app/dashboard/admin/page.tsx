'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { usePendingJobs } from '@/utils/useNotifications';
import { useIsMobile } from '@/utils/useIsMobile';
import { SITE_MODES, SITE_MODE_LABELS, type SiteMode } from '@/utils/siteMode';

interface User { id: string; email?: string; }
interface Stats { totalUsers: number; totalStudents: number; totalCompanies: number; totalJobs: number; totalApplications: number; }
type Tab = 'overview' | 'jobs' | 'companies' | 'students' | 'forms' | 'tags' | 'legal' | 'mail' | 'site';

const F = {
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#57514A', marginBottom: 8 } as React.CSSProperties,
  input: { width: '100%', border: '1px solid #EFE8DF', borderRadius: 10, padding: '12px 16px', fontFamily: "var(--font-sans)", fontSize: 14, color: '#1C1813', outline: 'none', boxSizing: 'border-box' as const },
};

export default function AdminDashboard() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [user, setUser] = useState<User | null>(null);
  const pendingJobCount = usePendingJobs();
  const [loading, setLoading] = useState(true);
  useEffect(() => { document.title = '管理ダッシュボード | トウコべインターン'; return () => { document.title = 'トウコべインターン'; }; }, []);
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalStudents: 0, totalCompanies: 0, totalJobs: 0, totalApplications: 0 });

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || session.user.email !== 'ru_matsumoto@manabiph.com') { router.push('/'); return; }
      setUser(session.user as User);

      const [{ count: s }, { count: c }, { count: j }, { count: a }] = await Promise.all([
        supabase.from('user_types').select('*', { count: 'exact', head: true }).eq('user_type', 'student'),
        supabase.from('user_types').select('*', { count: 'exact', head: true }).eq('user_type', 'company'),
        supabase.from('jobs').select('*', { count: 'exact', head: true }),
        supabase.from('applications').select('*', { count: 'exact', head: true }),
      ]);
      setStats({ totalUsers: (s || 0) + (c || 0), totalStudents: s || 0, totalCompanies: c || 0, totalJobs: j || 0, totalApplications: a || 0 });
      setLoading(false);
    }
    init();
  }, [router]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF8F4', fontFamily: "var(--font-sans)" }}>
      <div style={{ width: 36, height: 36, border: '2.5px solid #F2620C', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview', label: '概要' },
    { key: 'jobs', label: '求人承認' },
    { key: 'companies', label: '企業管理' },
    { key: 'students', label: '学生管理' },
    { key: 'forms', label: 'フォーム申し込み' },
    { key: 'tags', label: 'タグ管理' },
    { key: 'legal', label: '規約・ポリシー' },
    { key: 'mail', label: 'メール文面' },
    { key: 'site', label: 'サイト状態' },
  ];

  const STAT_CARDS = [
    { label: '総ユーザー数', val: stats.totalUsers, accent: '#1C1813' },
    { label: '学生', val: stats.totalStudents, accent: '#2563EB' },
    { label: '企業', val: stats.totalCompanies, accent: '#059669' },
    { label: '掲載求人', val: stats.totalJobs, accent: '#F2620C' },
    { label: '総応募数', val: stats.totalApplications, accent: '#7C3AED' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#FBF8F4', fontFamily: "var(--font-sans)", color: '#1C1813' }}>

      {/* NAV */}
      <div style={{ background: '#1C1813', padding: isMobile ? '14px 16px' : '14px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 34, width: 'auto', cursor: 'pointer' }} onClick={() => router.push('/')} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: '#FBA94C', background: 'rgba(251,169,76,.15)', padding: '3px 10px', borderRadius: 999 }}>ADMIN</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#9A9086' }}>{user?.email}</span>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} style={{ background: 'rgba(255,255,255,.08)', color: '#C9C0B6', border: 'none', borderRadius: 8, padding: '9px 18px', fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>ログアウト</button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '24px 12px 60px' : '40px 48px' }}>
        {/* TABS */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 36, background: '#fff', border: '1px solid #EFE8DF', borderRadius: 12, padding: 6, width: isMobile ? '100%' : 'fit-content', overflowX: isMobile ? 'auto' : undefined, flexWrap: isMobile ? 'nowrap' : undefined }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ border: 'none', borderRadius: 8, padding: '10px 24px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: '.2s', background: tab === t.key ? '#F2620C' : 'transparent', color: tab === t.key ? '#fff' : '#57514A', position: 'relative' }}>
              {t.label}
              {t.key === 'jobs' && pendingJobCount > 0 && (
                <span style={{ position: 'absolute', top: 4, right: 6, minWidth: 16, height: 16, background: '#E11D48', color: '#fff', borderRadius: 999, fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                  {pendingJobCount > 9 ? '9+' : pendingJobCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: '#F2620C', letterSpacing: '.14em', marginBottom: 12 }}>OVERVIEW</div>
            <h2 style={{ fontWeight: 900, fontSize: 24, margin: '0 0 24px' }}>サイト統計</h2>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(5,1fr)', gap: 16 }}>
              {STAT_CARDS.map(s => (
                <div key={s.label} style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 14, padding: '24px 20px' }}>
                  <div style={{ fontSize: 12, color: '#938B81', marginBottom: 10 }}>{s.label}</div>
                  <div style={{ fontWeight: 900, fontSize: isMobile ? 28 : 40, color: s.accent, lineHeight: 1 }}>{s.val}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* JOBS APPROVAL */}
        {tab === 'jobs' && <AdminJobsTab />}

        {/* COMPANIES */}
        {tab === 'companies' && <AdminCompaniesTab />}
        {tab === 'students' && <AdminStudentsTab />}

        {tab === 'forms' && <AdminFormsTab />}
        {tab === 'tags' && <AdminTagsTab />}
        {tab === 'legal' && <AdminLegalTab />}
        {tab === 'mail' && <AdminMailTab />}
        {tab === 'site' && <AdminSiteTab />}
      </div>
    </div>
  );
}

function AdminJobsTab() {
  const isMobile = useIsMobile();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => { loadJobs(); }, []);

  const loadJobs = async () => {
    // featured カラム未追加の環境（マイグレーション未実行）でも動くようフォールバック
    let jobsData: any[] | null = (await supabase
      .from('jobs')
      .select('id, job_title, salary, location, status, created_at, company_id, featured')
      .order('created_at', { ascending: false })).data;
    if (!jobsData) {
      jobsData = (await supabase
        .from('jobs')
        .select('id, job_title, salary, location, status, created_at, company_id')
        .order('created_at', { ascending: false })).data;
    }
    if (!jobsData) { setLoading(false); return; }

    const companyIds = [...new Set(jobsData.map((j: any) => j.company_id).filter(Boolean))];
    const { data: companies } = companyIds.length > 0
      ? await supabase.from('companies').select('id, company_name').in('id', companyIds)
      : { data: [] };
    const coMap: Record<string, string> = {};
    (companies || []).forEach((c: any) => { coMap[c.id] = c.company_name; });

    setJobs(jobsData.map((j: any) => ({ ...j, companies: { company_name: coMap[j.company_id] || '—' } })));
    setLoading(false);
  };

  const handleApprove = async (jobId: string) => {
    const { error } = await supabase.from('jobs').update({ status: 'published' }).eq('id', jobId);
    if (error) { showToast('承認に失敗しました', 'error'); return; }
    showToast('承認しました');
    setJobs(jobs.map(j => j.id === jobId ? { ...j, status: 'published' } : j));
  };

  const handleReject = async (jobId: string) => {
    const { error } = await supabase.from('jobs').update({ status: 'draft' }).eq('id', jobId);
    if (error) { showToast('差し戻しに失敗しました', 'error'); return; }
    setJobs(jobs.map(j => j.id === jobId ? { ...j, status: 'draft' } : j));
  };

  const handleToggleFeatured = async (jobId: string, current: boolean) => {
    const { error } = await supabase.from('jobs').update({ featured: !current }).eq('id', jobId);
    if (error) { showToast('変更に失敗しました（featured用のSQLが未実行の可能性）', 'error'); return; }
    showToast(!current ? '注目求人に設定しました' : '注目求人を解除しました');
    setJobs(jobs.map(j => j.id === jobId ? { ...j, featured: !current } : j));
  };

  const STATUS_MAP: Record<string, { text: string; bg: string; color: string }> = {
    published: { text: '公開中',   bg: '#F0FDF4', color: '#15803D' },
    pending:   { text: '承認待ち', bg: '#FFFBEB', color: '#B45309' },
    paused:    { text: '募集停止', bg: '#F3F4F6', color: '#374151' },
    draft:     { text: '非公開',   bg: '#F3F4F6', color: '#6B7280' },
  };

  const displayed = filter === 'pending' ? jobs.filter(j => j.status === 'pending') : jobs;
  const pendingCount = jobs.filter(j => j.status === 'pending').length;

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div style={{ width: 36, height: 36, border: '2.5px solid #F2620C', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /><style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style></div>;

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: toast.type === 'error' ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${toast.type === 'error' ? '#FECACA' : '#BBF7D0'}`, color: toast.type === 'error' ? '#B91C1C' : '#15803D', borderRadius: 12, padding: '14px 24px', fontWeight: 700, fontSize: 14, boxShadow: '0 8px 32px rgba(0,0,0,.12)', whiteSpace: 'nowrap' }}>
          {toast.type === 'success' ? '✓ ' : '✕ '}{toast.msg}
        </div>
      )}
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: '#F2620C', letterSpacing: '.14em', marginBottom: 12 }}>JOB APPROVAL</div>
      <h2 style={{ fontWeight: 900, fontSize: 24, margin: '0 0 24px' }}>求人承認管理</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button onClick={() => setFilter('pending')}
          style={{ border: filter === 'pending' ? 'none' : '1px solid #EFE8DF', background: filter === 'pending' ? '#F2620C' : '#fff', color: filter === 'pending' ? '#fff' : '#57514A', borderRadius: 8, padding: '10px 20px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, cursor: 'pointer' } as React.CSSProperties}>
          承認待ち（{pendingCount}）
        </button>
        <button onClick={() => setFilter('all')}
          style={{ border: filter === 'all' ? 'none' : '1px solid #EFE8DF', background: filter === 'all' ? '#F2620C' : '#fff', color: filter === 'all' ? '#fff' : '#57514A', borderRadius: 8, padding: '10px 20px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, cursor: 'pointer' } as React.CSSProperties}>
          全件（{jobs.length}）
        </button>
      </div>

      {displayed.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: isMobile ? '32px 16px' : '48px', textAlign: 'center' }}>
          <p style={{ color: '#938B81', fontSize: 15, margin: 0 }}>{filter === 'pending' ? '承認待ちの求人はありません' : '求人がありません'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {displayed.map(j => {
            const s = STATUS_MAP[j.status] || STATUS_MAP.draft;
            return (
              <div key={j.id} style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 4, background: j.status === 'pending' ? '#F59E0B' : j.status === 'published' ? '#22C55E' : '#9CA3AF' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{j.job_title}</div>
                  <div style={{ fontSize: 12, color: '#938B81', display: 'flex', gap: 14 }}>
                    <span>{(j.companies as any)?.company_name || '—'}</span>
                    <span>📍 {j.location}</span>
                    <span>💰 {j.salary}</span>
                    <span>{new Date(j.created_at).toLocaleDateString('ja-JP')}</span>
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 999, background: s.bg, color: s.color, flexShrink: 0 }}>{s.text}</span>
                {j.status === 'published' && (
                  <button onClick={() => handleToggleFeatured(j.id, !!j.featured)} title="トップページの「注目の長期インターン」に優先表示します"
                    style={{ background: j.featured ? '#FFF1E8' : '#fff', color: j.featured ? '#C2530A' : '#938B81', border: `1.5px solid ${j.featured ? '#F2620C' : '#EFE8DF'}`, borderRadius: 999, padding: '6px 14px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 12, cursor: 'pointer', flexShrink: 0, transition: '.15s' }}>
                    {j.featured ? '★ 注目中' : '☆ 注目にする'}
                  </button>
                )}
                {j.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => handleApprove(j.id)}
                      style={{ background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', borderRadius: 8, padding: '8px 18px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                      承認
                    </button>
                    <button onClick={() => handleReject(j.id)}
                      style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 18px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                      差し戻し
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AdminCompaniesTab() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // 求人管理モーダル（管理者が企業の求人を作成・編集）
  const [jobsFor, setJobsFor] = useState<any | null>(null);
  const [companyJobs, setCompanyJobs] = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const openJobs = async (c: any) => {
    setJobsFor(c); setJobsLoading(true); setCompanyJobs([]);
    const { data } = await supabase.from('jobs').select('id, job_title, status, created_at').eq('company_id', c.id).order('created_at', { ascending: false });
    setCompanyJobs(data || []); setJobsLoading(false);
  };
  const JOB_STATUS: Record<string, string> = { published: '公開中', pending: '承認待ち', paused: '募集停止', draft: '非公開' };
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ company_name: '', industry: '', contact_email: '', login_email: '', temp_password: '' });
  // 直近に発行したログイン情報（この画面でしか見られないため、閉じる前に企業へ共有する）
  const [created, setCreated] = useState<{ company_name: string; login_email: string; temp_password: string } | null>(null);
  const [copiedCred, setCopiedCred] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ company_name: '', industry: '', contact_email: '' });
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => { loadCompanies(); }, []);

  const loadCompanies = async () => {
    const { data } = await supabase.from('companies').select('*').order('created_at', { ascending: false });
    setCompanies(data || []);
    setLoading(false);
  };

  // 読み間違いにくい文字だけで仮パスワードを生成する
  const generatePassword = () => {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const buf = new Uint32Array(12);
    crypto.getRandomValues(buf);
    return Array.from(buf, n => chars[n % chars.length]).join('');
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('認証セッションが見つかりません');
      const res = await fetch('/api/admin/create-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ ...form, temp_password: form.temp_password || undefined }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || '追加に失敗しました');
      setCreated({ company_name: form.company_name, login_email: result.login_email, temp_password: result.temp_password });
      setCopiedCred(false);
      setForm({ company_name: '', industry: '', contact_email: '', login_email: '', temp_password: '' });
      setShowForm(false);
      loadCompanies();
    } catch (err: any) { showToast('追加に失敗しました: ' + err.message, 'error'); }
  };

  const copyCredentials = () => {
    if (!created) return;
    const text = `【トウコべインターン】企業アカウントのご案内\n\nログインページ: ${process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/auth/company-login\nログインメール: ${created.login_email}\n仮パスワード: ${created.temp_password}\n\n初回ログイン後、ダッシュボード右上の「パスワード変更」から必ずパスワードを変更してください。`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedCred(true);
      setTimeout(() => setCopiedCred(false), 2000);
    });
  };

  const handleEditOpen = (c: any) => {
    setEditingCompany(c);
    setEditForm({ company_name: c.company_name || '', industry: c.industry || '', contact_email: c.contact_email || '' });
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;
    const { error } = await supabase.from('companies').update(editForm).eq('id', editingCompany.id);
    if (error) { showToast('更新に失敗しました', 'error'); return; }
    showToast('更新しました');
    setCompanies(companies.map(c => c.id === editingCompany.id ? { ...c, ...editForm } : c));
    setEditingCompany(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？\n※関連する求人・応募データも削除されます`)) return;
    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (error) { showToast('削除に失敗しました: ' + error.message, 'error'); return; }
    showToast('削除しました');
    setCompanies(companies.filter(c => c.id !== id));
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div style={{ width: 36, height: 36, border: '2.5px solid #F2620C', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /></div>;

  const F2 = { label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#57514A', marginBottom: 8 } as React.CSSProperties, input: { width: '100%', border: '1px solid #EFE8DF', borderRadius: 10, padding: '12px 16px', fontFamily: "var(--font-sans)", fontSize: 14, color: '#1C1813', outline: 'none', boxSizing: 'border-box' as const } };

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: toast.type === 'error' ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${toast.type === 'error' ? '#FECACA' : '#BBF7D0'}`, color: toast.type === 'error' ? '#B91C1C' : '#15803D', borderRadius: 12, padding: '14px 24px', fontWeight: 700, fontSize: 14, boxShadow: '0 8px 32px rgba(0,0,0,.12)', whiteSpace: 'nowrap' }}>
          {toast.type === 'success' ? '✓ ' : '✕ '}{toast.msg}
        </div>
      )}
      {/* 求人管理モーダル（管理者が企業の求人を作成・編集） */}
      {jobsFor && (
        <div onClick={() => setJobsFor(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <h3 style={{ fontWeight: 900, fontSize: 18, margin: 0 }}>{jobsFor.company_name} の求人</h3>
              <button onClick={() => setJobsFor(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#938B81' }}>✕</button>
            </div>
            <p style={{ fontSize: 12.5, color: '#938B81', margin: '0 0 18px' }}>管理者として、この企業の求人を新規作成・編集できます。</p>
            <button onClick={() => router.push(`/dashboard/post-job?company=${jobsFor.id}`)} style={{ width: '100%', background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, cursor: 'pointer', marginBottom: 18 }}>＋ この企業の求人を新規作成</button>
            {jobsLoading ? (
              <div style={{ textAlign: 'center', padding: 24, color: '#938B81' }}>読み込み中...</div>
            ) : companyJobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: '#938B81', fontSize: 14 }}>まだ求人がありません</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {companyJobs.map(j => (
                  <div key={j.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, border: '1px solid #EFE8DF', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.job_title}</div>
                      <div style={{ fontSize: 11, color: '#938B81' }}>{JOB_STATUS[j.status] || j.status}</div>
                    </div>
                    <button onClick={() => router.push(`/dashboard/edit-job/${j.id}`)} style={{ flexShrink: 0, background: '#FFF1E8', color: '#F2620C', border: '1px solid #FBD5C0', borderRadius: 8, padding: '7px 16px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>編集</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {/* 編集モーダル */}
      {editingCompany && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '32px', width: '100%', maxWidth: 480, boxShadow: '0 24px 60px rgba(0,0,0,.2)' }}>
            <h3 style={{ fontWeight: 900, fontSize: 18, margin: '0 0 24px' }}>企業情報を編集</h3>
            <form onSubmit={handleEditSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><label style={F2.label}>企業名 *</label><input style={F2.input} value={editForm.company_name} onChange={e => setEditForm({ ...editForm, company_name: e.target.value })} required onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} /></div>
              <div><label style={F2.label}>業種 *</label><input style={F2.input} value={editForm.industry} onChange={e => setEditForm({ ...editForm, industry: e.target.value })} required onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} /></div>
              <div><label style={F2.label}>企業メール *</label><input style={F2.input} type="email" value={editForm.contact_email} onChange={e => setEditForm({ ...editForm, contact_email: e.target.value })} required onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} /></div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="submit" style={{ flex: 1, background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>保存</button>
                <button type="button" onClick={() => setEditingCompany(null)} style={{ flex: 1, background: '#F3EEE7', color: '#57514A', border: 'none', borderRadius: 10, padding: '13px', fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>キャンセル</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 発行したログイン情報（この画面を閉じると仮パスワードは再表示できない） */}
      {created && (
        <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 16, padding: '24px 28px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <h3 style={{ fontWeight: 900, fontSize: 16, margin: '0 0 4px', color: '#15803D' }}>✓ 企業アカウントを発行しました — {created.company_name}</h3>
              <p style={{ fontSize: 12.5, color: '#57514A', margin: '0 0 14px' }}>仮パスワードは<b>この画面でしか確認できません</b>。閉じる前に「案内文をコピー」して企業の担当者に共有してください。</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: "var(--font-mono)", fontSize: 14 }}>
                <div><span style={{ fontSize: 12, color: '#938B81', fontFamily: "var(--font-sans)", marginRight: 8 }}>ログインメール:</span>{created.login_email}</div>
                <div><span style={{ fontSize: 12, color: '#938B81', fontFamily: "var(--font-sans)", marginRight: 8 }}>仮パスワード:</span><b>{created.temp_password}</b></div>
              </div>
            </div>
            <button onClick={() => setCreated(null)} style={{ background: 'none', border: 'none', color: '#938B81', fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={copyCredentials} style={{ background: copiedCred ? '#15803D' : '#fff', color: copiedCred ? '#fff' : '#15803D', border: '1.5px solid #15803D', borderRadius: 8, padding: '9px 20px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: '.2s' }}>
              {copiedCred ? 'コピーしました ✓' : '案内文をコピー'}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: '#F2620C', letterSpacing: '.14em', marginBottom: 6 }}>COMPANIES</div>
          <h2 style={{ fontWeight: 900, fontSize: 24, margin: 0 }}>企業管理 ({companies.length}社)</h2>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          {showForm ? 'キャンセル' : '+ 企業を追加'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: '28px 32px', marginBottom: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, margin: '0 0 20px' }}>新規企業登録</h3>
          <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <div><label style={F2.label}>企業名 *</label><input style={F2.input} value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} required onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} /></div>
            <div><label style={F2.label}>業種 *</label><input style={F2.input} value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} required onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} /></div>
            <div><label style={F2.label}>企業メール *</label><input style={F2.input} type="email" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} required onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} /></div>
            <div><label style={F2.label}>ログインメール *</label><input style={F2.input} type="email" value={form.login_email} onChange={e => setForm({ ...form, login_email: e.target.value })} required onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} /></div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={F2.label}>仮パスワード（8文字以上・空欄なら自動生成）</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input style={{ ...F2.input, fontFamily: "var(--font-mono)" }} value={form.temp_password} onChange={e => setForm({ ...form, temp_password: e.target.value })} minLength={8} placeholder="空欄のまま登録すると自動生成されます" onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} />
                <button type="button" onClick={() => setForm({ ...form, temp_password: generatePassword() })} style={{ background: '#fff', color: '#F2620C', border: '1.5px solid #F2620C', borderRadius: 10, padding: '0 18px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>自動生成</button>
              </div>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <button type="submit" style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 32px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>企業を登録する</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#FBF8F4' }}>
              {['企業名', '業種', 'メールアドレス', '操作'].map(h => (
                <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#938B81', borderBottom: '1px solid #EFE8DF' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {companies.map((c, i) => (
              <tr key={c.id} style={{ borderBottom: i < companies.length - 1 ? '1px solid #EFE8DF' : 'none' }}>
                <td style={{ padding: '16px 20px', fontWeight: 700, fontSize: 14 }}>{c.company_name}</td>
                <td style={{ padding: '16px 20px', fontSize: 13, color: '#57514A' }}>{c.industry}</td>
                <td style={{ padding: '16px 20px', fontSize: 13, color: '#57514A', fontFamily: "var(--font-mono)" }}>{c.contact_email}</td>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span onClick={() => openJobs(c)} style={{ fontSize: 13, color: '#1D4ED8', fontWeight: 700, cursor: 'pointer' }}>求人管理</span>
                    <span onClick={() => handleEditOpen(c)} style={{ fontSize: 13, color: '#F2620C', fontWeight: 700, cursor: 'pointer' }}>編集</span>
                    <span onClick={() => handleDelete(c.id, c.company_name)} style={{ fontSize: 13, color: '#B91C1C', fontWeight: 700, cursor: 'pointer' }}>削除</span>
                  </div>
                </td>
              </tr>
            ))}
            {companies.length === 0 && (
              <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#938B81', fontSize: 14 }}>企業がまだ登録されていません</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminTagsTab() {
  const [tags, setTags] = useState<{ name: string; sort: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTag, setNewTag] = useState('');
  const [tableMissing, setTableMissing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = () => {
    supabase.from('feature_tag_options').select('name, sort').order('sort', { ascending: true }).then(({ data, error }) => {
      if (error) { setTableMissing(true); setLoading(false); return; }
      setTags(data || []); setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    const name = newTag.trim();
    if (!name) return;
    if (tags.some(t => t.name === name)) { showToast('同じタグが既にあります', 'error'); return; }
    const sort = (tags.reduce((m, t) => Math.max(m, t.sort), 0) || 0) + 10;
    const { error } = await supabase.from('feature_tag_options').insert([{ name, sort }]);
    if (error) { showToast('追加に失敗しました: ' + error.message, 'error'); return; }
    setTags([...tags, { name, sort }]); setNewTag('');
    showToast('タグを追加しました');
  };
  const remove = async (name: string) => {
    if (!confirm(`タグ「${name}」を削除しますか？`)) return;
    const { error } = await supabase.from('feature_tag_options').delete().eq('name', name);
    if (error) { showToast('削除に失敗しました', 'error'); return; }
    setTags(tags.filter(t => t.name !== name));
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div style={{ width: 36, height: 36, border: '2.5px solid #F2620C', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /><style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style></div>;

  if (tableMissing) return (
    <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 16, padding: '28px 32px' }}>
      <h3 style={{ fontWeight: 700, fontSize: 16, margin: '0 0 10px', color: '#B45309' }}>初期設定が必要です</h3>
      <p style={{ fontSize: 14, color: '#57514A', lineHeight: 1.9, margin: 0 }}>
        タグ管理を使うには、Supabase → SQL Editor で <code style={{ background: '#FFF', padding: '2px 8px', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 12 }}>sql/2026-07-15_feature_tags.sql</code> を実行してください。実行後にこのページを再読み込みしてください。
      </p>
    </div>
  );

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: toast.type === 'error' ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${toast.type === 'error' ? '#FECACA' : '#BBF7D0'}`, color: toast.type === 'error' ? '#B91C1C' : '#15803D', borderRadius: 12, padding: '14px 24px', fontWeight: 700, fontSize: 14, boxShadow: '0 8px 32px rgba(0,0,0,.12)' }}>
          {toast.type === 'success' ? '✓ ' : '✕ '}{toast.msg}
        </div>
      )}
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: '#F2620C', letterSpacing: '.14em', marginBottom: 12 }}>FEATURE TAGS</div>
      <h2 style={{ fontWeight: 900, fontSize: 24, margin: '0 0 8px' }}>タグ管理 ({tags.length})</h2>
      <p style={{ fontSize: 13, color: '#938B81', margin: '0 0 24px' }}>ここで管理するタグが、求人投稿フォームの候補・検索チップ・トップページの人気タグに使われます。</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, maxWidth: 480 }}>
        <input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add(); }} placeholder="新しいタグ名（例: フルリモート）"
          style={{ flex: 1, border: '1px solid #EFE8DF', borderRadius: 10, padding: '11px 16px', fontFamily: "var(--font-sans)", fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
        <button onClick={add} style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '0 24px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>追加</button>
      </div>

      {tags.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: 40, textAlign: 'center', color: '#938B81' }}>タグがありません。上のフォームから追加してください。</div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {tags.map(t => (
            <span key={t.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#F5F3FF', color: '#6D28D9', border: '1px solid #DDD6FE', borderRadius: 999, padding: '8px 14px', fontSize: 13, fontWeight: 600 }}>
              #{t.name}
              <button onClick={() => remove(t.name)} title="削除" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6D28D9', padding: 0, lineHeight: 1, fontSize: 16, fontWeight: 900 }}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminStudentsTab() {
  const isMobile = useIsMobile();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<any | null>(null);

  useEffect(() => {
    supabase.from('student_profiles').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setRows(data || []); setLoading(false); });
  }, []);

  const filtered = rows.filter(r => {
    if (!q.trim()) return true;
    const hay = `${r.name || ''} ${r.university || ''} ${r.department || ''} ${r.contact_email || ''} ${r.university_email || ''}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  const exportCsv = () => {
    const headers = ['氏名', '大学', '学部学科', '学年', '卒業予定年', '講師登録', '連絡用メール', '大学メール', '語学', 'その他スキル', '資格', '登録日'];
    const csv = [headers.join(',')].concat(filtered.map(r => [
      r.name, r.university, r.department, r.grade, r.graduation_year, r.is_tutor ? 'あり' : '', r.contact_email, r.university_email,
      (r.languages || []).join(' / '), (r.skills || []).join(' / '), (r.certifications || '').replace(/\n/g, ' '),
      r.created_at ? new Date(r.created_at).toLocaleDateString('ja-JP') : '',
    ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `students_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div style={{ width: 36, height: 36, border: '2.5px solid #F2620C', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /><style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style></div>;

  return (
    <div>
      {/* 詳細モーダル */}
      {open && (
        <div onClick={() => setOpen(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 520, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <h3 style={{ fontWeight: 900, fontSize: 20, margin: 0 }}>{open.name || '（氏名なし）'}</h3>
              <button onClick={() => setOpen(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#938B81' }}>✕</button>
            </div>
            {[
              ['大学', open.university], ['学部・学科', open.department], ['学年', open.grade],
              ['卒業予定年', open.graduation_year ? `${open.graduation_year}年` : '—'],
              ['講師登録', open.is_tutor ? '✓ あり' : '—'],
              ['生年月日', open.birth_date], ['連絡用メール', open.contact_email], ['大学メール（在学確認用）', open.university_email],
              ['語学', (open.languages || []).join('、') || '—'], ['その他スキル', (open.skills || []).join('、') || '—'],
              ['資格・検定', open.certifications || '—'], ['経歴・自己紹介', open.experience || '—'],
            ].map(([k, v]) => (
              <div key={k as string} style={{ padding: '10px 0', borderBottom: '1px solid #F3EEE7' }}>
                <div style={{ fontSize: 11, color: '#938B81', marginBottom: 3 }}>{k}</div>
                <div style={{ fontSize: 14, color: '#1C1813', whiteSpace: 'pre-wrap' }}>{v || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: '#F2620C', letterSpacing: '.14em', marginBottom: 6 }}>STUDENTS</div>
          <h2 style={{ fontWeight: 900, fontSize: 24, margin: 0 }}>学生管理 ({rows.length}名)</h2>
        </div>
        <button onClick={exportCsv} style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>CSVエクスポート</button>
      </div>

      <input value={q} onChange={e => setQ(e.target.value)} placeholder="氏名・大学・メールで検索" style={{ width: '100%', border: '1px solid #EFE8DF', borderRadius: 10, padding: '11px 16px', fontFamily: "var(--font-sans)", fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 16 }} />

      {filtered.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: 48, textAlign: 'center', color: '#938B81' }}>該当する学生がいません</div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, overflow: 'hidden', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? 560 : undefined }}>
            <thead>
              <tr style={{ background: '#FBF8F4' }}>
                {['氏名', '大学', '学年', '卒業予定', '講師', '連絡先', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#938B81', borderBottom: '1px solid #EFE8DF', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #EFE8DF' : 'none' }}>
                  <td style={{ padding: '13px 16px', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>{r.name || '—'}</td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: '#57514A', whiteSpace: 'nowrap' }}>{r.university || '—'}</td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: '#57514A', whiteSpace: 'nowrap' }}>{r.grade || '—'}</td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: '#57514A', whiteSpace: 'nowrap' }}>{r.graduation_year ? `${r.graduation_year}年` : '—'}</td>
                  <td style={{ padding: '13px 16px', fontSize: 13, whiteSpace: 'nowrap' }}>{r.is_tutor ? '✓' : '—'}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: '#57514A', fontFamily: "var(--font-mono)" }}>{r.contact_email || '—'}</td>
                  <td style={{ padding: '13px 16px' }}><span onClick={() => setOpen(r)} style={{ fontSize: 13, color: '#F2620C', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>詳細</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const FORM_STATUS = {
  new:         { label: '未対応',   bg: '#FFF1EE', color: '#C2390A', border: '#FBCFBE' },
  in_progress: { label: '対応中',   bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
  done:        { label: '対応済み', bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
};

function AdminFormsTab() {
  const isMobile = useIsMobile();
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [memoEditing, setMemoEditing] = useState<Record<string, string>>({});
  const [savingMemo, setSavingMemo] = useState<Record<string, boolean>>({});
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});

  const load = () => {
    supabase
      .from('form_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setRows(data || []); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingStatus(p => ({ ...p, [id]: true }));
    await supabase.from('form_submissions').update({ status }).eq('id', id);
    setRows(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    setUpdatingStatus(p => ({ ...p, [id]: false }));
  };

  const saveMemo = async (id: string) => {
    const memo = memoEditing[id] ?? '';
    setSavingMemo(p => ({ ...p, [id]: true }));
    await supabase.from('form_submissions').update({ admin_memo: memo }).eq('id', id);
    setRows(prev => prev.map(r => r.id === id ? { ...r, admin_memo: memo } : r));
    setSavingMemo(p => ({ ...p, [id]: false }));
    setMemoEditing(p => { const n = { ...p }; delete n[id]; return n; });
  };

  const FORM_LABEL: Record<string, string> = { early: '早期申し込み', normal: '通常申し込み', material: '資料請求', contact: 'お問い合わせ' };

  const exportCsv = () => {
    const headers = ['フォーム種別', '企業名', '担当者名/お名前', '電話番号', 'メール（法務/返信先）', '請求先メール', 'アカウントメール', '情報源/お問い合わせ種別', '内容・要望', 'ステータス', '管理メモ', '申し込み日時'];
    const target = rows.filter(r => (filterStatus === 'all' || (r.status || 'new') === filterStatus) && (filterType === 'all' || r.form_type === filterType));
    const csvRows = target.map(r => [
      FORM_LABEL[r.form_type] || r.form_type,
      r.company_name || '', r.contact_name || '', r.phone || '', r.legal_email || '',
      r.billing_email || '', r.account_email || '', r.source || '',
      (r.notes || '').replace(/\n/g, ' '),
      FORM_STATUS[r.status as keyof typeof FORM_STATUS]?.label || r.status || '未対応',
      (r.admin_memo || '').replace(/\n/g, ' '),
      r.created_at ? new Date(r.created_at).toLocaleString('ja-JP') : '',
    ].map(v => `"${v.replace(/"/g, '""')}"`).join(','));
    const blob = new Blob(['﻿' + [headers.join(','), ...csvRows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `form_submissions_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const typeBadge = (type: string) => {
    const map: Record<string, { label: string; bg: string; color: string }> = {
      early:    { label: '早期申し込み', bg: '#FFF1E8', color: '#C2390A' },
      normal:   { label: '通常申し込み', bg: '#EFF6FF', color: '#1D4ED8' },
      material: { label: '資料請求',     bg: '#F0FDF4', color: '#15803D' },
      contact:  { label: 'お問い合わせ', bg: '#F5F3FF', color: '#6D28D9' },
    };
    const s = map[type] || { label: type, bg: '#F3F4F6', color: '#374151' };
    return <span style={{ fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, borderRadius: 999, padding: '3px 10px', whiteSpace: 'nowrap' as const }}>{s.label}</span>;
  };

  // 共有用リンクのベースURL: NEXT_PUBLIC_SITE_URL があれば固定、なければ今開いているサイトのURL
  const SITE = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyLink = (path: string, key: string) => {
    navigator.clipboard.writeText(`${SITE}${path}`).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  const byType = filterType === 'all' ? rows : rows.filter(r => r.form_type === filterType);
  const filtered = filterStatus === 'all' ? byType : byType.filter(r => (r.status || 'new') === filterStatus);
  const counts = { all: byType.length, new: byType.filter(r => !r.status || r.status === 'new').length, in_progress: byType.filter(r => r.status === 'in_progress').length, done: byType.filter(r => r.status === 'done').length };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#938B81' }}>読み込み中...</div>;

  const FORM_LINKS = [
    { key: 'early',    path: '/forms/early',    label: '早期申し込み', bg: '#FFF1E8', color: '#C2390A', border: 'rgba(194,57,10,.2)' },
    { key: 'normal',   path: '/forms/normal',   label: '通常申し込み', bg: '#EFF6FF', color: '#1D4ED8', border: 'rgba(29,78,216,.2)' },
    { key: 'material', path: '/forms/material', label: '資料請求',     bg: '#F0FDF4', color: '#15803D', border: 'rgba(21,128,61,.2)' },
    { key: 'contact',  path: '/forms/contact',  label: 'お問い合わせ', bg: '#F5F3FF', color: '#6D28D9', border: 'rgba(109,40,217,.2)' },
  ];

  return (
    <div>
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: '#F2620C', letterSpacing: '.14em', marginBottom: 4 }}>FORMS</div>
          <h2 style={{ fontWeight: 900, fontSize: 22, margin: 0 }}>フォーム申し込み管理</h2>
        </div>
        <button onClick={exportCsv} style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>CSVエクスポート</button>
      </div>

      {/* フォームリンク */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: 10, marginBottom: 20 }}>
        {FORM_LINKS.map(f => (
          <div key={f.key} style={{ background: f.bg, border: `1px solid ${f.border}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: f.color, marginBottom: 8 }}>{f.label}</div>
            <div style={{ fontSize: 11, color: '#938B81', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "var(--font-mono)" }}>
              {SITE}{f.path}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => copyLink(f.path, f.key)}
                style={{ flex: 1, fontSize: 12, fontWeight: 700, background: copiedKey === f.key ? f.color : '#fff', color: copiedKey === f.key ? '#fff' : f.color, border: `1.5px solid ${f.border}`, borderRadius: 7, padding: '7px 0', cursor: 'pointer', transition: '.2s' }}>
                {copiedKey === f.key ? 'コピー済み ✓' : 'リンクをコピー'}
              </button>
              <button onClick={() => window.open(f.path, '_blank')}
                style={{ fontSize: 12, fontWeight: 700, background: '#fff', color: '#57514A', border: '1px solid #EFE8DF', borderRadius: 7, padding: '7px 12px', cursor: 'pointer' }}>
                ↗
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 種別フィルター */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#938B81', marginRight: 4 }}>種別：</span>
        {([['all', 'すべて'], ['early', '早期申し込み'], ['normal', '通常申し込み'], ['material', '資料請求'], ['contact', 'お問い合わせ']] as const).map(([key, label]) => {
          const n = key === 'all' ? rows.length : rows.filter(r => r.form_type === key).length;
          const active = filterType === key;
          return (
            <button key={key} onClick={() => setFilterType(key)}
              style={{ border: active ? '2px solid #F2620C' : '1px solid #EFE8DF', background: active ? '#FFF1E8' : '#fff', color: active ? '#F2620C' : '#57514A', borderRadius: 999, padding: '6px 14px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              {label}
              <span style={{ fontSize: 10, fontWeight: 700, background: active ? '#F2620C' : '#F3EEE7', color: active ? '#fff' : '#938B81', borderRadius: 999, padding: '1px 6px' }}>{n}</span>
            </button>
          );
        })}
      </div>

      {/* ステータスフィルター */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {([['all', 'すべて'], ['new', '未対応'], ['in_progress', '対応中'], ['done', '対応済み']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setFilterStatus(key)}
            style={{ border: filterStatus === key ? '2px solid #F2620C' : '1px solid #EFE8DF', background: filterStatus === key ? '#FFF1E8' : '#fff', color: filterStatus === key ? '#F2620C' : '#57514A', borderRadius: 999, padding: '7px 16px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {label}
            <span style={{ fontSize: 11, fontWeight: 700, background: filterStatus === key ? '#F2620C' : '#F3EEE7', color: filterStatus === key ? '#fff' : '#938B81', borderRadius: 999, padding: '1px 7px' }}>{counts[key]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
          <p style={{ fontSize: 15, color: '#938B81', margin: 0 }}>{filterStatus === 'all' ? 'まだ申し込みはありません' : 'このステータスの申し込みはありません'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((r) => {
            const st = FORM_STATUS[(r.status || 'new') as keyof typeof FORM_STATUS] || FORM_STATUS.new;
            const isEditingMemo = r.id in memoEditing;
            const memoVal = isEditingMemo ? memoEditing[r.id] : (r.admin_memo || '');
            return (
              <div key={r.id} style={{ background: '#fff', border: `1px solid ${st.border}`, borderLeft: `4px solid ${st.color}`, borderRadius: 14, padding: isMobile ? '16px' : '20px 24px' }}>
                {/* 上段：バッジ・企業名・日時 */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {typeBadge(r.form_type)}
                    <span style={{ fontWeight: 700, fontSize: 16 }}>{r.company_name || r.contact_name || '（名前なし）'}</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#B6ADA2', flexShrink: 0 }}>
                    {r.created_at ? new Date(r.created_at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>

                {/* 詳細情報 */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: '5px 20px', fontSize: 13, marginBottom: 14 }}>
                  {r.form_type === 'contact' ? (
                    <>
                      {r.phone       && <div><span style={{ color: '#938B81' }}>電話番号：</span><a href={`tel:${r.phone}`} style={{ color: '#F2620C' }}>{r.phone}</a></div>}
                      {r.legal_email && <div><span style={{ color: '#938B81' }}>返信先メール：</span><a href={`mailto:${r.legal_email}`} style={{ color: '#F2620C' }}>{r.legal_email}</a></div>}
                      {r.source      && <div><span style={{ color: '#938B81' }}>お問い合わせ種別：</span>{r.source}</div>}
                    </>
                  ) : (
                    <>
                      {r.contact_name  && <div><span style={{ color: '#938B81' }}>担当者：</span>{r.contact_name}</div>}
                      {r.phone         && <div><span style={{ color: '#938B81' }}>電話番号：</span><a href={`tel:${r.phone}`} style={{ color: '#F2620C' }}>{r.phone}</a></div>}
                      {r.legal_email   && <div><span style={{ color: '#938B81' }}>法務メール：</span><a href={`mailto:${r.legal_email}`} style={{ color: '#F2620C' }}>{r.legal_email}</a></div>}
                      {r.billing_email && <div><span style={{ color: '#938B81' }}>請求先：</span>{r.billing_email}</div>}
                      {r.account_email && <div><span style={{ color: '#938B81' }}>アカウント：</span>{r.account_email}</div>}
                      {r.source        && <div><span style={{ color: '#938B81' }}>情報源：</span>{r.source}</div>}
                    </>
                  )}
                </div>
                {r.notes && <div style={{ marginBottom: 14, padding: '10px 14px', background: '#FBF8F4', borderRadius: 8, fontSize: 13, color: '#57514A', lineHeight: 1.7 }}>{r.notes}</div>}

                {/* ステータス変更 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid #F3EEE7' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#938B81', marginRight: 4 }}>ステータス：</span>
                  {(['new', 'in_progress', 'done'] as const).map(s => {
                    const cfg = FORM_STATUS[s];
                    const active = (r.status || 'new') === s;
                    return (
                      <button key={s} onClick={() => updateStatus(r.id, s)} disabled={updatingStatus[r.id]}
                        style={{ fontSize: 12, fontWeight: 700, border: `1.5px solid ${active ? cfg.color : '#EFE8DF'}`, background: active ? cfg.bg : '#fff', color: active ? cfg.color : '#938B81', borderRadius: 999, padding: '5px 14px', cursor: 'pointer', opacity: updatingStatus[r.id] ? 0.6 : 1, transition: '.15s' }}>
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>

                {/* 管理メモ */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#938B81', marginBottom: 6 }}>管理メモ（内部用）</div>
                  {isEditingMemo ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <textarea
                        value={memoVal}
                        onChange={e => setMemoEditing(p => ({ ...p, [r.id]: e.target.value }))}
                        rows={3}
                        style={{ width: '100%', border: '1.5px solid #F2620C', borderRadius: 8, padding: '10px 12px', fontFamily: "var(--font-sans)", fontSize: 13, color: '#1C1813', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                        autoFocus
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => saveMemo(r.id)} disabled={savingMemo[r.id]}
                          style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 12, cursor: 'pointer', opacity: savingMemo[r.id] ? 0.7 : 1 }}>
                          {savingMemo[r.id] ? '保存中...' : '保存'}
                        </button>
                        <button onClick={() => setMemoEditing(p => { const n = { ...p }; delete n[r.id]; return n; })}
                          style={{ background: '#fff', color: '#938B81', border: '1px solid #EFE8DF', borderRadius: 8, padding: '8px 18px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div onClick={() => setMemoEditing(p => ({ ...p, [r.id]: r.admin_memo || '' }))}
                      style={{ minHeight: 36, padding: '9px 12px', background: '#FBF8F4', border: '1px dashed #D5CFCA', borderRadius: 8, fontSize: 13, color: r.admin_memo ? '#57514A' : '#B6ADA2', lineHeight: 1.7, cursor: 'text', whiteSpace: 'pre-wrap' }}>
                      {r.admin_memo || 'クリックしてメモを追加...'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const LEGAL_DOCS = [
  { slug: 'terms-student', title: '利用規約（学生版）', path: '/terms' },
  { slug: 'terms-company', title: '利用規約（企業版）', path: '/terms/company' },
  { slug: 'privacy-policy', title: 'プライバシーポリシー', path: '/privacy-policy' },
];

// サイト公開モードの切り替え（公開／公開前／メンテナンス）
function AdminSiteTab() {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<SiteMode | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<SiteMode | null>(null);
  const [tableMissing, setTableMissing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('site_settings').select('site_mode').eq('id', 1).maybeSingle().then(({ data, error }) => {
      if (error) { setTableMissing(true); setLoading(false); return; }
      setMode(((data?.site_mode as SiteMode) || 'public'));
      setLoading(false);
    });
  }, []);

  const change = async (next: SiteMode) => {
    if (next === mode) return;
    setSaving(next);
    // 1行のみ（id=1）。無ければINSERT、あればUPDATE。
    const { error } = await supabase.from('site_settings')
      .upsert({ id: 1, site_mode: next, updated_at: new Date().toISOString() }, { onConflict: 'id' });
    setSaving(null);
    if (error) { setToast('切り替えに失敗しました：' + error.message); setTimeout(() => setToast(null), 5000); return; }
    setMode(next);
    setToast(`「${SITE_MODE_LABELS[next]}」に切り替えました`);
    setTimeout(() => setToast(null), 4000);
  };

  const DESC: Record<SiteMode, string> = {
    public: '通常公開。全ページを一般公開し、検索エンジンにも登録されます。',
    prelaunch: '公開前。一般訪問者には「準備中」ページのみ表示し、学生登録・企業の方への導線だけ通します。求人検索・一覧・詳細は非表示。検索エンジンには登録されません（noindex）。',
    maintenance: 'メンテナンス中。一般訪問者には「メンテナンス」ページを表示します。検索エンジンには登録されません（noindex）。',
  };

  if (loading) return <div style={{ color: '#938B81', fontSize: 14 }}>読み込み中...</div>;

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D', borderRadius: 12, padding: '14px 24px', fontWeight: 700, fontSize: 14, boxShadow: '0 8px 32px rgba(0,0,0,.12)' }}>{toast}</div>
      )}
      <h2 style={{ fontWeight: 900, fontSize: 22, margin: '0 0 6px' }}>サイト状態</h2>
      <p style={{ fontSize: 13, color: '#938B81', margin: '0 0 20px' }}>サイト全体の公開状態を切り替えます。管理者（あなた）はどのモードでも全ページを閲覧できます（商談・保守用）。</p>

      {tableMissing && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#B91C1C', lineHeight: 1.7 }}>
          <strong>site_settings テーブルが未作成です。</strong><br />
          <code>sql/2026-07-24_site_mode.sql</code> を Supabase の SQL Editor で実行してください。実行するまで切り替えは保存されません。
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {SITE_MODES.map((m) => {
          const active = mode === m;
          return (
            <button key={m} onClick={() => change(m)} disabled={!!saving || tableMissing}
              style={{ textAlign: 'left', background: active ? '#FFF8F5' : '#fff', border: `1.5px solid ${active ? '#F2620C' : '#EFE8DF'}`, borderRadius: 14, padding: isMobile ? '16px' : '18px 22px', cursor: saving || tableMissing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 16, opacity: tableMissing ? 0.6 : 1 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${active ? '#F2620C' : '#C2B8AC'}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {active && <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#F2620C' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4, color: '#1C1813' }}>
                  {SITE_MODE_LABELS[m]}
                  {active && <span style={{ marginLeft: 10, fontSize: 11, fontWeight: 700, color: '#15803D', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 999, padding: '2px 10px' }}>現在</span>}
                </div>
                <div style={{ fontSize: 12.5, color: '#57514A', lineHeight: 1.7 }}>{DESC[m]}</div>
              </div>
              {saving === m && <div style={{ fontSize: 12, color: '#938B81', flexShrink: 0 }}>切替中...</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AdminLegalTab() {
  const isMobile = useIsMobile();
  const [selected, setSelected] = useState('terms-student');
  const [contents, setContents] = useState<Record<string, string>>({});
  const [updatedAt, setUpdatedAt] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tableMissing, setTableMissing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    supabase.from('site_documents').select('*').then(({ data, error }) => {
      if (error) { setTableMissing(true); setLoading(false); return; }
      const map: Record<string, string> = {};
      const up: Record<string, string> = {};
      (data || []).forEach((d: any) => { map[d.slug] = d.content; up[d.slug] = d.updated_at; });
      setContents(map);
      setUpdatedAt(up);
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    const doc = LEGAL_DOCS.find(d => d.slug === selected)!;
    const now = new Date().toISOString();
    const { error } = await supabase.from('site_documents').upsert({ slug: selected, title: doc.title, content: contents[selected] || '', updated_at: now });
    setSaving(false);
    if (error) { showToast('保存に失敗しました: ' + error.message, 'error'); return; }
    setUpdatedAt(p => ({ ...p, [selected]: now }));
    showToast('保存しました。公開ページに反映されています');
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div style={{ width: 36, height: 36, border: '2.5px solid #F2620C', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /><style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style></div>;

  if (tableMissing) return (
    <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 16, padding: '28px 32px' }}>
      <h3 style={{ fontWeight: 700, fontSize: 16, margin: '0 0 10px', color: '#B45309' }}>初期設定が必要です</h3>
      <p style={{ fontSize: 14, color: '#57514A', lineHeight: 1.9, margin: 0 }}>
        規約の編集機能を使うには、Supabase ダッシュボード → SQL Editor で <code style={{ background: '#FFF', padding: '2px 8px', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 12 }}>sql/2026-07-11_featured_jobs_and_site_documents.sql</code> を実行してください。実行後にこのページを再読み込みすると編集できるようになります。
      </p>
    </div>
  );

  const current = LEGAL_DOCS.find(d => d.slug === selected)!;

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: toast.type === 'error' ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${toast.type === 'error' ? '#FECACA' : '#BBF7D0'}`, color: toast.type === 'error' ? '#B91C1C' : '#15803D', borderRadius: 12, padding: '14px 24px', fontWeight: 700, fontSize: 14, boxShadow: '0 8px 32px rgba(0,0,0,.12)', whiteSpace: 'nowrap' }}>
          {toast.type === 'success' ? '✓ ' : '✕ '}{toast.msg}
        </div>
      )}
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: '#F2620C', letterSpacing: '.14em', marginBottom: 12 }}>LEGAL DOCUMENTS</div>
      <h2 style={{ fontWeight: 900, fontSize: 24, margin: '0 0 24px' }}>規約・ポリシー編集</h2>

      {/* 文書の選択 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {LEGAL_DOCS.map(d => (
          <button key={d.slug} onClick={() => setSelected(d.slug)}
            style={{ border: selected === d.slug ? '2px solid #F2620C' : '1px solid #EFE8DF', background: selected === d.slug ? '#FFF1E8' : '#fff', color: selected === d.slug ? '#F2620C' : '#57514A', borderRadius: 999, padding: '9px 20px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            {d.title}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: isMobile ? '20px 16px' : '28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>{current.title}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {updatedAt[selected] && <span style={{ fontSize: 12, color: '#938B81' }}>最終更新: {new Date(updatedAt[selected]).toLocaleString('ja-JP')}</span>}
            <a href={current.path} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#F2620C', fontWeight: 700 }}>公開ページを見る ↗</a>
          </div>
        </div>
        <div style={{ background: '#FBF8F4', borderRadius: 10, padding: '12px 16px', fontSize: 12.5, color: '#57514A', lineHeight: 1.9, marginBottom: 14 }}>
          書き方: 行頭を「第◯条 …」「第◯章 …」にするとその行が<b>見出し</b>になります。「・」で始まる行は<b>箇条書き</b>、それ以外は段落として表示されます。<br />
          ※ 空のまま保存すると、公開ページにはサイト組み込みの現行の文面（2026-07-11時点の正式版）が表示されます。このエディタに入力した内容が優先されます。
        </div>
        <textarea
          value={contents[selected] || ''}
          onChange={e => setContents(p => ({ ...p, [selected]: e.target.value }))}
          rows={24}
          placeholder={'第1条 目的\n本規約は…\n\n第2条 定義\n・「学生会員」：…\n・「企業会員」：…'}
          style={{ width: '100%', border: '1px solid #EFE8DF', borderRadius: 10, padding: '14px 16px', fontFamily: "var(--font-sans)", fontSize: 14, color: '#1C1813', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.8 }}
          onFocus={e => (e.target.style.borderColor = '#F2620C')}
          onBlur={e => (e.target.style.borderColor = '#EFE8DF')}
        />
        <div style={{ marginTop: 14 }}>
          <button onClick={save} disabled={saving}
            style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 36px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? '保存中...' : '保存して公開'}
          </button>
        </div>
      </div>
    </div>
  );
}

// 自動送信メールの一覧。既定文面は app/api/send-email/route.ts の DEFAULT_TEMPLATES と揃えること
const MAIL_TEMPLATES = [
  {
    slug: 'application_received', title: '応募通知（企業宛）',
    desc: '学生が求人に応募したとき、企業の登録メールに届く通知。応募者情報の表とダッシュボードへのボタンは自動で付きます。',
    vars: '{{jobTitle}} {{companyName}}',
    defSubject: '【新着応募】{{jobTitle}} への応募がありました',
    defBody: '{{companyName}} 様\n新しい応募がありました。ダッシュボードから確認・選考を進めてください。',
  },
  {
    slug: 'application_viewed', title: '応募確認（学生宛）',
    desc: '企業が応募を確認（未確認→検討中に変更）したとき学生に届く通知。企業から連絡が来る可能性がある旨を案内します。',
    vars: '{{jobTitle}} {{companyName}}',
    defSubject: '【応募確認】{{companyName}}があなたの応募を確認しました',
    defBody: '{{companyName}} が「{{jobTitle}}」へのあなたの応募を確認しました。\n今後、企業から選考のご連絡が届くことがあります。登録した連絡用メールアドレスへのメールを見逃さないようご注意ください（迷惑メールフォルダも合わせてご確認ください）。',
  },
  {
    slug: 'status_interview', title: '面接予定（学生宛）',
    desc: '企業が選考ステータスを「面接予定」にしたとき学生に届く通知。',
    vars: '{{jobTitle}} {{companyName}}',
    defSubject: '【面接予定】{{companyName}}「{{jobTitle}}」の選考結果',
    defBody: 'おめでとうございます！面接に進むことになりました。企業からの連絡をお待ちください。',
  },
  {
    slug: 'status_offer', title: '内定（学生宛）',
    desc: '選考ステータスが「内定」になったとき学生に届く通知。',
    vars: '{{jobTitle}} {{companyName}}',
    defSubject: '【内定】{{companyName}}「{{jobTitle}}」の選考結果',
    defBody: 'おめでとうございます！内定のご連絡です。詳細は企業からの連絡をご確認ください。',
  },
  {
    slug: 'status_rejected', title: '不採用（学生宛）',
    desc: '選考ステータスが「不採用」になったとき学生に届く通知。',
    vars: '{{jobTitle}} {{companyName}}',
    defSubject: '【選考結果】{{companyName}}「{{jobTitle}}」の選考結果',
    defBody: '今回は残念ながら選考を終了させていただきます。またぜひ他の求人にもご応募ください。',
  },
  {
    slug: 'student_welcome', title: 'ウェルカム（学生宛）',
    desc: '学生がプロフィール登録を完了したときに届くメール。',
    vars: '{{studentName}}',
    defSubject: 'トウコべインターンへようこそ！登録が完了しました',
    defBody: '{{studentName}} さん、トウコべインターンへようこそ！\nプロフィールの登録が完了しました。さっそく求人を探して、理想のインターンシップに応募してみましょう。',
  },
];

function AdminMailTab() {
  const isMobile = useIsMobile();
  const [selected, setSelected] = useState('application_received');
  const [subjects, setSubjects] = useState<Record<string, string>>({});
  const [bodies, setBodies] = useState<Record<string, string>>({});
  const [updatedAt, setUpdatedAt] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [tableMissing, setTableMissing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  useEffect(() => {
    supabase.from('email_templates').select('*').then(({ data, error }) => {
      if (error) { setTableMissing(true); setLoading(false); return; }
      const s: Record<string, string> = {};
      const b: Record<string, string> = {};
      const u: Record<string, string> = {};
      (data || []).forEach((t: any) => { s[t.slug] = t.subject; b[t.slug] = t.body; u[t.slug] = t.updated_at; });
      setSubjects(s); setBodies(b); setUpdatedAt(u);
      setLoading(false);
    });
  }, []);

  const cur = MAIL_TEMPLATES.find(t => t.slug === selected)!;
  const curSubject = subjects[selected] ?? '';
  const curBody = bodies[selected] ?? '';

  const save = async () => {
    setSaving(true);
    const now = new Date().toISOString();
    const { error } = await supabase.from('email_templates').upsert({ slug: selected, subject: curSubject, body: curBody, updated_at: now });
    setSaving(false);
    if (error) { showToast('保存に失敗しました: ' + error.message, 'error'); return; }
    setUpdatedAt(p => ({ ...p, [selected]: now }));
    showToast('保存しました。以後の自動送信メールに反映されます');
  };

  const sendTest = async () => {
    setSendingTest(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('セッションがありません');
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          type: selected,
          to: session.user.email,
          jobTitle: '【サンプル】事業開発インターン',
          companyName: 'サンプル株式会社',
          studentName: '山田 太郎',
          studentUniversity: '東京大学',
          studentGrade: '学部3年生',
          studentEmail: session.user.email,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      showToast(`テストメールを ${session.user.email} に送信しました。受信箱を確認してください`);
    } catch (e: any) {
      showToast('テスト送信に失敗: ' + e.message + '（Resendのドメイン認証が未完了の可能性）', 'error');
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div style={{ width: 36, height: 36, border: '2.5px solid #F2620C', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /><style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style></div>;

  if (tableMissing) return (
    <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 16, padding: '28px 32px' }}>
      <h3 style={{ fontWeight: 700, fontSize: 16, margin: '0 0 10px', color: '#B45309' }}>初期設定が必要です</h3>
      <p style={{ fontSize: 14, color: '#57514A', lineHeight: 1.9, margin: 0 }}>
        メール文面の編集機能を使うには、Supabase ダッシュボード → SQL Editor で <code style={{ background: '#FFF', padding: '2px 8px', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 12 }}>sql/2026-07-14_email_templates_and_job_details.sql</code> を実行してください。実行後にこのページを再読み込みしてください。
      </p>
    </div>
  );

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: toast.type === 'error' ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${toast.type === 'error' ? '#FECACA' : '#BBF7D0'}`, color: toast.type === 'error' ? '#B91C1C' : '#15803D', borderRadius: 12, padding: '14px 24px', fontWeight: 700, fontSize: 14, boxShadow: '0 8px 32px rgba(0,0,0,.12)', maxWidth: '90vw' }}>
          {toast.type === 'success' ? '✓ ' : '✕ '}{toast.msg}
        </div>
      )}
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: '#F2620C', letterSpacing: '.14em', marginBottom: 12 }}>EMAIL TEMPLATES</div>
      <h2 style={{ fontWeight: 900, fontSize: 24, margin: '0 0 24px' }}>メール文面の編集</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {MAIL_TEMPLATES.map(t => (
          <button key={t.slug} onClick={() => setSelected(t.slug)}
            style={{ border: selected === t.slug ? '2px solid #F2620C' : '1px solid #EFE8DF', background: selected === t.slug ? '#FFF1E8' : '#fff', color: selected === t.slug ? '#F2620C' : '#57514A', borderRadius: 999, padding: '9px 18px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            {t.title}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: isMobile ? '20px 16px' : '28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>{cur.title}</h3>
          {updatedAt[selected] && <span style={{ fontSize: 12, color: '#938B81' }}>最終更新: {new Date(updatedAt[selected]).toLocaleString('ja-JP')}</span>}
        </div>
        <p style={{ fontSize: 13, color: '#938B81', margin: '0 0 16px', lineHeight: 1.8 }}>{cur.desc}</p>

        <div style={{ background: '#FBF8F4', borderRadius: 10, padding: '12px 16px', fontSize: 12.5, color: '#57514A', lineHeight: 1.9, marginBottom: 16 }}>
          使える差し込み変数: <code style={{ background: '#fff', padding: '2px 8px', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{cur.vars}</code>（送信時に実際の値に置き換わります）<br />
          ※ 空欄で保存すると既定の文面に戻ります。件名・本文以外のデザイン（ヘッダー・ボタン等）は自動で付きます。
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#57514A', marginBottom: 8 }}>件名</label>
          <input
            value={curSubject}
            onChange={e => setSubjects(p => ({ ...p, [selected]: e.target.value }))}
            placeholder={cur.defSubject}
            style={{ width: '100%', border: '1px solid #EFE8DF', borderRadius: 10, padding: '12px 16px', fontFamily: "var(--font-sans)", fontSize: 14, color: '#1C1813', outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => (e.target.style.borderColor = '#F2620C')}
            onBlur={e => (e.target.style.borderColor = '#EFE8DF')}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#57514A', marginBottom: 8 }}>本文</label>
          <textarea
            value={curBody}
            onChange={e => setBodies(p => ({ ...p, [selected]: e.target.value }))}
            placeholder={cur.defBody}
            rows={7}
            style={{ width: '100%', border: '1px solid #EFE8DF', borderRadius: 10, padding: '12px 16px', fontFamily: "var(--font-sans)", fontSize: 14, color: '#1C1813', outline: 'none', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.8 }}
            onFocus={e => (e.target.style.borderColor = '#F2620C')}
            onBlur={e => (e.target.style.borderColor = '#EFE8DF')}
          />
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={save} disabled={saving}
            style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 32px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? '保存中...' : '保存する'}
          </button>
          <button onClick={sendTest} disabled={sendingTest}
            style={{ background: '#fff', color: '#F2620C', border: '1.5px solid #F2620C', borderRadius: 10, padding: '13px 24px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: sendingTest ? 0.7 : 1 }}>
            {sendingTest ? '送信中...' : '自分にテスト送信'}
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#B6ADA2', margin: '12px 0 0' }}>テスト送信は保存済みの文面（未保存の変更は含まれません）で、あなたの管理者メール宛に送られます。</p>
      </div>
    </div>
  );
}
