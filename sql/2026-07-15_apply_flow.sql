-- 2026-07-15: 応募フローの拡張（勤務可能時間・志望理由）
-- Supabase ダッシュボード → SQL Editor で実行してください（何度実行しても安全）

ALTER TABLE applications ADD COLUMN IF NOT EXISTS available_hours text; -- 勤務可能時間
ALTER TABLE applications ADD COLUMN IF NOT EXISTS motivation text;      -- このインターンを希望した理由（任意）
