'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useIsMobile } from '@/utils/useIsMobile';

const STATUS_MAP: Record<string, { text: string; bg: string; color: string; border: string }> = {
  unread:    { text: '未確認',   bg: '#F5F3FF', color: '#6D28D9', border: '#DDD6FE' },
  pending:   { text: '検討中',   bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
  interview: { text: '面接予定', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  offer:     { text: '内定',     bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
  rejected:  { text: '不採用',   bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' },
};

export default function ApplicantsPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>('');
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { document.title = '応募者管理 | トウコべインターン'; return () => { document.title = 'トウコべインターン'; }; }, []);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth/company-login'); return; }
      const { data: userType } = await supabase.from('user_types').select('company_id').eq('user_id', session.user.id).single();
      if (!userType?.company_id) { router.push('/auth/company-login'); return; }
      setCompanyId(userType.company_id);
      const { data: co } = await supabase.from('companies').select('company_name').eq('id', userType.company_id).single();
      if (co) setCompanyName(co.company_name || '');
    }
    checkAuth();
  }, [router]);

  useEffect(() => {
    async function fetchApplications() {
      if (!companyId) return;
      try {
        const { data: jobs } = await supabase.from('jobs').select('id').eq('company_id', companyId);
        const jobIds = jobs?.map(j => j.id) || [];
        if (jobIds.length === 0) { setApplications([]); setLoading(false); return; }

        const { data: appsData } = await supabase
          .from('applications')
          .select('id, status, created_at, user_id, job_id, jobs(job_title)')
          .in('job_id', jobIds)
          .order('created_at', { ascending: false });

        if (!appsData) { setApplications([]); setLoading(false); return; }

        const appsWithProfiles = await Promise.all(
          (appsData as any[]).map(async (app) => {
            const { data: profile } = await supabase.from('student_profiles').select('name, university, grade, contact_email').eq('user_id', app.user_id).single();
            return { ...app, profile: profile || { name: '未登録', university: '未設定', grade: '未設定' } };
          })
        );
        setApplications(appsWithProfiles);
      } catch (err) {
        setError('応募者データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    }
    fetchApplications();
  }, [companyId]);

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    const { error } = await supabase.from('applications').update({ status: newStatus }).eq('id', applicationId);
    if (error) { showToast('更新に失敗しました', 'error'); return; }
    setApplications(applications.map(app => app.id === applicationId ? { ...app, status: newStatus } : app));

    // メール通知（面接・内定・不採用時のみ）
    const notifyStatuses: Record<string, string> = { interview: 'status_interview', offer: 'status_offer', rejected: 'status_rejected' };
    const emailType = notifyStatuses[newStatus];
    if (emailType) {
      const app = applications.find(a => a.id === applicationId);
      const contactEmail = app?.profile?.contact_email;
      if (contactEmail) {
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: emailType,
            to: contactEmail,
            jobTitle: app?.jobs?.job_title || '',
            companyName,
            jobId: app?.job_id,
          }),
        }).catch(console.error);
      }
    }
  };

  const filtered = filterStatus === 'all' ? applications : applications.filter(a => a.status === filterStatus);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF8F4', fontFamily: "'Zen Kaku Gothic New',sans-serif" }}>
      <div style={{ width: 36, height: 36, border: '2.5px solid #F2620C', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#FBF8F4', fontFamily: "'Zen Kaku Gothic New',sans-serif", color: '#1C1813' }}>
      <link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;700;900&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: toast.type === 'error' ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${toast.type === 'error' ? '#FECACA' : '#BBF7D0'}`, color: toast.type === 'error' ? '#B91C1C' : '#15803D', borderRadius: 12, padding: '14px 24px', fontWeight: 700, fontSize: 14, boxShadow: '0 8px 32px rgba(0,0,0,.12)', whiteSpace: 'nowrap' }}>
          {toast.type === 'success' ? '✓ ' : '✕ '}{toast.msg}
        </div>
      )}

      {/* NAV */}
      <div style={{ background: '#fff', borderBottom: '1px solid #EFE8DF', padding: isMobile ? '14px 16px' : '14px 48px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 50 }}>
        <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 34, width: 'auto', cursor: 'pointer' }} onClick={() => router.push('/')} />
        <div style={{ width: 1, height: 20, background: '#EFE8DF' }} />
        <span style={{ fontSize: 13, color: '#F2620C', fontWeight: 700, cursor: 'pointer' }} onClick={() => router.push('/dashboard/company')}>← ダッシュボードに戻る</span>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: isMobile ? '24px 12px 60px' : '48px 48px 80px' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#F2620C', letterSpacing: '.18em', marginBottom: 10 }}>APPLICANTS</div>
          <h1 style={{ fontWeight: 900, fontSize: 30, margin: '0 0 4px' }}>応募者管理</h1>
          <p style={{ fontSize: 13, color: '#938B81', margin: 0 }}>全 {applications.length} 件の応募</p>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
            <p style={{ color: '#B91C1C', fontSize: 13, margin: 0 }}>{error}</p>
          </div>
        )}

        {/* FILTER TABS */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          {[['all','すべて'], ['unread','未確認'], ['pending','検討中'], ['interview','面接予定'], ['offer','内定'], ['rejected','不採用']].map(([val, label]) => {
            const count = val === 'all' ? applications.length : applications.filter(a => a.status === val).length;
            const active = filterStatus === val;
            return (
              <button key={val} onClick={() => setFilterStatus(val)}
                style={{ border: active ? 'none' : '1px solid #EFE8DF', background: active ? '#F2620C' : '#fff', color: active ? '#fff' : '#57514A', borderRadius: 8, padding: '10px 18px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: active ? 700 : 400, fontSize: 13, cursor: 'pointer' }}>
                {label}（{count}）
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: isMobile ? '40px 20px' : '60px', textAlign: 'center' }}>
            <p style={{ color: '#938B81', fontSize: 15 }}>該当する応募者がいません</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map(app => {
              const s = STATUS_MAP[app.status] || STATUS_MAP.pending;
              return (
                <div key={app.id} style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: isMobile ? '16px' : '24px 28px', borderLeft: `4px solid ${app.status === 'unread' ? '#7C3AED' : app.status === 'offer' ? '#16A34A' : app.status === 'rejected' ? '#DC2626' : '#F2620C'}` }}>
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 24, justifyContent: 'space-between', marginBottom: 20 }}>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 8 }}>{app.profile?.name || '未登録'}</div>
                      <div style={{ display: 'flex', gap: 20, fontSize: 13, color: '#57514A' }}>
                        <span>🎓 {app.profile?.university || '未設定'}</span>
                        <span>📚 {app.profile?.grade || '未設定'}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 999, padding: '6px 14px', fontWeight: 700, fontSize: 12, display: 'inline-block', marginBottom: 8 }}>{s.text}</div>
                      <div style={{ fontSize: 12, color: '#938B81' }}>{new Date(app.created_at).toLocaleDateString('ja-JP')}</div>
                    </div>
                  </div>

                  <div style={{ background: '#FBF8F4', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
                    <span style={{ fontSize: 12, color: '#938B81' }}>応募職種　</span>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{app.jobs?.job_title || '不明'}</span>
                  </div>

                  <div style={{ borderTop: '1px solid #EFE8DF', paddingTop: 16, display: 'flex', gap: 8, justifyContent: isMobile ? 'stretch' : 'flex-end', flexWrap: 'wrap' }}>
                    <button onClick={() => router.push(`/chat/${app.id}`)}
                      style={{ background: '#FFF1E8', color: '#F2620C', border: 'none', borderRadius: 8, padding: '9px 18px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                      💬 メッセージ
                    </button>
                    {app.status !== 'pending' && (
                      <button onClick={() => handleStatusChange(app.id, 'pending')}
                        style={{ background: app.status === 'pending' ? '#FFFBEB' : '#fff', color: '#B45309', border: '1px solid #FDE68A', borderRadius: 8, padding: '9px 18px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                        検討中
                      </button>
                    )}
                    <button onClick={() => handleStatusChange(app.id, 'interview')}
                      style={{ background: app.status === 'interview' ? '#EFF6FF' : '#fff', color: '#1D4ED8', border: '1px solid #BFDBFE', borderRadius: 8, padding: '9px 18px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                      面接予定
                    </button>
                    <button onClick={() => handleStatusChange(app.id, 'offer')}
                      style={{ background: app.status === 'offer' ? '#F0FDF4' : '#fff', color: '#15803D', border: '1px solid #BBF7D0', borderRadius: 8, padding: '9px 18px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                      内定
                    </button>
                    <button onClick={() => handleStatusChange(app.id, 'rejected')}
                      style={{ background: app.status === 'rejected' ? '#FEF2F2' : '#fff', color: '#B91C1C', border: '1px solid #FECACA', borderRadius: 8, padding: '9px 18px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                      不採用
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
