'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';

const ADMIN_EMAIL = 'ru_matsumoto@manabiph.com';

// OAuth / メール確認リンクの着地ページ。
// セッションはブラウザ側(localStorage)で管理しているため、
// コールバック処理は必ずクライアントで行う必要がある。
// - implicitフロー: URLハッシュのトークンを supabase-js が自動検出する
// - PKCEフロー: ?code= をブラウザ側で交換する（code_verifier はlocalStorageにある）
function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let unsubscribe: (() => void) | undefined;

    async function routeByUserType(userId: string, email?: string) {
      if (email === ADMIN_EMAIL) { router.replace('/dashboard/admin'); return; }
      const { data: ut } = await supabase
        .from('user_types')
        .select('user_type')
        .eq('user_id', userId)
        .maybeSingle();
      if (cancelled) return;
      if (!ut) {
        // 初回OAuthログイン — 学生/企業の選択へ
        router.replace('/auth/setup');
        return;
      }
      const redirect = searchParams.get('redirect');
      if (ut.user_type === 'company') { router.replace('/dashboard/company'); return; }
      if (ut.user_type === 'student') { router.replace(redirect || '/dashboard/student'); return; }
      router.replace('/');
    }

    async function handleCallback() {
      // プロバイダ側でキャンセル・失敗した場合
      if (searchParams.get('error') || searchParams.get('error_description')) {
        router.replace('/auth/login?error=oauth');
        return;
      }

      // PKCEフロー
      const code = searchParams.get('code');
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error && data.session) {
          await routeByUserType(data.session.user.id, data.session.user.email);
          return;
        }
      }

      // implicitフロー: すでに検出済みならそのまま進む
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await routeByUserType(session.user.id, session.user.email);
        return;
      }

      // code もハッシュトークンも無い直接アクセスは即ログインへ
      if (!code && !window.location.hash.includes('access_token')) {
        router.replace('/auth/login');
        return;
      }

      // ハッシュの解析がまだなら SIGNED_IN を待つ（8秒でタイムアウト）
      timeoutId = setTimeout(() => {
        if (!cancelled) router.replace('/auth/login?error=callback_failed');
      }, 8000);
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
        if (s && !cancelled) {
          if (timeoutId) clearTimeout(timeoutId);
          subscription.unsubscribe();
          routeByUserType(s.user.id, s.user.email);
        }
      });
      unsubscribe = () => subscription.unsubscribe();
    }

    handleCallback();
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (unsubscribe) unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF8F4', fontFamily: 'var(--font-sans)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: '3px solid #F2620C', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin .8s linear infinite' }} />
        <p style={{ color: '#57514A', fontSize: 14, margin: 0 }}>ログイン処理中...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF8F4' }}>
        <div style={{ width: 44, height: 44, border: '3px solid #F2620C', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      </div>
    }>
      <CallbackInner />
    </Suspense>
  );
}
