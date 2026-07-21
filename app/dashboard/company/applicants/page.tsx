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
  const [companyEmail, setCompanyEmail] = useState<string>('');
  const [companyJobIds, setCompanyJobIds] = useState<string[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { document.title = '応募者管理 | トウコべインターン'; return () => { document.title = 'トウコべインターン'; }; }, []);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggleExpand = (id: string) => setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth/company-login'); return; }
      const { data: userType } = await supabase.from('user_types').select('company_id').eq('user_id', session.user.id).single();
      if (!userType?.company_id) { router.push('/auth/company-login'); return; }
      setCompanyId(userType.company_id);
      const { data: co } = await supabase.from('companies').select('company_name, contact_email').eq('id', userType.company_id).single();
      if (co) { setCompanyName(co.company_name || ''); setCompanyEmail(co.contact_email || ''); }
    }
    checkAuth();
  }, [router]);

  useEffect(() => {
    async function fetchApplications() {
      if (!companyId) return;
      try {
        const { data: jobs } = await supabase.from('jobs').select('id').eq('company_id', companyId);
        const jobIds = jobs?.map(j => j.id) || [];
        setCompanyJobIds(jobIds);
        if (jobIds.length === 0) { setApplications([]); setLoading(false); return; }

        const firstRes = await supabase
          .from('applications')
          .select('id, status, created_at, user_id, job_id, available_hours, motivation, jobs(job_title)')
          .in('job_id', jobIds)
          .order('created_at', { ascending: false });
        let appsData: any[] | null = firstRes.data as any;
        // 新カラム未追加の環境では基本項目のみで取得
        if (!appsData) {
          const secondRes = await supabase
            .from('applications')
            .select('id, status, created_at, user_id, job_id, jobs(job_title)')
            .in('job_id', jobIds)
            .order('created_at', { ascending: false });
          appsData = secondRes.data as any;
        }

        if (!appsData) { setApplications([]); setLoading(false); return; }

        const userIds = [...new Set((appsData as any[]).map(app => app.user_id))];
        // 応募者の詳細プロフィールを取得（新カラム未追加の環境では基本項目のみ）
        const fullCols = 'user_id, name, university, department, grade, graduation_year, contact_email, skills, languages, certifications, experience, is_tutor';
        let profiles: any[] | null = (await supabase.from('student_profiles').select(fullCols).in('user_id', userIds)).data as any;
        if (!profiles) {
          profiles = (await supabase.from('student_profiles').select('user_id, name, university, grade, contact_email').in('user_id', userIds)).data as any;
        }
        const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
        setApplications((appsData as any[]).map(app => ({
          ...app,
          profile: profileMap.get(app.user_id) || { name: '未登録', university: '未設定', grade: '未設定' },
        })));
      } catch (err) {
        setError('応募者データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    }
    fetchApplications();
  }, [companyId]);

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    const app = applications.find(a => a.id === applicationId);
    if (!app || !companyJobIds.includes(app.job_id)) { showToast('更新に失敗しました', 'error'); return; }
    const { error } = await supabase.from('applications').update({ status: newStatus }).eq('id', applicationId).in('job_id', companyJobIds);
    if (error) { showToast('更新に失敗しました', 'error'); return; }
    setApplications(applications.map(app => app.id === applicationId ? { ...app, status: newStatus } : app));

    // メール通知（面接・内定・不採用時、および未確認→検討中の応募確認時）
    const notifyStatuses: Record<string, string> = { interview: 'status_interview', offer: 'status_offer', rejected: 'status_rejected' };
    const emailType = notifyStatuses[newStatus]
      || (newStatus === 'pending' && app.status === 'unread' ? 'application_viewed' : undefined);
    if (emailType) {
      const contactEmail = app?.profile?.contact_email;
      if (contactEmail) {
        const { data: { session } } = await supabase.auth.getSession();
        try {
          const res = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
            body: JSON.stringify({
              type: emailType,
              applicationId,
              jobTitle: app?.jobs?.job_title || '',
              companyName,
              jobId: app?.job_id,
            }),
          });
          if (!res.ok) throw new Error(`send-email ${res.status}`);
          showToast('ステータスを更新し、応募者に通知メールを送信しました');
        } catch (e) {
          console.error(e);
          showToast('ステータスは更新しましたが、通知メールの送信に失敗しました。応募者へ直接ご連絡ください', 'error');
        }
      } else {
        showToast('ステータスを更新しました（連絡先未登録のため通知メールは送信されません）');
      }
    } else {
      showToast('ステータスを更新しました');
    }
  };

  const filtered = filterStatus === 'all' ? applications : applications.filter(a => a.status === filterStatus);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF8F4', fontFamily: "var(--font-sans)" }}>
      <div style={{ width: 36, height: 36, border: '2.5px solid #F2620C', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#FBF8F4', fontFamily: "var(--font-sans)", color: '#1C1813' }}>

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
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: '#F2620C', letterSpacing: '.18em', marginBottom: 10 }}>APPLICANTS</div>
          <h1 style={{ fontWeight: 900, fontSize: 30, margin: '0 0 4px' }}>応募者管理</h1>
          <p style={{ fontSize: 13, color: '#938B81', margin: 0 }}>全 {applications.length} 件の応募</p>
        </div>

        {companyEmail && applications.length > 0 && (
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>📧</span>
            <p style={{ fontSize: 12, color: '#92400E', margin: 0, lineHeight: 1.7 }}>
              応募者への選考連絡は、各応募者の連絡先メールアドレス宛に直接お送りください。学生には「<strong>{companyEmail}</strong>（貴社の登録メールアドレス）から連絡が届く」と案内しているため、このアドレスからの送信を推奨します。
            </p>
          </div>
        )}

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
                style={{ border: active ? 'none' : '1px solid #EFE8DF', background: active ? '#F2620C' : '#fff', color: active ? '#fff' : '#57514A', borderRadius: 8, padding: '10px 18px', fontFamily: "var(--font-sans)", fontWeight: active ? 700 : 400, fontSize: 13, cursor: 'pointer' }}>
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
                      <div style={{ display: 'flex', gap: 20, fontSize: 13, color: '#57514A', flexWrap: 'wrap' }}>
                        <span>🎓 {app.profile?.university || '未設定'}</span>
                        <span>📚 {app.profile?.grade || '未設定'}</span>
                        <span>
                          ✉️ {app.profile?.contact_email
                            ? <a href={`mailto:${app.profile.contact_email}`} style={{ color: '#F2620C', fontWeight: 700, textDecoration: 'none' }}>{app.profile.contact_email}</a>
                            : '連絡先未登録'}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 999, padding: '6px 14px', fontWeight: 700, fontSize: 12, display: 'inline-block', marginBottom: 8 }}>{s.text}</div>
                      <div style={{ fontSize: 12, color: '#938B81' }}>{new Date(app.created_at).toLocaleDateString('ja-JP')}</div>
                    </div>
                  </div>

                  {(app.available_hours || app.motivation) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, marginBottom: 16 }}>
                      {app.available_hours && (
                        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 16px' }}>
                          <div style={{ fontSize: 11, color: '#1D4ED8', fontWeight: 700, marginBottom: 4 }}>⏰ 勤務可能時間</div>
                          <div style={{ fontSize: 13.5, color: '#1C1813', whiteSpace: 'pre-wrap' }}>{app.available_hours}</div>
                        </div>
                      )}
                      {app.motivation && (
                        <div style={{ background: '#FBF8F4', border: '1px solid #EFE8DF', borderRadius: 10, padding: '12px 16px' }}>
                          <div style={{ fontSize: 11, color: '#938B81', fontWeight: 700, marginBottom: 4 }}>📝 志望理由</div>
                          <div style={{ fontSize: 13.5, color: '#3A352F', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{app.motivation}</div>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ background: '#FBF8F4', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                    <span style={{ fontSize: 12, color: '#938B81' }}>応募職種　</span>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{app.jobs?.job_title || '不明'}</span>
                  </div>

                  {/* 応募者プロフィール詳細（開閉式） */}
                  <div style={{ marginBottom: 20 }}>
                    <button onClick={() => toggleExpand(app.id)}
                      style={{ width: '100%', background: expanded.has(app.id) ? '#FFF8F5' : '#fff', color: '#F2620C', border: '1px solid #FBD5C0', borderRadius: 10, padding: '11px 16px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>👤 プロフィール詳細を{expanded.has(app.id) ? '閉じる' : '見る'}</span>
                      <span style={{ transform: expanded.has(app.id) ? 'rotate(180deg)' : 'none', transition: '.2s' }}>▾</span>
                    </button>
                    {expanded.has(app.id) && (() => {
                      const p = app.profile || {};
                      const skills: string[] = Array.isArray(p.skills) ? p.skills.filter((s: any) => typeof s === 'string' && s) : [];
                      const languages: string[] = Array.isArray(p.languages) ? p.languages.filter((s: any) => typeof s === 'string' && s) : [];
                      const row = (label: string, value?: string | null) => (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 11, color: '#938B81', fontWeight: 700, marginBottom: 3 }}>{label}</div>
                          <div style={{ fontSize: 13.5, color: '#1C1813', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{value || '未設定'}</div>
                        </div>
                      );
                      const chips = (label: string, items: string[], bg: string, color: string, border: string) => (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 11, color: '#938B81', fontWeight: 700, marginBottom: 6 }}>{label}</div>
                          {items.length ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {items.map((s, i) => <span key={i} style={{ fontSize: 12, background: bg, color, border: `1px solid ${border}`, borderRadius: 999, padding: '4px 12px' }}>{s}</span>)}
                            </div>
                          ) : <div style={{ fontSize: 13.5, color: '#1C1813' }}>未設定</div>}
                        </div>
                      );
                      return (
                        <div style={{ marginTop: 12, background: '#FBF8F4', border: '1px solid #EFE8DF', borderRadius: 12, padding: isMobile ? '16px' : '18px 20px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0 24px' }}>
                            {row('大学', p.university)}
                            {row('学部・学科', p.department)}
                            {row('学年', p.grade)}
                            {row('卒業予定年', p.graduation_year ? `${p.graduation_year}年` : null)}
                          </div>
                          {chips('語学', languages, '#EFF6FF', '#1D4ED8', '#BFDBFE')}
                          {chips('スキル', skills, '#FFF1E8', '#C2530A', '#FBD5C0')}
                          {row('資格・検定', p.certifications)}
                          {row('経歴・自己紹介', p.experience)}
                          {p.is_tutor && (
                            <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', borderRadius: 999, padding: '4px 12px' }}>✓ トウコべ・キョウコべ講師登録あり</div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  <div style={{ borderTop: '1px solid #EFE8DF', paddingTop: 16, display: 'flex', gap: 8, justifyContent: isMobile ? 'stretch' : 'flex-end', flexWrap: 'wrap' }}>
                    {app.profile?.contact_email && (
                      <a href={`mailto:${app.profile.contact_email}?subject=${encodeURIComponent(`【${companyName}】「${app.jobs?.job_title || ''}」ご応募の件`)}`}
                        style={{ background: '#FFF1E8', color: '#F2620C', border: 'none', borderRadius: 8, padding: '9px 18px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                        ✉️ メールで連絡
                      </a>
                    )}
                    {app.status !== 'pending' && (
                      <button onClick={() => handleStatusChange(app.id, 'pending')}
                        style={{ background: app.status === 'pending' ? '#FFFBEB' : '#fff', color: '#B45309', border: '1px solid #FDE68A', borderRadius: 8, padding: '9px 18px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                        検討中
                      </button>
                    )}
                    <button onClick={() => handleStatusChange(app.id, 'interview')}
                      style={{ background: app.status === 'interview' ? '#EFF6FF' : '#fff', color: '#1D4ED8', border: '1px solid #BFDBFE', borderRadius: 8, padding: '9px 18px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                      面接予定
                    </button>
                    <button onClick={() => handleStatusChange(app.id, 'offer')}
                      style={{ background: app.status === 'offer' ? '#F0FDF4' : '#fff', color: '#15803D', border: '1px solid #BBF7D0', borderRadius: 8, padding: '9px 18px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                      内定
                    </button>
                    <button onClick={() => handleStatusChange(app.id, 'rejected')}
                      style={{ background: app.status === 'rejected' ? '#FEF2F2' : '#fff', color: '#B91C1C', border: '1px solid #FECACA', borderRadius: 8, padding: '9px 18px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
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
