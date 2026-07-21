-- 2026-07-21: 利用規約・プライバシーポリシーへの同意記録
-- 学生登録時にチェックボックスで得た同意の「日時」と「規約バージョン」を記録する。
-- （プライバシーポリシー第5条・利用規約第10条で「登録時にチェックボックスで明示的な同意を得る」と定めているため、その証跡を残す）
-- user_types は同意の瞬間に一度だけINSERTされ、RLSでUPDATE不可＝改ざん耐性があるため、この記録の保存先に適している。
-- Supabase ダッシュボード → SQL Editor で実行してください（何度実行しても安全）。

ALTER TABLE user_types ADD COLUMN IF NOT EXISTS agreed_terms_at timestamptz; -- 規約・プライバシーポリシーに同意した日時（UTC）
ALTER TABLE user_types ADD COLUMN IF NOT EXISTS terms_version text;          -- 同意した規約のバージョン（例: 2026-07-11）
