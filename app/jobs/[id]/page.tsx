'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

interface JobDetail {
  id: string;
  job_title: string;
  salary: string;
  location: string;
  job_description: string;
  requirements: string;
  job_categories: string[];
  work_days: string[];
  work_conditions: string[];
  job_features: string[];
  open_positions: number;
  companies: {
    company_name: string;
    industry: string;
    contact_email: string;
  } | null;
}
interface User {
  id: string;
  email?: string;
}

interface UserType {
  user_type: string;
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user as User || null);
    }
    checkAuth();
  }, []);

  useEffect(() => {
    async function checkUserType() {
      if (user) {
        const { data } = await supabase
          .from('user_types')
          .select('user_type')
          .eq('user_id', user.id)
          .single();
        setUserType(data as UserType || null);
      }
    }
    checkUserType();
  }, [user]);

  useEffect(() => {
    async function fetchJobDetail() {
      try {
        const { data, error } = await supabase
          .from('jobs')
         .select(`
  id, 
  job_title, 
  salary, 
  location, 
  job_description, 
  requirements,
  job_categories,
  work_days,
  work_conditions,
  job_features,
  open_positions,
  companies(company_name, industry, contact_email)
`)
          .single();

        if (error) {
          setError('求人情報の取得に失敗しました');
        } else {
          setJob(data as JobDetail);
        }
      } catch (err) {
        setError('予期しないエラーが発生しました');
      } finally {
        setLoading(false);
      }
    }
    fetchJobDetail();
  }, [jobId]);

  useEffect(() => {
    async function checkApplied() {
      if (user) {
        const { data } = await supabase
          .from('applications')
          .select('id')
          .eq('user_id', user.id)
          .eq('job_id', jobId)
          .single();
        setHasApplied(!!data);
      }
    }
    checkApplied();
  }, [user, jobId]);

  const handleApply = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (userType?.user_type !== 'student') {
      setError('学生のみが応募できます');
      return;
    }

    setIsApplying(true);
    setError(null);

    try {
      const { error } = await supabase.from('applications').insert([
        { user_id: user.id, job_id: jobId, status: 'pending' }
      ]);

      if (error) {
        setError('応募に失敗しました');
      } else {
        alert('応募しました！');
        setHasApplied(true);
      }
    } catch (err) {
      setError('エラーが発生しました');
    } finally {
      setIsApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl font-medium text-gray-600">読み込み中...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl font-medium text-gray-600 mb-4">求人が見つかりません</p>
          <button onClick={() => router.push('/')} className="px-6 py-2 bg-blue-600 text-white rounded-lg">
            トップページに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <button onClick={() => router.push('/')} className="mb-6 inline-flex items-center text-blue-600">
          <span className="mr-2">←</span> トップページに戻る
        </button>

        <div className="bg-white rounded-xl shadow-md p-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{job.job_title}</h1>
          <p className="text-sm text-gray-500 mb-4">{job.companies?.company_name}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">業務内容</h2>
            <p className="text-gray-700">{job.job_description}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">応募要件</h2>
            <p className="text-gray-700">{job.requirements}</p>
          </section>
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">求人情報</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">📍 勤務地</p>
                <p className="font-semibold text-gray-800">{job.location}</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">💰 給与</p>
                <p className="font-semibold text-gray-800">{job.salary}</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">📌 募集人数</p>
                <p className="font-semibold text-gray-800">{job.open_positions}名</p>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">⏰ 勤務日数</p>
                <p className="font-semibold text-gray-800">
                  {job.work_days?.join(', ') || '記載なし'}
                </p>
              </div>
            </div>

            {job.job_categories && job.job_categories.length > 0 && (
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">💼 職種</p>
                <div className="flex flex-wrap gap-2">
                  {job.job_categories.map((cat) => (
                    <span key={cat} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {job.work_conditions && job.work_conditions.length > 0 && (
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">🏢 勤務条件</p>
                <div className="flex flex-wrap gap-2">
                  {job.work_conditions.map((cond) => (
                    <span key={cond} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                      {cond}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {job.job_features && job.job_features.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">⭐ 求人の特徴</p>
                <div className="flex flex-wrap gap-2">
                  {job.job_features.map((feature) => (
                    <span key={feature} className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {error && <div className="mb-6 p-4 bg-red-50 rounded-lg"><p className="text-red-700">{error}</p></div>}

          <div className="flex gap-4">
            <button
              onClick={handleApply}
              disabled={isApplying || hasApplied}
              className={`flex-1 py-3 rounded-lg font-bold ${
                hasApplied ? 'bg-gray-300' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isApplying ? '応募中...' : hasApplied ? '応募済み' : 'この求人に応募する'}
            </button>
            <button onClick={() => router.push('/')} className="flex-1 bg-gray-200 py-3 rounded-lg font-bold">
              他の求人を見る
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}