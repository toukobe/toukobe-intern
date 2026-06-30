'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

interface User {
  id: string;
  email?: string;
}

interface Job {
  id: string;
  job_title: string;
  salary: string;
  location: string;
  status: string;
}

interface Company {
  id: string;
  company_name: string;
  industry: string;
  contact_email: string;
  user_id?: string;
}

export default function CompanyDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditCompany, setShowEditCompany] = useState(false);
  const [editFormData, setEditFormData] = useState({
    company_name: '',
    industry: '',
    contact_email: '',
  });

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/company-login');
        return;
      }

      setUser(session.user as User);

      // ユーザーIDで企業を取得
      const { data: userTypeData } = await supabase
        .from('user_types')
        .select('company_id')
        .eq('user_id', session.user.id)
        .single();

      if (!userTypeData?.company_id) {
        router.push('/auth/company-login');
        return;
      }

      // 企業情報を取得
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('id', userTypeData.company_id)
        .single();

      if (companyData) {
        setCompany(companyData);
        setEditFormData({
          company_name: companyData.company_name,
          industry: companyData.industry,
          contact_email: companyData.contact_email,
        });
        await loadJobs(userTypeData.company_id);
      }

      setLoading(false);
    }

    checkAuth();
  }, [router]);

  const loadJobs = async (companyId: string) => {
    try {
      const { data } = await supabase
        .from('jobs')
        .select('id, job_title, salary, location, status')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      setJobs(data || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!company) return;

    try {
      const { error } = await supabase
        .from('companies')
        .update({
          company_name: editFormData.company_name,
          industry: editFormData.industry,
          contact_email: editFormData.contact_email,
        })
        .eq('id', company.id);

      if (error) throw error;

      setCompany({
        ...company,
        company_name: editFormData.company_name,
        industry: editFormData.industry,
        contact_email: editFormData.contact_email,
      });

      alert('企業情報を更新しました');
      setShowEditCompany(false);
    } catch (error) {
      alert('更新に失敗しました: ' + (error as any).message);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('この求人を削除しますか？')) return;

    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;

      setJobs(jobs.filter(j => j.id !== jobId));
      alert('求人を削除しました');
    } catch (error) {
      alert('削除に失敗しました');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl font-medium text-gray-600">読み込み中...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl font-medium text-gray-600">企業情報が見つかりません</p>
      </div>
    );
  }

  const draftJobs = jobs.filter(j => j.status === 'draft');
  const pendingJobs = jobs.filter(j => j.status === 'pending');
  const publishedJobs = jobs.filter(j => j.status === 'published');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ナビゲーション */}
      <nav className="bg-white shadow-sm border-b border-orange-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 mb-2"
            >
              <img
                src="/toukobe-intern-logo.png"
                alt="トウコベインターン"
                className="h-8 w-auto"
              />
            </button>
            <h1 className="text-2xl font-bold text-orange-600">
              {company.company_name}
            </h1>
            <p className="text-sm text-gray-600">{company.industry}</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/dashboard/company/applicants')}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              📋 応募者管理
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              ログアウト
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 企業情報セクション */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {company.company_name}
              </h2>
              <p className="text-lg text-gray-600 mb-4">{company.industry}</p>
              <p className="text-gray-600">
                📧 {company.contact_email}
              </p>
            </div>
            <button
              onClick={() => setShowEditCompany(!showEditCompany)}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              {showEditCompany ? 'キャンセル' : '✏️ 企業情報を編集'}
            </button>
          </div>

          {showEditCompany && (
            <form onSubmit={handleUpdateCompany} className="mt-8 pt-8 border-t border-gray-200 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  企業名
                </label>
                <input
                  type="text"
                  value={editFormData.company_name}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      company_name: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  業種
                </label>
                <input
                  type="text"
                  value={editFormData.industry}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      industry: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  企業メールアドレス
                </label>
                <input
                  type="email"
                  value={editFormData.contact_email}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      contact_email: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold"
              >
                更新する
              </button>
            </form>
          )}
        </div>

        {/* 求人投稿ボタン */}
        <div className="mb-12">
          <button
            onClick={() => router.push('/dashboard/post-job')}
            className="px-8 py-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:shadow-lg transition-all font-bold text-lg"
          >
            ➕ 新しい求人を投稿
          </button>
        </div>

        {/* 公開中の求人 */}
        {publishedJobs.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              ✅ 公開中の求人 ({publishedJobs.length})
            </h3>
            <div className="grid gap-6">
              {publishedJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">
                        {job.job_title}
                      </h4>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>📍 {job.location}</span>
                        <span>💰 {job.salary}</span>
                      </div>
                    </div>
                    <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold text-sm">
                      公開中
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => router.push(`/dashboard/edit-job/${job.id}`)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      📝 編集
                    </button>
                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      🗑️ 削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 承認待ちの求人 */}
        {pendingJobs.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              ⏳ 承認待ちの求人 ({pendingJobs.length})
            </h3>
            <div className="grid gap-6">
              {pendingJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">
                        {job.job_title}
                      </h4>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>📍 {job.location}</span>
                        <span>💰 {job.salary}</span>
                      </div>
                    </div>
                    <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-semibold text-sm">
                      承認待ち
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => router.push(`/dashboard/edit-job/${job.id}`)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      📝 編集
                    </button>
                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      🗑️ 削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 下書きの求人 */}
        {draftJobs.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              📝 下書き ({draftJobs.length})
            </h3>
            <div className="grid gap-6">
              {draftJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-lg shadow p-6 border-l-4 border-gray-400"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">
                        {job.job_title}
                      </h4>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>📍 {job.location}</span>
                        <span>💰 {job.salary}</span>
                      </div>
                    </div>
                    <span className="px-4 py-2 bg-gray-100 text-gray-800 rounded-full font-semibold text-sm">
                      下書き
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => router.push(`/dashboard/edit-job/${job.id}`)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      📝 編集
                    </button>
                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      🗑️ 削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 求人がない場合 */}
        {jobs.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-xl text-gray-600 mb-6">まだ求人がありません</p>
            <button
              onClick={() => router.push('/dashboard/post-job')}
              className="px-8 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-bold"
            >
              求人を投稿する
            </button>
          </div>
        )}
      </div>
    </div>
  );
}