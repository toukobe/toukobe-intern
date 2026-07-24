-- 2026-07-24: プレビュー共有リンク用のキー
-- 「公開前／メンテナンス」モードでも、このキー付きリンク（例 https://intern.toukobe.com/?preview=<キー>）を
-- 開いた端末だけは、管理者ログインなしで全画面を閲覧できる（商談で相手に見せる用）。
-- Supabase ダッシュボード → SQL Editor で実行してください（何度実行しても安全）。

ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS preview_key text;

-- 未設定ならランダムなキーを1つ発行（ハイフン除去したUUID）
UPDATE site_settings
  SET preview_key = replace(gen_random_uuid()::text, '-', '')
  WHERE id = 1 AND (preview_key IS NULL OR preview_key = '');
