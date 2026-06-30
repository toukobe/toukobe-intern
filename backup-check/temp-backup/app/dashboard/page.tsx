'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

export default function DashboardRouter() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    async function route() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session:', session);
        setDebugInfo(`Session: ${session ? session.user.email : 'なし'}`);

        if (!session) {
          console.log('セッションなし → ログインページへ');
          router.push('/auth/login');
          return;
        }

        // ユーザータイプを取得
        const { data: userType, error } = await supabase
          .from('user_types')
          .select('user_type')
          .eq('user_id', session.user.id)
          .single();

        console.log('User Type:', userType);
        console.log('Error:', error);
        setDebugInfo(prev => prev + `\nUser Type: ${userType?.user_type || 'なし'}`);

        if (!userType) {
          console.log('ユーザータイプなし → ログインページへ');
          router.push('/auth/login');
          return;
        }

        // ユーザータイプで振り分け
        console.log(`ルーティング: ${userType.user_type}`);
        setDebugInfo(prev => prev + `\nルーティング先: ${userType.user_type}`);

        if (userType.user_type === 'admin') {
          console.log('Admin → /dashboard/admin へ');
          router.push('/dashboard/admin');
        } else if (userType.user_type === 'company') {
          console.log('Company → /dashboard/company へ');
          router.push('/dashboard/company');
        } else if (userType.user_type === 'student') {
          console.log('Student → /dashboard/student へ');
          router.push('/dashboard/student');
        } else {
          console.log('不明なタイプ → / へ');
          router.push('/');
        }
      } catch (err) {
        console.error('Error:', err);
        setDebugInfo(`エラー: ${err}`);
      } finally {
        setLoading(false);
      }
    }

    route();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <p className="text-xl font-medium text-gray-600 mb-4">読み込み中...</p>
        <div className="bg-white p-6 rounded-lg shadow max-w-md">
          <p className="text-sm text-gray-600 font-mono whitespace-pre-wrap">{debugInfo}</p>
        </div>
      </div>
    );
  }

  return null;
}