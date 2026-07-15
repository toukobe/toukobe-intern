import { supabase } from '@/utils/supabase';

// 求人の特徴タグ（ハッシュタグ）。管理者ページで追加・編集できる feature_tag_options を正とし、
// テーブル未作成・空・取得失敗のときは以下の既定リストにフォールバックする。
export const DEFAULT_FEATURE_TAGS = [
  '営業', 'コンサルティング', '経営・企画',
  '時給2000円以上', 'フレックス勤務', 'フルリモート', '一部リモート',
  '未経験OK', '土日勤務可', '週2からOK', '服装髪型自由', '交通費支給',
  'インターン生10人以上在籍', 'スタートアップ', '東大卒社長',
  '外銀に内定者を輩出', '戦略コンサル内定者を輩出', '総合商社に内定者を輩出',
  'IT業界', '人材業界', '機械学習・AI', 'データサイエンス', 'プロダクトマネジメント', '事業立案',
];

// 管理者が編集したタグ候補を取得（無ければ既定リスト）
export async function fetchFeatureTagOptions(): Promise<string[]> {
  try {
    const { data, error } = await supabase.from('feature_tag_options').select('name, sort').order('sort', { ascending: true });
    if (error || !data || data.length === 0) return DEFAULT_FEATURE_TAGS;
    return data.map((d: { name: string }) => d.name);
  } catch {
    return DEFAULT_FEATURE_TAGS;
  }
}
