-- 2026-07-15: 企業ページの「内定先・経験者の声」フィールド
-- Supabase ダッシュボード → SQL Editor で実行してください（何度実行しても安全）

ALTER TABLE companies ADD COLUMN IF NOT EXISTS alumni_placements text; -- 過去のインターン生の内定先
ALTER TABLE companies ADD COLUMN IF NOT EXISTS intern_voices text;     -- インターン経験者の声
