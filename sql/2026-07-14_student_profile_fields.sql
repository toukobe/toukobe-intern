-- 2026-07-14: 学生プロフィールの拡張項目
-- Supabase ダッシュボード → SQL Editor で実行してください（何度実行しても安全）

ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS university_email text;   -- 大学メール（在学確認用・必須）
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS graduation_year text;    -- 卒業予定年（就職予定年）
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS is_tutor boolean DEFAULT false; -- トウコべ/キョウコべ講師登録の有無
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}'; -- 語学スキル（その他スキルと分離）
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS certifications text;      -- 資格・検定（級・スコアを含む自由記述）
