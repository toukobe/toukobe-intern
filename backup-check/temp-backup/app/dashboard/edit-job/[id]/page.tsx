'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  job_description: string;
  requirements: string;
  job_categories: string[];
  work_days: string[];
  work_conditions: string[];
  job_features: string[];
}

const JOB_CATEGORIES = [
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

const WORK_DAYS = ['週2から', '週3から', '週4から'];
const WORK_CONDITIONS = ['フルリモート', '一部リモート', 'フレックス勤務', '土日勤務可'];
const JOB_FEATURES = ['未経験OK', '交通費支給', '服装髪型自由'];

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Job>({
    id: '',
    job_title: '',
    salary: '',
    location: '',
    job_description: '',
    requirements: '',
    job_categories: [],
    work_days: [],
    work_conditions: [],
    job_features: [],
  });

  useEffect(() => {
    async function checkAuthAndLoadJob() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/company-login');
        return;
      }

      setUser(session.user as User);

      // 求人を取得
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError) {
        setError('求人が見つかりません');
        setLoading(false);
        return;
      }

      setFormData(job as Job);
      setLoading(false);
    }

    checkAuthAndLoadJob();
  }, [jobId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('jobs')
        .update({
          job_title: formData.job_title,
          salary: formData.salary,
          location: formData.location,
          job_description: formData.job_description,
          requirements: formData.requirements,
          job_categories: formData.job_categories,
          work_days: formData.work_days,
          work_conditions: formData.work_conditions,
          job_features: formData.job_features,
        })
        .eq('id', jobId);

      if (updateError) throw updateError;

      alert('求人を更新しました！');
      router.push('/dashboard/company');
    } catch (err) {
      setError('求人更新に失敗しました: ' + (err as any).message);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (category: string) => {
    setFormData({
      ...formData,
      job_categories: formData.job_categories.includes(category)
        ? formData.job_categories.filter((c) => c !== category)
        : [...formData.job_categories, category],
    });
  };

  const toggleWorkDay = (day: string) => {
    setFormData({
      ...formData,
      work_days: formData.work_days.includes(day)
        ? formData.work_days.filter((d) => d !== day)
        : [...formData.work_days, day],
    });
  };

  const toggleWorkCondition = (condition: string) => {
    setFormData({
      ...formData,
      work_conditions: formData.work_conditions.includes(condition)
        ? formData.work_conditions.filter((c) => c !== condition)
        : [...formData.work_conditions, condition],
    });
  };

  const toggleJobFeature = (feature: string) => {
    setFormData({
      ...formData,
      job_features: formData.job_features.includes(feature)
        ? formData.job_features.filter((f) => f !== feature)
        : [...formData.job_features, feature],
    });
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">求人を編集</h1>
          <p className="text-gray-600 mb-8">求人情報を更新してください</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 基本情報 */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">基本情報</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    職種名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.job_title}
                    onChange={(e) =>
                      setFormData({ ...formData, job_title: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      給与 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.salary}
                      onChange={(e) =>
                        setFormData({ ...formData, salary: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      勤務地 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    業務内容 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.job_description}
                    onChange={(e) =>
                      setFormData({ ...formData, job_description: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={6}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    応募要件 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.requirements}
                    onChange={(e) =>
                      setFormData({ ...formData, requirements: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={6}
                    required
                  />
                </div>
              </div>
            </div>

            {/* 職種カテゴリ */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">職種カテゴリ</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {JOB_CATEGORIES.map((category) => (
                  <label key={category} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.job_categories.includes(category)}
                      onChange={() => toggleCategory(category)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-gray-700">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 勤務日数 */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">勤務日数</h2>
              <div className="space-y-3">
                {WORK_DAYS.map((day) => (
                  <label key={day} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.work_days.includes(day)}
                      onChange={() => toggleWorkDay(day)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-gray-700">{day}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 勤務条件 */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">勤務条件</h2>
              <div className="space-y-3">
                {WORK_CONDITIONS.map((condition) => (
                  <label key={condition} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.work_conditions.includes(condition)}
                      onChange={() => toggleWorkCondition(condition)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-gray-700">{condition}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 求人特徴 */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">求人特徴</h2>
              <div className="space-y-3">
                {JOB_FEATURES.map((feature) => (
                  <label key={feature} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.job_features.includes(feature)}
                      onChange={() => toggleJobFeature(feature)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-gray-700">{feature}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* ボタン */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? '更新中...' : '求人を更新'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard/company')}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-bold hover:bg-gray-300 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}