-- 2026-07-15: 求人の特徴タグ（ハッシュタグ）システム
-- Supabase ダッシュボード → SQL Editor で実行してください（何度実行しても安全）

-- 求人が持つ特徴タグ
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS feature_tags text[] DEFAULT '{}';

-- 管理者が管理するタグの候補リスト（検索チップ・トップページのおすすめに使用）
CREATE TABLE IF NOT EXISTS feature_tag_options (
  name text PRIMARY KEY,
  sort int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE feature_tag_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feature_tags_public_read" ON feature_tag_options;
CREATE POLICY "feature_tags_public_read" ON feature_tag_options
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "feature_tags_admin_insert" ON feature_tag_options;
CREATE POLICY "feature_tags_admin_insert" ON feature_tag_options
  FOR INSERT WITH CHECK ((auth.jwt()->>'email') = 'ru_matsumoto@manabiph.com');

DROP POLICY IF EXISTS "feature_tags_admin_delete" ON feature_tag_options;
CREATE POLICY "feature_tags_admin_delete" ON feature_tag_options
  FOR DELETE USING ((auth.jwt()->>'email') = 'ru_matsumoto@manabiph.com');

DROP POLICY IF EXISTS "feature_tags_admin_update" ON feature_tag_options;
CREATE POLICY "feature_tags_admin_update" ON feature_tag_options
  FOR UPDATE USING ((auth.jwt()->>'email') = 'ru_matsumoto@manabiph.com');

-- 初期タグ（既にあればスキップ）
INSERT INTO feature_tag_options (name, sort) VALUES
  ('営業', 10), ('コンサルティング', 20), ('経営・企画', 30),
  ('時給2000円以上', 40), ('フレックス勤務', 50), ('フルリモート', 60), ('一部リモート', 70),
  ('未経験OK', 80), ('土日勤務可', 90), ('週2からOK', 100),
  ('服装髪型自由', 110), ('交通費支給', 120),
  ('インターン生10人以上在籍', 130), ('スタートアップ', 140), ('東大卒社長', 150),
  ('外銀に内定者を輩出', 160), ('戦略コンサル内定者を輩出', 170), ('総合商社に内定者を輩出', 180),
  ('IT業界', 190), ('人材業界', 200), ('機械学習・AI', 210), ('データサイエンス', 220),
  ('プロダクトマネジメント', 230), ('事業立案', 240)
ON CONFLICT (name) DO NOTHING;
