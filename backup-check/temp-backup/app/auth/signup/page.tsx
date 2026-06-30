'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

export default function SignupPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<'student' | 'company' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userType) {
      setError('ユーザータイプを選択してください');
      return;
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上で設定してください');
      return;
    }

    setLoading(true);

    try {
      // ユーザーを作成
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signupError) {
        setError(signupError.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError('ユーザー作成に失敗しました');
        setLoading(false);
        return;
      }

      // 企業の場合、企業情報を作成
      let companyId = null;
      if (userType === 'company') {
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .insert([
            {
              company_name: companyName,
              industry: industry,
              contact_email: contactEmail,
            },
          ])
          .select()
          .single();

        if (companyError) {
          setError('企業情報の作成に失敗しました');
          setLoading(false);
          return;
        }

        companyId = companyData.id;
      }

      // ユーザータイプを保存
      const { error: typeError } = await supabase.from('user_types').insert([
        {
          user_id: data.user.id,
          user_type: userType,
          company_id: companyId,
        },
      ]);

      if (typeError) {
        setError('ユーザータイプの保存に失敗しました');
        setLoading(false);
        return;
      }

      alert('登録しました！ログインしてください');
      router.push('/auth/login');
    } catch (err) {
      setError('登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // ユーザータイプ選択画面
  if (!userType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">新規登録</h1>
          <p className="text-gray-600 mb-8">アカウントタイプを選択してください</p>

          <div className="space-y-4">
            <button
              onClick={() => setUserType('student')}
              className="w-full p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <div className="text-2xl mb-2">👨‍🎓</div>
              <div className="font-bold text-gray-800">学生</div>
              <div className="text-sm text-gray-600">インターン求人を探す</div>
            </button>

            <button
              onClick={() => setUserType('company')}
              className="w-full p-6 border-2 border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
            >
              <div className="text-2xl mb-2">🏢</div>
              <div className="font-bold text-gray-800">企業</div>
              <div className="text-sm text-gray-600">インターン求人を投稿</div>
            </button>
          </div>

          <p className="mt-6 text-center text-gray-600">
            すでにアカウントがありますか？{' '}
            <button
              onClick={() => router.push('/auth/login')}
              className="text-blue-600 hover:underline font-medium"
            >
              ログイン
            </button>
          </p>
        </div>
      </div>
    );
  }

  // 登録フォーム画面
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <button
          onClick={() => setUserType(null)}
          className="mb-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
        >
          ← 戻る
        </button>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {userType === 'student' ? '学生として登録' : '企業として登録'}
        </h1>
        <p className="text-gray-600 mb-8">アカウントを作成してください</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          {/* 企業の場合のフォーム */}
          {userType === 'company' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  企業名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="例: 株式会社ABC"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  業種 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="例: IT・ソフトウェア"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  企業メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="company@example.com"
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="example@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              パスワード <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
            <p className="text-xs text-gray-500 mt-1">6文字以上で設定してください</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              パスワード（確認） <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? '登録中...' : '登録する'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          すでにアカウントがありますか？{' '}
          <button
            onClick={() => router.push('/auth/login')}
            className="text-blue-600 hover:underline font-medium"
          >
            ログイン
          </button>
        </p>
      </div>
    </div>
  );
}