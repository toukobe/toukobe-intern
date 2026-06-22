'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

interface User {
  id: string;
  email?: string;
}

interface StudentProfile {
  id: string;
  name: string;
  university: string;
  grade: string;
  skills: string[];
  experience: string;
}

interface Application {
  id: string;
  job_id: string;
  status: string;
  created_at: string;
  jobs?: {
    job_title: string;
    salary: string;
    location: string;
    companies?: {
      company_name: string;
    };
  };
}

interface Favorite {
  id: string;
  job_id: string;
  jobs?: {
    job_title: string;
    salary: string;
    location: string;
    companies?: {
      company_name: string;
    };
  };
}

interface Message {
  id: string;
  from_user_id: string;
  message_text: string;
  created_at: string;
  read_at: string | null;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'applications' | 'favorites' | 'messages'>('profile');
  const [applications, setApplications] = useState<Application[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<StudentProfile>>({});

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/login');
        return;
      }

      setUser(session.user as User);

      // プロフィールを取得
      const { data: profileData } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setEditFormData(profileData);
      }

      await loadApplications(session.user.id);
      await loadFavorites(session.user.id);
      await loadMessages(session.user.id);

      setLoading(false);
    }

    checkAuth();
  }, [router]);

  const loadApplications = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('applications')
        .select(`
          *,
          jobs(
            job_title,
            salary,
            location,
            companies(company_name)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setApplications(data || []);
    } catch (error) {
      console.error('Error loading applications:', error);
    }
  };

  const loadFavorites = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('favorites')
        .select(`
          *,
          jobs(
            job_title,
            salary,
            location,
            companies(company_name)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setFavorites(data || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const loadMessages = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('to_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!user) return;

      const skillsArray = (editFormData.skills || []).filter((s) =>
        typeof s === 'string'
      );

      const { error } = await supabase
        .from('student_profiles')
        .update({
          name: editFormData.name,
          university: editFormData.university,
          grade: editFormData.grade,
          skills: skillsArray,
          experience: editFormData.experience,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile(editFormData as StudentProfile);
      setIsEditingProfile(false);
      alert('プロフィールを更新しました');
    } catch (error) {
      alert('プロフィール更新に失敗しました');
      console.error(error);
    }
  };

  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      setFavorites(favorites.filter((f) => f.id !== favoriteId));
    } catch (error) {
      alert('お気に入りの削除に失敗しました');
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
            <h1 className="text-2xl font-bold text-gray-800">
              {profile?.name || 'マイページ'}
            </h1>
            <p className="text-sm text-gray-600">{profile?.university}</p>
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
              onClick={() => setActiveTab('profile')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              プロフィール
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'applications'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              応募履歴 ({applications.length})
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'favorites'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              お気に入り ({favorites.length})
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'messages'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              メッセージ ({messages.filter((m) => !m.read_at).length})
            </button>
          </div>
        </div>

        {/* プロフィールタブ */}
        {activeTab === 'profile' && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">プロフィール</h2>
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isEditingProfile ? 'キャンセル' : '編集'}
              </button>
            </div>

            {isEditingProfile ? (
              <div className="bg-white rounded-lg shadow p-6">
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      名前 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editFormData.name || ''}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, name: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      大学 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editFormData.university || ''}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          university: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      学年 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editFormData.grade || ''}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, grade: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      スキル（カンマ区切り）
                    </label>
                    <input
                      type="text"
                      value={
                        Array.isArray(editFormData.skills)
                          ? editFormData.skills.join(', ')
                          : ''
                      }
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          skills: e.target.value
                            .split(',')
                            .map((s) => s.trim()),
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Python, JavaScript, デザイン"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      経歴・自己紹介
                    </label>
                    <textarea
                      value={editFormData.experience || ''}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          experience: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={5}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    プロフィールを更新
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 space-y-6">
                <div>
                  <p className="text-sm font-medium text-gray-600">名前</p>
                  <p className="text-lg text-gray-800 mt-1">{profile?.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-600">大学</p>
                    <p className="text-lg text-gray-800 mt-1">{profile?.university}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">学年</p>
                    <p className="text-lg text-gray-800 mt-1">{profile?.grade}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">スキル</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile?.skills && profile.skills.length > 0 ? (
                      profile.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500">スキルが登録されていません</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">経歴・自己紹介</p>
                  <p className="text-gray-800 mt-2 whitespace-pre-wrap">
                    {profile?.experience || '記入されていません'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 応募履歴タブ */}
        {activeTab === 'applications' && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-6">応募履歴</h2>

            {applications.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500 mb-4">応募がまだありません</p>
                <button
                  onClick={() => router.push('/')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  求人を探す
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-800">
                          {(app.jobs as any)?.job_title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {(app.jobs?.companies as any)?.company_name}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          app.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : app.status === 'interview'
                            ? 'bg-blue-100 text-blue-700'
                            : app.status === 'offer'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {app.status === 'pending'
                          ? '検討中'
                          : app.status === 'interview'
                          ? '面接予定'
                          : app.status === 'offer'
                          ? '内定'
                          : '不採用'}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">
                      📍 {(app.jobs as any)?.location} | 💰{' '}
                      {(app.jobs as any)?.salary}
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/jobs/${app.job_id}`)}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        詳細を見る
                      </button>
                      <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        メッセージ
                      </button>
                    </div>

                    <p className="text-xs text-gray-500 mt-4">
                      応募日: {new Date(app.created_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* お気に入りタブ */}
        {activeTab === 'favorites' && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-6">お気に入り</h2>

            {favorites.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500 mb-4">お気に入りがまだありません</p>
                <button
                  onClick={() => router.push('/')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  求人を探す
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {favorites.map((fav) => (
                  <div key={fav.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-800">
                          {(fav.jobs as any)?.job_title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {(fav.jobs?.companies as any)?.company_name}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">
                      📍 {(fav.jobs as any)?.location} | 💰{' '}
                      {(fav.jobs as any)?.salary}
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/jobs/${fav.job_id}`)}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        詳細を見る
                      </button>
                      <button
                        onClick={() => handleRemoveFavorite(fav.id)}
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

        {/* メッセージタブ */}
        {activeTab === 'messages' && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-6">メッセージ</h2>

            {messages.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500">メッセージはまだありません</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-lg shadow p-6 ${
                      msg.read_at ? 'bg-white' : 'bg-blue-50'
                    }`}
                  >
                    <p className="text-gray-800 mb-2">{msg.message_text}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(msg.created_at).toLocaleString('ja-JP')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}