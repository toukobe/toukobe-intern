'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

interface Job {
  id: string;
  job_title: string;
  salary: string;
  location: string;
  companies: {
    company_name: string;
  } | null;
}

interface User {
  id: string;
  email?: string;
}

interface UserType {
  user_type: string;
}

export default function Home() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);

  const categories = [
    'マーケティング',
    'エンジニア',
    'コンサルティング',
    '経営・企画',
    '営業',
    '金融・ファイナンス',
    'ライター・メディア',
    '経理',
    '人事・広報',
    'デザイナー',
    '事務・アシスタント',
    'その他',
  ];

  const categoryIcons: { [key: string]: string } = {
    'マーケティング': '📊',
    'エンジニア': '💻',
    'コンサルティング': '🎯',
    '経営・企画': '🚀',
    '営業': '💼',
    '金融・ファイナンス': '💰',
    'ライター・メディア': '✍️',
    '経理': '📈',
    '人事・広報': '👥',
    'デザイナー': '🎨',
    '事務・アシスタント': '📋',
    'その他': '⭐',
  };

  const locationIcons: { [key: string]: string } = {
    '東京': '🗼',
    '大阪': '🏯',
    '名古屋': '🏢',
    '福岡': '🌆',
    'リモート': '🏠',
  };

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user as User);

        const { data } = await supabase
          .from('user_types')
          .select('user_type')
          .eq('user_id', session.user.id)
          .single();

        if (data) {
          setUserType(data);
        }
      }
    }

    checkAuth();
  }, []);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select(`
            id,
            job_title,
            salary,
            location,
            companies (
              company_name
            )
          `);

        if (error) {
          console.error('データの取得に失敗しました:', error);
        } else {
          setJobs(data as Job[]);
        }
      } catch (err) {
        console.error('エラー:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, []);

  useEffect(() => {
    let filtered = jobs;

    if (searchQuery) {
      filtered = filtered.filter(
        (job) =>
          job.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.companies?.company_name
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    if (selectedLocation) {
      filtered = filtered.filter((job) => job.location === selectedLocation);
    }

    if (selectedCategory) {
      filtered = filtered.filter((job) => {
  const categories = Array.isArray(job.job_categories) 
    ? job.job_categories 
    : [];
  return categories.some(cat => cat.includes(selectedCategory));
});
    }

    setFilteredJobs(filtered);
  }, [jobs, searchQuery, selectedCategory, selectedLocation]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserType(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <div className="text-4xl">🔄</div>
          </div>
          <p className="text-xl font-medium text-gray-600 mt-4">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ナビゲーション */}
      <nav className="border-b border-gray-200 sticky top-0 z-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-2xl font-bold"
            >
              <span className="text-3xl">🎓</span>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                トウコべ
              </span>
            </button>

            <div className="flex items-center gap-6">
              {user ? (
                <>
                  {userType?.user_type === 'company' && (
                    <button
                      onClick={() => router.push('/dashboard/company')}
                      className="text-gray-700 hover:text-blue-600 font-medium transition-colors flex items-center gap-2"
                    >
                      <span>🏢</span> ダッシュボード
                    </button>
                  )}
                  {userType?.user_type === 'student' && (
                    <button
                      onClick={() => router.push('/dashboard/student')}
                      className="text-gray-700 hover:text-blue-600 font-medium transition-colors flex items-center gap-2"
                    >
                      <span>👤</span> マイページ
                    </button>
                  )}
                  {user.email === 'ru_matsumoto@manabiph.com' && (
                    <button
                      onClick={() => router.push('/dashboard/admin')}
                      className="text-gray-700 hover:text-blue-600 font-medium transition-colors flex items-center gap-2"
                    >
                      <span>⚙️</span> 管理者
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    ログアウト
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => router.push('/auth/login')}
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                  >
                    ログイン
                  </button>
                  <button
                    onClick={() => router.push('/auth/signup')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    登録
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ヒーローセクション */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-24 relative overflow-hidden">
        {/* 背景装飾 */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="text-6xl mb-4">🚀</div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              あなたのキャリアの第一歩を
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              優良企業のインターン求人を、簡単に見つけられる
            </p>
          </div>

          {/* 検索バー */}
          <div className="max-w-3xl mx-auto mb-12">
            <div className="bg-white rounded-2xl shadow-xl p-1 flex flex-col md:flex-row gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-6 py-4 focus:outline-none text-gray-900 placeholder-gray-500 rounded-xl"
                placeholder="職種や企業名で検索..."
              />
              <button className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium md:rounded-r-2xl">
                🔍 検索
              </button>
            </div>
          </div>

          {/* フィルター */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="relative">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                💼 職種を選ぶ
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">すべての職種</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {categoryIcons[cat]} {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                📍 勤務地を選ぶ
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">すべての地域</option>
                <option value="東京">🗼 東京</option>
                <option value="大阪">🏯 大阪</option>
                <option value="名古屋">🏢 名古屋</option>
                <option value="福岡">🌆 福岡</option>
                <option value="リモート">🏠 リモート</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* おすすめ求人セクション */}
        {jobs.length > 0 && (
          <div className="mb-24">
            <div className="mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-2">
                ⭐ おすすめのインターン
              </h2>
              <p className="text-lg text-gray-600">
                人気の求人をピックアップしました
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {jobs.slice(0, 3).map((job) => {
                const category = categories.find((c) =>
                  job.job_title.includes(c)
                );
                return (
                  <div
                    key={job.id}
                    className="bg-white border-2 border-gray-200 rounded-2xl hover:shadow-2xl hover:border-blue-300 transition-all cursor-pointer overflow-hidden group"
                    onClick={() => {
                      if (user) {
                        router.push(`/jobs/${job.id}`);
                      } else {
                        router.push('/auth/login');
                      }
                    }}
                  >
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-24 flex items-center justify-center">
                      <span className="text-6xl">
                        {categoryIcons[category || 'その他']}
                      </span>
                    </div>

                    <div className="p-6">
                      <p className="text-sm font-bold text-blue-600 mb-2 uppercase tracking-wider">
                        {job.companies?.company_name || '企業名不明'}
                      </p>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-4">
                        {job.job_title}
                      </h3>

                      <div className="space-y-3 mb-6 text-sm text-gray-600">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">
                            {locationIcons[job.location] || '📍'}
                          </span>
                          <span>{job.location || '未設定'}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">💰</span>
                          <span className="font-semibold text-gray-900">
                            {job.salary || '未設定'}
                          </span>
                        </div>
                      </div>

                      <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all group-hover:shadow-lg">
                        詳細を見る →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 求人一覧セクション */}
        <div>
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              📋 インターン求人一覧
            </h2>
            {filteredJobs.length > 0 && (
              <p className="text-lg text-gray-600">
                {filteredJobs.length} 件の求人が見つかりました
              </p>
            )}
          </div>

          {filteredJobs.length === 0 ? (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-20 text-center border-2 border-dashed border-gray-300">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-xl text-gray-600 mb-2">
                条件に該当する求人がありません
              </p>
              <p className="text-gray-500 mb-6">
                検索条件を変更して、もう一度試してみてください
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('');
                  setSelectedLocation('');
                }}
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                フィルターをリセット
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredJobs.map((job) => {
                const category = categories.find((c) =>
                  job.job_title.includes(c)
                );
                return (
                  <div
                    key={job.id}
                    className="bg-white border-2 border-gray-200 rounded-2xl hover:shadow-2xl hover:border-blue-300 transition-all cursor-pointer overflow-hidden group"
                    onClick={() => {
                      if (user) {
                        router.push(`/jobs/${job.id}`);
                      } else {
                        router.push('/auth/login');
                      }
                    }}
                  >
                    <div className="bg-gradient-to-r from-blue-400 to-indigo-400 h-20 flex items-center justify-center">
                      <span className="text-5xl">
                        {categoryIcons[category || 'その他']}
                      </span>
                    </div>

                    <div className="p-6">
                      <p className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-wider">
                        {job.companies?.company_name || '企業名不明'}
                      </p>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-4">
                        {job.job_title}
                      </h3>

                      <div className="space-y-2 mb-6 text-sm text-gray-600">
                        <div className="flex items-center">
                          <span className="text-xl mr-2">
                            {locationIcons[job.location] || '📍'}
                          </span>
                          <span>{job.location || '未設定'}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xl mr-2">💰</span>
                          <span className="font-semibold text-gray-900">
                            {job.salary || '未設定'}
                          </span>
                        </div>
                      </div>

                      <button className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all group-hover:shadow-lg">
                        詳細を見る
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* フッター */}
      <footer className="bg-gradient-to-b from-gray-900 to-black text-white mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div>
              <div className="flex items-center gap-2 text-2xl font-bold mb-4">
                <span className="text-3xl">🎓</span> トウコべ
              </div>
              <p className="text-gray-400 text-sm">
                大学生のキャリア形成を応援するインターン求人サイト
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-lg">👨‍🎓 学生向け</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>
                  <button
                    onClick={() => router.push('/')}
                    className="hover:text-white transition-colors flex items-center gap-2"
                  >
                    📋 求人一覧
                  </button>
                </li>
                <li>
                  <button className="hover:text-white transition-colors flex items-center gap-2">
                    ❓ よくある質問
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-lg">🏢 企業向け</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>
                  <button
                    onClick={() => router.push('/auth/company-login')}
                    className="hover:text-white transition-colors flex items-center gap-2"
                  >
                    🔐 企業ログイン
                  </button>
                </li>
                <li>
                  <button className="hover:text-white transition-colors flex items-center gap-2">
                    📧 お問い合わせ
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-lg">⚙️ その他</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>
                  <button className="hover:text-white transition-colors">
                    🔒 プライバシーポリシー
                  </button>
                </li>
                <li>
                  <button className="hover:text-white transition-colors">
                    📜 利用規約
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 トウコべインターン. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}