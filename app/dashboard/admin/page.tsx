'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

interface User {
  id: string;
  email?: string;
}

interface Stats {
  totalUsers: number;
  totalStudents: number;
  totalCompanies: number;
  totalJobs: number;
  totalApplications: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalStudents: 0,
    totalCompanies: 0,
    totalJobs: 0,
    totalApplications: 0,
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'interactions' | 'docs'>('overview');

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session || session.user.email !== 'ru_matsumoto@manabiph.com') {
        router.push('/');
        return;
      }

      setUser(session.user as User);
      await loadStats();
      setLoading(false);
    }

    checkAuth();
  }, [router]);

  const loadStats = async () => {
    try {
      // ユーザー統計
      const { count: studentCount } = await supabase
        .from('user_types')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'student');

      const { count: companyCount } = await supabase
        .from('user_types')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'company');

      const { count: jobCount } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true });

      const { count: applicationCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: (studentCount || 0) + (companyCount || 0),
        totalStudents: studentCount || 0,
        totalCompanies: companyCount || 0,
        totalJobs: jobCount || 0,
        totalApplications: applicationCount || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl font-medium text-gray-600">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ナビゲーション */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">管理者ダッシュボード</h1>
          <button
            onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            ログアウト
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* タブナビゲーション */}
        <div className="mb-8 border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              概要
            </button>
            <button
              onClick={() => setActiveTab('companies')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'companies'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              企業管理
            </button>
            <button
              onClick={() => setActiveTab('interactions')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'interactions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              やり取り
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'docs'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              API ドキュメント
            </button>
          </div>
        </div>

        {/* 概要タブ */}
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-6">統計情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500 text-sm mb-2">総ユーザー数</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalUsers}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500 text-sm mb-2">学生</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalStudents}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500 text-sm mb-2">企業</p>
                <p className="text-3xl font-bold text-green-600">{stats.totalCompanies}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500 text-sm mb-2">掲載中の求人</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalJobs}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500 text-sm mb-2">応募数</p>
                <p className="text-3xl font-bold text-orange-600">{stats.totalApplications}</p>
              </div>
            </div>
          </div>
        )}

        {/* 企業管理タブ */}
        {activeTab === 'companies' && (
          <AdminCompaniesTab />
        )}

        {/* やり取りタブ */}
        {activeTab === 'interactions' && (
          <AdminInteractionsTab />
        )}

        {/* APIドキュメントタブ */}
        {activeTab === 'docs' && (
          <AdminDocsTab />
        )}
      </div>
    </div>
  );
}

// 企業管理タブコンポーネント
function AdminCompaniesTab() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    industry: '',
    contact_email: '',
    login_email: '',
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const { data } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // 企業をデータベースに追加
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert([{
          company_name: formData.company_name,
          industry: formData.industry,
          contact_email: formData.contact_email,
        }])
        .select()
        .single();

      if (companyError) throw companyError;

      // Supabase Auth でユーザーを作成
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.login_email,
        password: Math.random().toString(36).slice(-12),
        email_confirm: true,
      });

      if (authError) throw authError;

      // user_types テーブルに企業として登録
      const { error: typeError } = await supabase
        .from('user_types')
        .insert([{
          user_id: authData.user.id,
          user_type: 'company',
          company_id: company.id,
        }]);

      if (typeError) throw typeError;

      // ログイン情報をメール送信（実装は後で）
      alert(`企業を追加しました。\nメールアドレス: ${formData.login_email}\nパスワードをメールで送信してください。`);

      setFormData({
        company_name: '',
        industry: '',
        contact_email: '',
        login_email: '',
      });
      setShowForm(false);
      loadCompanies();
    } catch (error) {
      alert('企業の追加に失敗しました: ' + (error as any).message);
    }
  };

  if (loading) {
    return <p>読み込み中...</p>;
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">企業管理</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'キャンセル' : '企業を追加'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">新規企業登録</h3>
          <form onSubmit={handleAddCompany} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                企業名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                業種 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: IT、コンサルティング"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                企業メール <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ログインメール <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.login_email}
                onChange={(e) => setFormData({ ...formData, login_email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              企業を登録
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">企業名</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">業種</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">メール</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {companies.map((company) => (
              <tr key={company.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{company.company_name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{company.industry}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{company.contact_email}</td>
                <td className="px-6 py-4 text-sm">
                  <button className="text-blue-600 hover:underline">編集</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// やり取りタブコンポーネント
function AdminInteractionsTab() {
  const [interactions, setInteractions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInteractions();
  }, []);

  const loadInteractions = async () => {
    try {
      const { data } = await supabase
        .from('messages')
        .select('*, auth.users!from_user_id(email), auth.users!to_user_id(email)')
        .order('created_at', { ascending: false })
        .limit(50);
      setInteractions(data || []);
    } catch (error) {
      console.error('Error loading interactions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p>読み込み中...</p>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">学生と企業のやり取り</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">送信者</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">受信者</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">メッセージ</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">日時</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {interactions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  やり取りはまだありません
                </td>
              </tr>
            ) : (
              interactions.map((interaction) => (
                <tr key={interaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {(interaction as any).auth.users?.[0]?.email || '不明'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {(interaction as any).auth.users?.[1]?.email || '不明'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-xs">
                    {interaction.message_text}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(interaction.created_at).toLocaleString('ja-JP')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// APIドキュメントタブコンポーネント
function AdminDocsTab() {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">API ドキュメント</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="prose prose-sm max-w-none">
          <h3 className="text-lg font-bold text-gray-800 mb-4">トウコべインターン API</h3>

          <h4 className="font-bold text-gray-700 mt-6 mb-3">認証エンドポイント</h4>
          <div className="bg-gray-100 p-4 rounded mb-4 font-mono text-sm">
            <p>POST /api/auth/login</p>
            <p>POST /api/auth/logout</p>
            <p>POST /api/auth/register</p>
          </div>

          <h4 className="font-bold text-gray-700 mt-6 mb-3">求人エンドポイント</h4>
          <div className="bg-gray-100 p-4 rounded mb-4 font-mono text-sm">
            <p>GET /api/jobs - 求人一覧取得</p>
            <p>GET /api/jobs/:id - 求人詳細取得</p>
            <p>POST /api/jobs - 求人作成（企業のみ）</p>
            <p>PUT /api/jobs/:id - 求人更新（企業のみ）</p>
            <p>DELETE /api/jobs/:id - 求人削除（企業のみ）</p>
          </div>

          <h4 className="font-bold text-gray-700 mt-6 mb-3">応募エンドポイント</h4>
          <div className="bg-gray-100 p-4 rounded mb-4 font-mono text-sm">
            <p>GET /api/applications - 応募一覧（学生向け）</p>
            <p>POST /api/applications - 応募作成</p>
            <p>PUT /api/applications/:id - 応募ステータス更新</p>
          </div>

          <h4 className="font-bold text-gray-700 mt-6 mb-3">メッセージエンドポイント</h4>
          <div className="bg-gray-100 p-4 rounded mb-4 font-mono text-sm">
            <p>GET /api/messages - メッセージ一覧取得</p>
            <p>POST /api/messages - メッセージ送信</p>
          </div>

          <p className="text-gray-600 mt-6">
            詳細はSupabase APIドキュメントを参照してください。
          </p>
        </div>
      </div>
    </div>
  );
}