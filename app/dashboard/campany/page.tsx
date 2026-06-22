'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

interface User {
  id: string;
  email?: string;
}

interface Company {
  id: string;
  company_name: string;
  industry: string;
  contact_email: string;
}

interface Job {
  id: string;
  job_title: string;
  salary: string;
  location: string;
  job_description: string;
  requirements: string;
  created_at: string;
  application_count?: number;
}

interface Application {
  id: string;
  user_id: string;
  job_id: string;
  status: string;
  created_at: string;
  student_profiles?: {
    name: string;
    email: string;
  };
  jobs?: {
    job_title: string;
  };
}

export default function CompanyDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'jobs' | 'applications' | 'messages'>('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
<div className="mb-6 flex justify-between items-center gap-3">
  <h2 className="text-xl font-bold text-gray-800">掲載中の求人</h2>
  <div className="flex gap-3">
    <button
      onClick={() => router.push('/dashboard/company/applicants')}
      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
    >
      👥 応募者一覧
    </button>
    <button
      onClick={() => router.push('/dashboard/post-job')}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      新しい求人を投稿
    </button>
  </div>
</div>
      // user_type を確認
      const { data: userType } = await supabase
        .from('user_types')
        .select('company_id')
        .eq('user_id', session.user.id)
        .single();

      if (!userType?.company_id) {
        await supabase.auth.signOut();
        router.push('/auth/company-login');
        return;
      }

      // 企業情報を取得
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('id', userType.company_id)
        .single();

      if (companyData) {
        setCompany(companyData);
        await loadJobs(userType.company_id);
        await loadApplications(userType.company_id);
      }

      setLoading(false);
    }

    checkAuth();
  }, [router]);

  const loadJobs = async (companyId: string) => {
    try {
      const { data } = await supabase
        .from('jobs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (data) {
        // 各求人の応募数を取得
        const jobsWithCounts = await Promise.all(
          data.map(async (job) => {
            const { count } = await supabase
              .from('applications')
              .select('*', { count: 'exact', head: true })
              .eq('job_id', job.id);
            return { ...job, application_count: count || 0 };
          })
        );
        setJobs(jobsWithCounts);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  };

  const loadApplications = async (companyId: string) => {
    try {
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id')
        .eq('company_id', companyId);

      if (jobs && jobs.length > 0) {
        const jobIds = jobs.map((j) => j.id);

        const { data: appsData } = await supabase
          .from('applications')
          .select(`
            *,
            student_profiles(name),
            jobs(job_title)
          `)
          .in('job_id', jobIds)
          .order('created_at', { ascending: false });

        setApplications(appsData || []);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
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

      setJobs(jobs.filter((j) => j.id !== jobId));
      alert('求人を削除しました');
    } catch (error) {
      alert('削除に失敗しました');
    }
  };

  const handleUpdateApplicationStatus = async (
    applicationId: string,
    newStatus: string
  ) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) throw error;

      // 画面を更新
      setApplications(
        applications.map((app) =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
    } catch (error) {
      alert('ステータス更新に失敗しました');
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
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{company?.company_name}</h1>
            <p className="text-sm text-gray-600">{company?.industry}</p>
          </div>
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
              onClick={() => setActiveTab('jobs')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'jobs'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              掲載中の求人
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'applications'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              応募者管理
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'messages'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              メッセージ
            </button>
          </div>
        </div>

        {/* 掲載中の求人タブ */}
        {activeTab === 'jobs' && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">掲載中の求人</h2>
              <button
                onClick={() => router.push('/dashboard/post-job')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                新しい求人を投稿
              </button>
            </div>

            {jobs.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500 mb-4">掲載中の求人はありません</p>
                <button
                  onClick={() => router.push('/dashboard/post-job')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  求人を投稿する
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div key={job.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-800">{job.job_title}</h3>
                        <p className="text-sm text-gray-600 mt-2">
                          📍 {job.location} | 💰 {job.salary}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{job.application_count}</p>
                        <p className="text-sm text-gray-600">応募者</p>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4 line-clamp-2">{job.job_description}</p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/jobs/${job.id}`)}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        詳細を見る
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/edit-job/${job.id}`)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 応募者管理タブ */}
        {activeTab === 'applications' && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-6">応募者管理</h2>

            {applications.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500">応募はまだありません</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        学生名
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        求人
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        ステータス
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        応募日
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {applications.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {(app.student_profiles as any)?.name || '不明'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {(app.jobs as any)?.job_title || '不明'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <select
                            value={app.status}
                            onChange={(e) =>
                              handleUpdateApplicationStatus(app.id, e.target.value)
                            }
                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="pending">検討中</option>
                            <option value="interview">面接予定</option>
                            <option value="offer">内定</option>
                            <option value="rejected">不採用</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(app.created_at).toLocaleDateString('ja-JP')}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button className="text-blue-600 hover:underline">
                            メッセージ送信
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* メッセージタブ */}
        {activeTab === 'messages' && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-6">メッセージ</h2>
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500">メッセージ機能は近日公開予定です</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}