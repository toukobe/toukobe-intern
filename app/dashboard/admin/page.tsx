'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { usePendingJobs } from '@/utils/useNotifications';
import { useIsMobile } from '@/utils/useIsMobile';

interface User { id: string; email?: string; }
interface Stats { totalUsers: number; totalStudents: number; totalCompanies: number; totalJobs: number; totalApplications: number; }
type Tab = 'overview' | 'jobs' | 'companies' | 'forms' | 'docs';

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
    { key: 'forms', label: 'フォーム申し込み' },
    { key: 'docs', label: 'API Docs' },
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

        {/* DOCS */}
        {tab === 'forms' && <AdminFormsTab />}
        {tab === 'docs' && <AdminDocsTab />}
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
    const { data: jobsData } = await supabase
      .from('jobs')
      .select('id, job_title, salary, location, status, created_at, company_id')
      .order('created_at', { ascending: false });
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
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ company_name: '', industry: '', contact_email: '', login_email: '' });
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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('認証セッションが見つかりません');
      const res = await fetch('/api/admin/create-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || '追加に失敗しました');
      showToast(`企業を追加しました（${form.login_email}）`);
      setForm({ company_name: '', industry: '', contact_email: '', login_email: '' });
      setShowForm(false);
      loadCompanies();
    } catch (err: any) { showToast('追加に失敗しました: ' + err.message, 'error'); }
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

  const FORM_LABEL: Record<string, string> = { early: '早期申し込み', normal: '通常申し込み', material: '資料請求' };

  const exportCsv = () => {
    const headers = ['フォーム種別', '企業名', '担当者名', '法務メール', '請求先メール', 'アカウントメール', '情報源', 'その他要望', 'ステータス', '管理メモ', '申し込み日時'];
    const target = filterStatus === 'all' ? rows : rows.filter(r => r.status === filterStatus);
    const csvRows = target.map(r => [
      FORM_LABEL[r.form_type] || r.form_type,
      r.company_name || '', r.contact_name || '', r.legal_email || '',
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
    };
    const s = map[type] || { label: type, bg: '#F3F4F6', color: '#374151' };
    return <span style={{ fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, borderRadius: 999, padding: '3px 10px', whiteSpace: 'nowrap' as const }}>{s.label}</span>;
  };

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyLink = (path: string, key: string) => {
    const url = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  const filtered = filterStatus === 'all' ? rows : rows.filter(r => (r.status || 'new') === filterStatus);
  const counts = { all: rows.length, new: rows.filter(r => !r.status || r.status === 'new').length, in_progress: rows.filter(r => r.status === 'in_progress').length, done: rows.filter(r => r.status === 'done').length };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#938B81' }}>読み込み中...</div>;

  const FORM_LINKS = [
    { key: 'early',    path: '/forms/early',    label: '早期申し込み', bg: '#FFF1E8', color: '#C2390A', border: 'rgba(194,57,10,.2)' },
    { key: 'normal',   path: '/forms/normal',   label: '通常申し込み', bg: '#EFF6FF', color: '#1D4ED8', border: 'rgba(29,78,216,.2)' },
    { key: 'material', path: '/forms/material', label: '資料請求',     bg: '#F0FDF4', color: '#15803D', border: 'rgba(21,128,61,.2)' },
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
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
        {FORM_LINKS.map(f => (
          <div key={f.key} style={{ background: f.bg, border: `1px solid ${f.border}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: f.color, marginBottom: 8 }}>{f.label}</div>
            <div style={{ fontSize: 11, color: '#938B81', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "var(--font-mono)" }}>
              {typeof window !== 'undefined' ? window.location.origin : ''}{f.path}
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
                    <span style={{ fontWeight: 700, fontSize: 16 }}>{r.company_name}</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#B6ADA2', flexShrink: 0 }}>
                    {r.created_at ? new Date(r.created_at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>

                {/* 詳細情報 */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: '5px 20px', fontSize: 13, marginBottom: 14 }}>
                  {r.contact_name  && <div><span style={{ color: '#938B81' }}>担当者：</span>{r.contact_name}</div>}
                  {r.legal_email   && <div><span style={{ color: '#938B81' }}>法務メール：</span>{r.legal_email}</div>}
                  {r.billing_email && <div><span style={{ color: '#938B81' }}>請求先：</span>{r.billing_email}</div>}
                  {r.account_email && <div><span style={{ color: '#938B81' }}>アカウント：</span>{r.account_email}</div>}
                  {r.source        && <div><span style={{ color: '#938B81' }}>情報源：</span>{r.source}</div>}
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

function AdminDocsTab() {
  const endpoints = [
    { method: 'POST', path: '/api/auth/login', desc: 'ログイン' },
    { method: 'POST', path: '/api/auth/logout', desc: 'ログアウト' },
    { method: 'GET', path: '/api/jobs', desc: '求人一覧取得' },
    { method: 'GET', path: '/api/jobs/:id', desc: '求人詳細取得' },
    { method: 'POST', path: '/api/jobs', desc: '求人作成（企業のみ）' },
    { method: 'PUT', path: '/api/jobs/:id', desc: '求人更新（企業のみ）' },
    { method: 'DELETE', path: '/api/jobs/:id', desc: '求人削除（企業のみ）' },
    { method: 'GET', path: '/api/applications', desc: '応募一覧' },
    { method: 'POST', path: '/api/applications', desc: '応募作成' },
    { method: 'PUT', path: '/api/applications/:id', desc: '応募ステータス更新' },
  ];
  const METHOD_COLOR: Record<string, { bg: string; color: string }> = {
    GET: { bg: '#EFF6FF', color: '#1D4ED8' },
    POST: { bg: '#F0FDF4', color: '#15803D' },
    PUT: { bg: '#FFFBEB', color: '#B45309' },
    DELETE: { bg: '#FEF2F2', color: '#B91C1C' },
  };
  return (
    <div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: '#F2620C', letterSpacing: '.14em', marginBottom: 12 }}>API DOCS</div>
      <h2 style={{ fontWeight: 900, fontSize: 24, margin: '0 0 24px' }}>APIドキュメント</h2>
      <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, overflow: 'hidden' }}>
        {endpoints.map((ep, i) => {
          const mc = METHOD_COLOR[ep.method];
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', borderBottom: i < endpoints.length - 1 ? '1px solid #EFE8DF' : 'none' }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, background: mc.bg, color: mc.color, fontFamily: "var(--font-mono)", width: 56, textAlign: 'center', flexShrink: 0 }}>{ep.method}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: '#1C1813', flex: 1 }}>{ep.path}</span>
              <span style={{ fontSize: 13, color: '#938B81' }}>{ep.desc}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
