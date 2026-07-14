// 学生プロフィールの選択肢定義（登録フォームとマイページ編集で共用）

// 登録可能な大学（サイト表記と一致させる。リスト外の大学は登録不可）
export const UNIVERSITIES = [
  '東京大学',
  '京都大学',
  '一橋大学',
  '東京科学大学',
  '早稲田大学',
  '慶應義塾大学',
];

// スキルの候補（チップ選択式。自由追加も可能）
export const SKILL_GROUPS: { label: string; skills: string[] }[] = [
  {
    label: 'プログラミング・データ',
    skills: ['Python', 'JavaScript / TypeScript', 'Java', 'C / C++', 'SQL', 'HTML / CSS', 'React', '機械学習・AI', 'データ分析', 'Git / GitHub'],
  },
  {
    label: 'ビジネス',
    skills: ['Excel', 'PowerPoint', 'Word', '資料作成', 'リサーチ', 'ライティング', 'マーケティング', 'SNS運用', '営業経験', '接客・アルバイト経験'],
  },
  {
    label: '語学・その他',
    skills: ['英語（ビジネスレベル）', '英語（日常会話）', 'TOEIC 800点以上', '中国語', 'Figma', 'Photoshop / Illustrator', '動画編集', '統計', '簿記・会計', '塾講師・家庭教師経験'],
  },
];

// プロフィール必須項目が全て入っているか（マイページのガードで使用）
export function isProfileComplete(p: {
  last_name?: string | null; first_name?: string | null; birth_date?: string | null;
  university?: string | null; department?: string | null; grade?: string | null;
  contact_email?: string | null;
} | null | undefined): boolean {
  if (!p) return false;
  return !!(p.last_name && p.first_name && p.birth_date && p.university && p.department && p.grade && p.contact_email);
}
