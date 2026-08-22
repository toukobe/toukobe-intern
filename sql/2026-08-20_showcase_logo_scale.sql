-- 2026-08-20: 掲載ロゴの「1社ずつサイズ調整」と「背景透過の取り消し」に必要なカラム
-- Supabase ダッシュボード → SQL Editor で実行してください（何度実行しても安全）

-- 表示倍率（1.0 = 標準）。0.5〜1.6 の範囲で管理画面から調整する。
ALTER TABLE showcase_logos ADD COLUMN IF NOT EXISTS scale real NOT NULL DEFAULT 1;

-- 背景透過を実行する前の画像URLを保存しておく列。「元に戻す」で復元するために使う。
ALTER TABLE showcase_logos ADD COLUMN IF NOT EXISTS prev_image_url text;

-- 確認用:
-- SELECT name, scale, prev_image_url FROM showcase_logos ORDER BY sort;
