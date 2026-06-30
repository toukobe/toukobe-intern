'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

interface Application {
  id: string;
  status: string;
  created_at: string;
  user_id: string;
  job_id: string;
}

interface User {
  id: string;
  email?: string;
}

export default function ApplicantsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/company-login');
        return;
      }

      setUser(session.user as User);

      const { data: userType } = await supabase
        .from('user_types')
        .select('company_id')
        .eq('user_id', session.user.id)
        .single();

      if (!userType?.company_id) {
        router.push('/auth/company-login');
        return;
      }

      setCompanyId(userType.company_id);
    }

    checkAuth();
  }, [router]);

  useEffect(() => {
    async function fetchApplications() {
      if (!companyId) return;

      try {
        // 企業の求人を取得
        const { data: jobs } = await supabase
          .from('jobs')
          .select('id')
          .eq('company_id', companyId);

        const jobIds = jobs?.map(j => j.id) || [];

        if (jobIds.length === 0) {
          setApplications([]);
          setLoading(false);
          return;
        }

        // 応募情報を取得
        const { data: appsData } = await supabase
          .from('applications')
          .select('id, status, created_at, user_id, job_id, jobs(job_title)')
          .in('job_id', jobIds)
          .order('created_at', { ascending: false });

        if (!appsData) {
          setApplications([]);
          setLoading(false);
          return;
        }

        // 各応募者の詳細情報を取得
        const appsWithProfiles = await Promise.all(
          (appsData as any[]).map(async (app) => {
            const { data: profile } = await supabase
              .from('student_profiles')
              .select('name, university, grade')
              .eq('user_id', app.user_id)
              .single();

            return {
              ...app,
              profile: profile || { name: '不明', university: '不明', grade: '不明' }
            };
          })
        );

        setApplications(appsWithProfiles);
      } catch (err) {
        console.error('Error:', err);
        setError('応募者データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    }

    fetchApplications();
  }, [companyId]);

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) throw error;

      setApplications(applications.map(app =>
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));

      alert('ステータスを更新しました');
    } catch (err) {
      console.error('Error:', err);
      setError('更新に失敗しました');
    }
  };

  const filteredApplications = filterStatus === 'all'
    ? applications
    : applications.filter(app => app.status === filterStatus);

  const statusColors: { [key: string]: string } = {
    pending: 'bg-yellow-100 text-yellow-800',
    interview: 'bg-blue-100 text-blue-800',
    offer: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  const statusLabels: { [key: string]: string } = {
    pending: '検討中',
    interview: '面接予定',
    offer: '内定',
    rejected: '不採用',
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
      <nav className="bg-white shadow-sm border-b border-orange-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard/company')}
            className="text-2xl font-bold text-orange-600 hover:text-orange-700"
          >
            ← ダッシュボードに戻る
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">応募者管理</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="mb-8 flex gap-4 flex-wrap">
          {['all', 'pending', 'interview', 'offer', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {status === 'all' ? `すべて (${applications.length})` : `${statusLabels[status]} (${applications.filter(a => a.status === status).length})`}
            </button>
          ))}
        </div>

        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-xl text-gray-600">応募者がいません</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredApplications.map((app) => (
              <div key={app.id} className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-600">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="md:col-span-2">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      {app.profile?.name || '不明'}
                    </h3>

                    <div className="space-y-3 text-gray-700">
                      <p>
                        <span className="font-medium">🎓 大学:</span> {app.profile?.university || '未設定'}
                      </p>
                      <p>
                        <span className="font-medium">📚 学年:</span> {app.profile?.grade || '未設定'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <p className="text-sm text-gray-600 mb-1">応募職種</p>
                      <p className="font-bold text-gray-900">{app.jobs?.job_title || '不明'}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">応募日</p>
                      <p className="font-bold text-gray-900">
                        {new Date(app.created_at).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <span className={`px-4 py-2 rounded-full text-sm font-bold ${statusColors[app.status]}`}>
                      {statusLabels[app.status] || app.status}
                    </span>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleStatusChange(app.id, 'interview')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                      >
                        面接予定
                      </button>
                      <button
                        onClick={() => handleStatusChange(app.id, 'offer')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                      >
                        内定
                      </button>
                      <button
                        onClick={() => handleStatusChange(app.id, 'rejected')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                      >
                        不採用
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}