'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

interface ChatMessage {
  id: string;
  application_id: string;
  sender_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

interface AppInfo {
  id: string;
  user_id: string; // student's user_id
  job_title: string;
  company_name: string;
  student_name: string;
  company_id: string;
}

const FF = "'Zen Kaku Gothic New', sans-serif";

export default function ChatPage() {
  const { applicationId } = useParams() as { applicationId: string };
  const router = useRouter();

  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [role, setRole] = useState<'student' | 'company' | null>(null);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { document.title = 'メッセージ | トウコべインターン'; return () => { document.title = 'トウコべインターン'; }; }, []);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Create channel synchronously with unique name to avoid StrictMode conflicts
    const channelName = `chat-${applicationId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `application_id=eq.${applicationId}` },
        (payload) => {
          setMessages(prev => {
            if (prev.some(m => m.id === (payload.new as ChatMessage).id)) return prev;
            return [...prev, payload.new as ChatMessage];
          });
          setMyUserId(uid => {
            if (uid && (payload.new as ChatMessage).sender_id !== uid) {
              supabase.from('chat_messages').update({ is_read: true }).eq('id', (payload.new as ChatMessage).id);
            }
            return uid;
          });
        }
      )
      .subscribe();

    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth/login'); return; }
      const uid = session.user.id;
      setMyUserId(uid);

      const { data: ut } = await supabase
        .from('user_types')
        .select('user_type, company_id')
        .eq('user_id', uid)
        .single();
      if (!ut) { setError('認証情報が確認できません'); setLoading(false); return; }
      setRole(ut.user_type as 'student' | 'company');

      const { data: app } = await supabase
        .from('applications')
        .select('id, user_id, job_id')
        .eq('id', applicationId)
        .single();
      if (!app) { setError('応募情報が見つかりません'); setLoading(false); return; }

      if (ut.user_type === 'student' && app.user_id !== uid) {
        setError('アクセス権がありません'); setLoading(false); return;
      }

      const { data: job } = await supabase
        .from('jobs')
        .select('job_title, company_id')
        .eq('id', app.job_id)
        .single();
      if (!job) { setError('求人情報が見つかりません'); setLoading(false); return; }

      if (ut.user_type === 'company' && job.company_id !== ut.company_id) {
        setError('アクセス権がありません'); setLoading(false); return;
      }

      const { data: company } = await supabase
        .from('companies')
        .select('company_name')
        .eq('id', job.company_id)
        .single();

      const { data: profile } = await supabase
        .from('student_profiles')
        .select('name')
        .eq('user_id', app.user_id)
        .maybeSingle();

      setAppInfo({
        id: app.id,
        user_id: app.user_id,
        job_title: job.job_title,
        company_name: company?.company_name || '企業名不明',
        student_name: profile?.name || '学生',
        company_id: job.company_id,
      });

      const { data: msgs } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: true });
      setMessages((msgs as ChatMessage[]) || []);

      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('application_id', applicationId)
        .neq('sender_id', uid)
        .eq('is_read', false);

      setLoading(false);
    }

    init();
    return () => { supabase.removeChannel(channel); };
  }, [applicationId, router]);

  const handleSend = async () => {
    if (!input.trim() || !myUserId || sending) return;
    const body = input.trim();
    setInput('');
    setSending(true);

    // Optimistic add
    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      application_id: applicationId,
      sender_id: myUserId,
      body,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);

    const { data, error: sendErr } = await supabase
      .from('chat_messages')
      .insert({ application_id: applicationId, sender_id: myUserId, body })
      .select()
      .single();

    if (sendErr) {
      // Rollback optimistic
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInput(body);
      showToast('送信に失敗しました', 'error');
    } else if (data) {
      // Replace optimistic with real
      setMessages(prev => prev.map(m => m.id === tempId ? data as ChatMessage : m));
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const backUrl = role === 'company' ? '/dashboard/company/applicants' : '/dashboard/student';

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF8F4', fontFamily: FF }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #F2620C', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 14px', animation: 'spin .8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF8F4', fontFamily: FF }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 16, color: '#B91C1C', marginBottom: 20 }}>{error}</p>
        <button onClick={() => router.back()} style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontFamily: FF, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>戻る</button>
      </div>
    </div>
  );

  const otherName = role === 'student' ? appInfo?.company_name : appInfo?.student_name;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const isSameDay = d.toDateString() === now.toDateString();
    return isSameDay
      ? d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Group messages by date
  const groupedMessages: { date: string; msgs: ChatMessage[] }[] = [];
  messages.forEach(msg => {
    const date = new Date(msg.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === date) { last.msgs.push(msg); }
    else { groupedMessages.push({ date, msgs: [msg] }); }
  });

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#FBF8F4', fontFamily: FF, color: '#1C1813' }}>
      <link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;700;900&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: toast.type === 'error' ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${toast.type === 'error' ? '#FECACA' : '#BBF7D0'}`, color: toast.type === 'error' ? '#B91C1C' : '#15803D', borderRadius: 12, padding: '14px 24px', fontWeight: 700, fontSize: 14, boxShadow: '0 8px 32px rgba(0,0,0,.12)', whiteSpace: 'nowrap' }}>
          {toast.type === 'success' ? '✓ ' : '✕ '}{toast.msg}
        </div>
      )}

      {/* HEADER */}
      <div style={{ background: '#fff', borderBottom: '1px solid #EFE8DF', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0, position: 'sticky', top: 0, zIndex: 50 }}>
        <button
          onClick={() => router.push(backUrl)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', color: '#57514A', fontSize: 20, lineHeight: 1, borderRadius: 8 }}
          title="戻る"
        >←</button>
        <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#FFF1E8', border: '1px solid #FBD5C0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
          {role === 'student' ? '🏢' : '🎓'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{otherName}</div>
          <div style={{ fontSize: 12, color: '#938B81', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appInfo?.job_title}</div>
        </div>
      </div>

      {/* MESSAGES */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
            <p style={{ fontSize: 14, color: '#938B81' }}>まだメッセージはありません。<br />最初のメッセージを送ってみましょう。</p>
          </div>
        )}

        {groupedMessages.map(group => (
          <div key={group.date}>
            {/* Date separator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#EFE8DF' }} />
              <span style={{ fontSize: 11, color: '#B6ADA2', whiteSpace: 'nowrap', fontFamily: "'IBM Plex Mono',monospace" }}>{group.date}</span>
              <div style={{ flex: 1, height: 1, background: '#EFE8DF' }} />
            </div>

            {group.msgs.map(msg => {
              const isMine = msg.sender_id === myUserId;
              return (
                <div key={msg.id} style={{ display: 'flex', flexDirection: isMine ? 'row-reverse' : 'row', gap: 8, marginBottom: 14, alignItems: 'flex-end' }}>
                  {/* Avatar */}
                  {!isMine && (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#FFF1E8', border: '1px solid #FBD5C0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                      {role === 'student' ? '🏢' : '🎓'}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                    <div style={{
                      background: isMine ? '#F2620C' : '#fff',
                      color: isMine ? '#fff' : '#1C1813',
                      border: isMine ? 'none' : '1px solid #EFE8DF',
                      borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      padding: '10px 14px',
                      fontSize: 14,
                      lineHeight: 1.65,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      boxShadow: isMine ? '0 2px 8px rgba(242,98,12,.25)' : '0 1px 4px rgba(28,24,19,.06)',
                    }}>
                      {msg.body}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <span style={{ fontSize: 10, color: '#B6ADA2' }}>{formatTime(msg.created_at)}</span>
                      {isMine && <span style={{ fontSize: 10, color: msg.is_read ? '#F2620C' : '#B6ADA2' }}>{msg.is_read ? '既読' : '送信済'}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div style={{ background: '#fff', borderTop: '1px solid #EFE8DF', padding: '12px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', maxWidth: 800, margin: '0 auto' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力… (Enter で送信 / Shift+Enter で改行)"
            rows={1}
            style={{
              flex: 1,
              border: '1px solid #EFE8DF',
              borderRadius: 12,
              padding: '12px 16px',
              fontFamily: FF,
              fontSize: 14,
              color: '#1C1813',
              outline: 'none',
              resize: 'none',
              lineHeight: 1.6,
              maxHeight: 120,
              overflowY: 'auto',
              boxSizing: 'border-box',
            }}
            onInput={e => {
              const el = e.target as HTMLTextAreaElement;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 120) + 'px';
            }}
            onFocus={e => (e.target.style.borderColor = '#F2620C')}
            onBlur={e => (e.target.style.borderColor = '#EFE8DF')}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            style={{
              width: 48, height: 48, borderRadius: 12, border: 'none', flexShrink: 0,
              background: input.trim() && !sending ? '#F2620C' : '#EFE8DF',
              color: input.trim() && !sending ? '#fff' : '#B6ADA2',
              cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, transition: '.15s',
              boxShadow: input.trim() && !sending ? '0 4px 12px rgba(242,98,12,.3)' : 'none',
            }}
          >
            {sending ? '…' : '↑'}
          </button>
        </div>
        <p style={{ fontSize: 11, color: '#B6ADA2', textAlign: 'center', margin: '8px 0 0' }}>Enter で送信 ／ Shift+Enter で改行</p>
      </div>
    </div>
  );
}
