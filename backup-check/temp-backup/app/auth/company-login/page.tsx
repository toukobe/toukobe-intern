'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

export default function CompanyLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      // ユーザータイプを確認
      const { data: userType } = await supabase
        .from('user_types')
        .select('user_type')
        .eq('user_id', data.user.id)
        .single();

      // 管理者ならadminページへ、企業なら企業ダッシュボードへ
      if (userType?.user_type === 'admin') {
        router.push('/dashboard/admin');
      } else if (userType?.user_type === 'company') {
        router.push('/dashboard/company');
      } else {
        router.push('/');
      }
    } catch (err) {
      setError('ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">ログイン</h1>
        <p className="text-gray-600 mb-8">メールアドレスでログインしてください</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="example@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <div className="mt-6 space-y-3">
          <p className="text-center text-gray-600">
            アカウントがまだありませんか？{' '}
            <button
              onClick={() => router.push('/auth/signup')}
              className="text-orange-600 hover:underline font-medium"
            >
              登録する
            </button>
          </p>

          <p className="text-center text-gray-600 text-sm border-t pt-3">
            学生の方は{' '}
            <button
              onClick={() => router.push('/auth/login')}
              className="text-orange-600 hover:underline font-medium"
            >
              こちら
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}