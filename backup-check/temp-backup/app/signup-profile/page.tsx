'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

interface User {
  id: string;
  email?: string;
}

export default function SignupProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    university: '',
    grade: '',
    skills: '',
    experience: '',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/login');
        return;
      }

      setUser(session.user as User);

      // 既存プロフィールを確認
      const { data } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (data) {
        setFormData({
          name: data.name || '',
          university: data.university || '',
          grade: data.grade || '',
          skills: (data.skills || []).join(', '),
          experience: data.experience || '',
        });
      }

      setLoading(false);
    }

    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (!user) return;

      // user_types テーブルに学生として登録
      const { error: typeError } = await supabase
        .from('user_types')
        .upsert(
          {
            user_id: user.id,
            user_type: 'student',
          },
          { onConflict: 'user_id' }
        );

      if (typeError) throw typeError;

      // student_profiles テーブルに保存
      const skillsArray = formData.skills
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s);

      const { error: profileError } = await supabase
        .from('student_profiles')
        .upsert(
          {
            user_id: user.id,
            name: formData.name,
            university: formData.university,
            grade: formData.grade,
            skills: skillsArray,
            experience: formData.experience,
          },
          { onConflict: 'user_id' }
        );

      if (profileError) throw profileError;

      alert('プロフィールを保存しました！');
      router.push('/');
    } catch (err) {
      setError('プロフィール保存に失敗しました: ' + (err as any).message);
      console.error(err);
    } finally {
      setSaving(false);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 py-12">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">👤</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">プロフィール設定</h1>
          <p className="text-gray-600">
            あなたの情報を入力してください。後から編集できます。
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 名前 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              名前 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="山田太郎"
              required
            />
          </div>

          {/* 大学 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              大学 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.university}
              onChange={(e) => setFormData({ ...formData, university: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="東京大学"
              required
            />
          </div>

          {/* 学年 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              学年 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">選択してください</option>
              <option value="1年生">1年生</option>
              <option value="2年生">2年生</option>
              <option value="3年生">3年生</option>
              <option value="4年生">4年生</option>
              <option value="大学院">大学院</option>
            </select>
          </div>

          {/* スキル */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              スキル（カンマ区切り）
            </label>
            <input
              type="text"
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Python, JavaScript, デザイン"
            />
            <p className="text-sm text-gray-500 mt-2">
              例: Python, JavaScript, デザイン
            </p>
          </div>

          {/* 経歴 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              経歴・自己紹介
            </label>
            <textarea
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="あなたの経歴や自己紹介を入力してください"
              rows={4}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 transition-colors disabled:opacity-50"
          >
            {saving ? '保存中...' : 'プロフィールを保存'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          後からいつでも編集できます
        </p>
      </div>
    </div>
  );
}