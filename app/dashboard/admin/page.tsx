'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

interface User { id: string; email?: string; }
interface Stats { totalUsers: number; totalStudents: number; totalCompanies: number; totalJobs: number; totalApplications: number; }
type Tab = 'overview' | 'jobs' | 'companies' | 'interactions' | 'docs';

const F = {
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#57514A', marginBottom: 8 } as React.CSSProperties,
  input: { width: '100%', border: '1px solid #EFE8DF', borderRadius: 10, padding: '12px 16px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontSize: 14, color: '#1C1813', outline: 'none', boxSizing: 'border-box' as const },
};

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF8F4', fontFamily: "'Zen Kaku Gothic New',sans-serif" }}>
      <div style={{ color: '#57514A' }}>読み込み中...</div>
    </div>
  );

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview', label: '概要' },
    { key: 'jobs', label: '求人承認' },
    { key: 'companies', label: '企業管理' },
    { key: 'interactions', label: 'やり取り' },
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
    <div style={{ minHeight: '100vh', background: '#FBF8F4', fontFamily: "'Zen Kaku Gothic New',sans-serif", color: '#1C1813' }}>
      <link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;700;900&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* NAV */}
      <div style={{ background: '#1C1813', padding: '14px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 34, width: 'auto', cursor: 'pointer' }} onClick={() => router.push('/')} />
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#FBA94C', background: 'rgba(251,169,76,.15)', padding: '3px 10px', borderRadius: 999 }}>ADMIN</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#9A9086' }}>{user?.email}</span>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} style={{ background: 'rgba(255,255,255,.08)', color: '#C9C0B6', border: 'none', borderRadius: 8, padding: '9px 18px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>ログアウト</button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 48px' }}>
        {/* TABS */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 36, background: '#fff', border: '1px solid #EFE8DF', borderRadius: 12, padding: 6, width: 'fit-content' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ border: 'none', borderRadius: 8, padding: '10px 24px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: '.2s', background: tab === t.key ? '#F2620C' : 'transparent', color: tab === t.key ? '#fff' : '#57514A' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#F2620C', letterSpacing: '.14em', marginBottom: 12 }}>OVERVIEW</div>
            <h2 style={{ fontWeight: 900, fontSize: 24, margin: '0 0 24px' }}>サイト統計</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16 }}>
              {STAT_CARDS.map(s => (
                <div key={s.label} style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 14, padding: '24px 20px' }}>
                  <div style={{ fontSize: 12, color: '#938B81', marginBottom: 10 }}>{s.label}</div>
                  <div style={{ fontWeight: 900, fontSize: 40, color: s.accent, lineHeight: 1 }}>{s.val}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* JOBS APPROVAL */}
        {tab === 'jobs' && <AdminJobsTab />}

        {/* COMPANIES */}
        {tab === 'companies' && <AdminCompaniesTab />}

        {/* INTERACTIONS */}
        {tab === 'interactions' && <AdminInteractionsTab />}

        {/* DOCS */}
        {tab === 'docs' && <AdminDocsTab />}
      </div>
    </div>
  );
}

