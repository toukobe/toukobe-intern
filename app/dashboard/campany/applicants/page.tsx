'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

interface Application {
  id: string;
  status: string;
  created_at: string;
  jobs: {
    id: string;
    job_title: string;
  };
  students: {
    id: string;
    name: string;
    email: string;
    phone_number: string;
    faculty: string;
    grade: string;
  };
}

interface User {
  id: string;
  email?: string;
}

interface UserType {
  company_id: string;
}

export default function ApplicantsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
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
        const { data: jobs, error: jobsError } = await supabase
          .from('jobs')
          .select('id')
          .eq('company_id', companyId);

        if (jobsError) throw jobsError;

        const jobIds = jobs?.map(j => j.id) || [];

        if (jobIds.length === 0) {
          setApplications([]);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('applications')
          .select(`
            id,
            status,
            created_at,
            jobs (
              id,
              job_title
            ),
            students (
              id,
              name,
              email,
              phone_number,
              faculty,
              grade
            )
          `)
          .in('job_id', jobIds)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setApplications((data as Application[]) || []);
      } catch (err) {
        setError('応募者データの取得に失敗しました');
        console.error(err);
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
      setError('更新に失敗しました');
      console.error(err);
    }
  };

  const filteredApplications = filterStatus === 'all'
    ? applications
    : applications.filter(app => app.status === filterStatus);

  const statusColors: { [key: string]: string } = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  const statusLabels: { [key: string]: string } = {
    pending: '審査中',
    approved: '承認',
    rejected: '不承認',
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
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard/company')}
            className="text-2xl font-bold text-blue-600 hover:text-blue-700"
          >
            ← ダッシュボードに戻る
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">応募者管理</h1>
          <p className="text-gray-600">
            全{applications.length}件の応募
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="mb-8 flex gap-4">
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {status === 'all' ? `すべて (${applications.length})` : `${statusLabels[status]} (${applications.filter(a => a.status === status).length})`}
            </button>
          ))}
        </div>

        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-xl text-gray-600">応募者がいません</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredApplications.map((app) => (
              <div key={app.id} className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-600">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="md:col-span-2">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      {app.students?.name || '不明'}
                    </h3>

                    <div className="space-y-3 text-gray-700">
                      <p>
                        <span className="font-medium">📧 メール:</span> {app.students?.email || '未設定'}
                      </p>
                      <p>
                        <span className="font-medium">📱 電話:</span> {app.students?.phone_number || '未設定'}
                      </p>
                      <p>
                        <span className="font-medium">🎓 学年:</span> {app.students?.grade || '未設定'}
                      </p>
                      <p>
                        <span className="font-medium">📚 学部:</span> {app.students?.faculty || '未設定'}
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
                    <div>
                      <span className={`px-4 py-2 rounded-full text-sm font-bold ${statusColors[app.status]}`}>
                        {statusLabels[app.status] || app.status}
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleStatusChange(app.id, 'approved')}
                        disabled={app.status === 'approved'}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ✅ 承認
                      </button>
                      <button
                        onClick={() => handleStatusChange(app.id, 'rejected')}
                        disabled={app.status === 'rejected'}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ❌ 不承認
                      </button>
                      <button
                        onClick={() => handleStatusChange(app.id, 'pending')}
                        disabled={app.status === 'pending'}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        🔄 審査中
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