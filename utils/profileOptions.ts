// 学生プロフィールの選択肢定義（登録フォームとマイページ編集で共用）

// 学年
export const GRADES = ['学部1年生','学部2年生','学部3年生','学部4年生','修士1年生','修士2年生','博士1年生','博士2年生','博士3年生','卒業済み','その他'];

// 大学の選択肢（プリセット）。旧帝7大学＋一橋・東京科学・早稲田・慶應。
// これ以外は「その他（自由入力）」で入力できる（UniversitySelectコンポーネント参照）。
export const UNIVERSITY_OPTIONS = [
  '東京大学', '京都大学', '北海道大学', '東北大学', '名古屋大学', '大阪大学', '九州大学',
  '一橋大学', '東京科学大学', '早稲田大学', '慶應義塾大学',
];
// 自由入力を表す内部値
export const UNIVERSITY_OTHER = '__other__';

// 生年月日の年（2005年から始まる。学部〜院生をカバーするため2010〜1998を降順で用意）
export const BIRTH_YEARS = (() => {
  const years: number[] = [];
  for (let y = 2010; y >= 1998; y--) years.push(y);
  // 2005を先頭寄りにしたいという要望に沿い、2005〜を先に、その後に残りを並べる
  const from2005 = years.filter(y => y <= 2005);
  const before2005 = years.filter(y => y > 2005);
  return [...from2005, ...before2005];
})();

// 卒業予定年（就職予定年）2026〜2040
export const GRAD_YEARS = (() => {
  const years: number[] = [];
  for (let y = 2026; y <= 2040; y++) years.push(y);
  return years;
})();

// その他スキルの候補（チップ選択式。自由追加も可能）
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
    label: 'クリエイティブ・その他',
    skills: ['Figma', 'Photoshop / Illustrator', '動画編集', '統計', '簿記・会計', '塾講師・家庭教師経験', 'イベント企画・運営'],
  },
];

// 語学スキルの候補（その他スキルと分離）
// 主要言語はレベル別に選べるようにし、その他の言語も充実させた。
// リストにない言語・レベルは自由入力で追加できる（SkillsPicker）。
export const LANGUAGE_GROUPS: { label: string; skills: string[] }[] = [
  {
    label: '英語',
    skills: ['英語（ネイティブ）', '英語（ビジネスレベル）', '英語（日常会話）', '英語（初級）'],
  },
  {
    label: '日本語',
    skills: ['日本語（ネイティブ）', '日本語（ビジネスレベル）', '日本語（日常会話）'],
  },
  {
    label: 'その他の言語',
    skills: ['中国語', '韓国語', 'フランス語', 'スペイン語', 'ドイツ語', 'ポルトガル語', 'イタリア語', 'ロシア語', 'ベトナム語', 'タイ語', 'インドネシア語', 'アラビア語'],
  },
];

// 資格・検定の記入例（プレースホルダーに使用。級・スコアも書けるよう自由記述）
export const CERT_PLACEHOLDER = '例：\nTOEIC 850点\n英検準1級\n簿記2級\n基本情報技術者';

// プロフィール必須項目が全て入っているか（マイページのガードで使用）
// university_email（大学メール・在学確認用）も必須に含める
export function isProfileComplete(p: {
  last_name?: string | null; first_name?: string | null; birth_date?: string | null;
  university?: string | null; department?: string | null; grade?: string | null;
  contact_email?: string | null; university_email?: string | null;
} | null | undefined): boolean {
  if (!p) return false;
  return !!(p.last_name && p.first_name && p.birth_date && p.university && p.department && p.grade && p.contact_email && p.university_email);
}