function AdminJobsTab() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  useEffect(() => { loadJobs(); }, []);

  const loadJobs = async () => {
    const { data } = await supabase
      .from('jobs')
      .select('id, job_title, salary, location, status, created_at, companies(company_name)')
      .order('created_at', { ascending: false });
    setJobs(data || []);
    setLoading(false);
  };

  const handleApprove = async (jobId: string) => {
    const { error } = await supabase.from('jobs').update({ status: 'published' }).eq('id', jobId);
    if (error) { alert('承認に失敗しました'); return; }
    setJobs(jobs.map(j => j.id === jobId ? { ...j, status: 'published' } : j));
  };

  const handleReject = async (jobId: string) => {
    const reason = prompt('差し戻し理由を入力してください（任意）');
    const { error } = await supabase.from('jobs').update({ status: 'draft' }).eq('id', jobId);
    if (error) { alert('差し戻しに失敗しました'); return; }
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

  if (loading) return <div style={{ color: '#57514A', padding: 40 }}>読み込み中...</div>;

  return (
    <div>
      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#F2620C', letterSpacing: '.14em', marginBottom: 12 }}>JOB APPROVAL</div>
      <h2 style={{ fontWeight: 900, fontSize: 24, margin: '0 0 24px' }}>求人承認管理</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button onClick={() => setFilter('pending')}
          style={{ border: filter === 'pending' ? 'none' : '1px solid #EFE8DF', background: filter === 'pending' ? '#F2620C' : '#fff', color: filter === 'pending' ? '#fff' : '#57514A', borderRadius: 8, padding: '10px 20px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer' } as React.CSSProperties}>
          承認待ち（{pendingCount}）
        </button>
        <button onClick={() => setFilter('all')}
          style={{ border: filter === 'all' ? 'none' : '1px solid #EFE8DF', background: filter === 'all' ? '#F2620C' : '#fff', color: filter === 'all' ? '#fff' : '#57514A', borderRadius: 8, padding: '10px 20px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer' } as React.CSSProperties}>
          全件（{jobs.length}）
        </button>
      </div>

      {displayed.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: '48px', textAlign: 'center' }}>
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
                      style={{ background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', borderRadius: 8, padding: '8px 18px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                      承認
                    </button>
                    <button onClick={() => handleReject(j.id)}
                      style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 18px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
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
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ company_name: '', industry: '', contact_email: '', login_email: '' });

  useEffect(() => { loadCompanies(); }, []);

  const loadCompanies = async () => {
    const { data } = await supabase.from('companies').select('*').order('created_at', { ascending: false });
    setCompanies(data || []);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: company, error: ce } = await supabase.from('companies').insert([{ company_name: form.company_name, industry: form.industry, contact_email: form.contact_email }]).select().single();
      if (ce) throw ce;
      const { data: authData, error: ae } = await supabase.auth.admin.createUser({ email: form.login_email, password: Math.random().toString(36).slice(-12), email_confirm: true });
      if (ae) throw ae;
      await supabase.from('user_types').insert([{ user_id: authData.user.id, user_type: 'company', company_id: company.id }]);
      alert(`企業を追加しました。\nログインメール: ${form.login_email}`);
      setForm({ company_name: '', industry: '', contact_email: '', login_email: '' });
      setShowForm(false);
      loadCompanies();
    } catch (err: any) { alert('追加に失敗しました: ' + err.message); }
  };

  if (loading) return <div style={{ color: '#57514A' }}>読み込み中...</div>;

  const F2 = { label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#57514A', marginBottom: 8 } as React.CSSProperties, input: { width: '100%', border: '1px solid #EFE8DF', borderRadius: 10, padding: '12px 16px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontSize: 14, color: '#1C1813', outline: 'none', boxSizing: 'border-box' as const } };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#F2620C', letterSpacing: '.14em', marginBottom: 6 }}>COMPANIES</div>
          <h2 style={{ fontWeight: 900, fontSize: 24, margin: 0 }}>企業管理 ({companies.length}社)</h2>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          {showForm ? 'キャンセル' : '+ 企業を追加'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: '28px 32px', marginBottom: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, margin: '0 0 20px' }}>新規企業登録</h3>
          <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><label style={F2.label}>企業名 *</label><input style={F2.input} value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} required onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} /></div>
            <div><label style={F2.label}>業種 *</label><input style={F2.input} value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} required onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} /></div>
            <div><label style={F2.label}>企業メール *</label><input style={F2.input} type="email" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} required onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} /></div>
            <div><label style={F2.label}>ログインメール *</label><input style={F2.input} type="email" value={form.login_email} onChange={e => setForm({ ...form, login_email: e.target.value })} required onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} /></div>
            <div style={{ gridColumn: '1/-1' }}>
              <button type="submit" style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 32px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>企業を登録する</button>
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
                <td style={{ padding: '16px 20px', fontSize: 13, color: '#57514A', fontFamily: "'IBM Plex Mono',monospace" }}>{c.contact_email}</td>
                <td style={{ padding: '16px 20px' }}><span style={{ fontSize: 13, color: '#F2620C', fontWeight: 700, cursor: 'pointer' }}>編集</span></td>
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

function AdminInteractionsTab() {
  const [interactions, setInteractions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(50);
      setInteractions(data || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div style={{ color: '#57514A' }}>読み込み中...</div>;

  return (
    <div>
      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#F2620C', letterSpacing: '.14em', marginBottom: 12 }}>INTERACTIONS</div>
      <h2 style={{ fontWeight: 900, fontSize: 24, margin: '0 0 24px' }}>やり取り一覧</h2>
      <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#FBF8F4' }}>
              {['メッセージ', '日時'].map(h => (
                <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#938B81', borderBottom: '1px solid #EFE8DF' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {interactions.length === 0 ? (
              <tr><td colSpan={2} style={{ padding: '40px', textAlign: 'center', color: '#938B81', fontSize: 14 }}>やり取りはまだありません</td></tr>
            ) : interactions.map((m, i) => (
              <tr key={m.id} style={{ borderBottom: i < interactions.length - 1 ? '1px solid #EFE8DF' : 'none' }}>
                <td style={{ padding: '16px 20px', fontSize: 14, color: '#1C1813', maxWidth: 500 }}>{m.message_text}</td>
                <td style={{ padding: '16px 20px', fontSize: 12, color: '#938B81', whiteSpace: 'nowrap', fontFamily: "'IBM Plex Mono',monospace" }}>{new Date(m.created_at).toLocaleString('ja-JP')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
    { method: 'GET', path: '/api/messages', desc: 'メッセージ一覧' },
    { method: 'POST', path: '/api/messages', desc: 'メッセージ送信' },
  ];
  const METHOD_COLOR: Record<string, { bg: string; color: string }> = {
    GET: { bg: '#EFF6FF', color: '#1D4ED8' },
    POST: { bg: '#F0FDF4', color: '#15803D' },
    PUT: { bg: '#FFFBEB', color: '#B45309' },
    DELETE: { bg: '#FEF2F2', color: '#B91C1C' },
  };
  return (
    <div>
      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#F2620C', letterSpacing: '.14em', marginBottom: 12 }}>API DOCS</div>
      <h2 style={{ fontWeight: 900, fontSize: 24, margin: '0 0 24px' }}>APIドキュメント</h2>
      <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, overflow: 'hidden' }}>
        {endpoints.map((ep, i) => {
          const mc = METHOD_COLOR[ep.method];
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', borderBottom: i < endpoints.length - 1 ? '1px solid #EFE8DF' : 'none' }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, background: mc.bg, color: mc.color, fontFamily: "'IBM Plex Mono',monospace", width: 56, textAlign: 'center', flexShrink: 0 }}>{ep.method}</span>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, color: '#1C1813', flex: 1 }}>{ep.path}</span>
              <span style={{ fontSize: 13, color: '#938B81' }}>{ep.desc}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
