-- 2026-08-19: 掲載企業ロゴ（LP・企業向けページ・使い方ページに並べるロゴ帯）
-- Supabase ダッシュボード → SQL Editor で実行してください（何度実行しても安全）

-- 管理者が登録する「掲載ロゴ」。掲載企業に限らず自由に並べられる。
CREATE TABLE IF NOT EXISTS showcase_logos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',   -- 企業名（altテキスト・管理画面の見出しに使用）
  image_url text NOT NULL,          -- ロゴ画像URL（company-logos バケットに保存）
  sort int NOT NULL DEFAULT 0,      -- 表示順（小さいほど先）
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE showcase_logos ENABLE ROW LEVEL SECURITY;

-- 公開読み取り（表示に使う）
DROP POLICY IF EXISTS "showcase_logos_public_read" ON showcase_logos;
CREATE POLICY "showcase_logos_public_read" ON showcase_logos
  FOR SELECT USING (true);

-- 追加・更新・削除は管理者のみ
DROP POLICY IF EXISTS "showcase_logos_admin_insert" ON showcase_logos;
CREATE POLICY "showcase_logos_admin_insert" ON showcase_logos
  FOR INSERT WITH CHECK ((auth.jwt()->>'email') = 'ru_matsumoto@manabiph.com');

DROP POLICY IF EXISTS "showcase_logos_admin_update" ON showcase_logos;
CREATE POLICY "showcase_logos_admin_update" ON showcase_logos
  FOR UPDATE USING ((auth.jwt()->>'email') = 'ru_matsumoto@manabiph.com');

DROP POLICY IF EXISTS "showcase_logos_admin_delete" ON showcase_logos;
CREATE POLICY "showcase_logos_admin_delete" ON showcase_logos
  FOR DELETE USING ((auth.jwt()->>'email') = 'ru_matsumoto@manabiph.com');

-- 確認用:
-- SELECT id, name, sort, visible FROM showcase_logos ORDER BY sort;
