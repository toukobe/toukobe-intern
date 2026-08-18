-- 2026-08-18: 求人ごとのカスタム項目 + 「応募要件」を「必須条件」に一本化
-- Supabase ダッシュボード → SQL Editor で実行してください
-- ※ ①→② の順に、そのまま全部貼り付けて実行して問題ありません（何度実行しても同じ結果になります）

-- ① 求人ごとに自由に追加できる項目
--    [{ "label": "1日の流れ", "value": "10:00 出社..." }, ...] の配列で持つ
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS custom_fields jsonb NOT NULL DEFAULT '[]'::jsonb;

-- ② 「応募要件(requirements)」を「必須条件(required_conditions)」へ寄せる
--    入力欄が重複していたため、必須条件に一本化する。
--    既存の応募要件の文章は消さずに必須条件へ移す。
--    - 必須条件が空 → 応募要件をそのまま移す
--    - 両方に入力あり → 必須条件の下に応募要件を追記する
UPDATE jobs
SET required_conditions =
  CASE
    WHEN coalesce(btrim(required_conditions), '') = '' THEN requirements
    ELSE required_conditions || E'\n' || requirements
  END
WHERE coalesce(btrim(requirements), '') <> '';

-- 移した後、応募要件は空にする（求人ページで二重表示になるのを防ぐ）
-- カラム自体は消さない。万一やり直したくなったときのために残しておく。
UPDATE jobs
SET requirements = ''
WHERE coalesce(btrim(requirements), '') <> '';

-- 確認用:
-- SELECT id, job_title, requirements, required_conditions, custom_fields FROM jobs ORDER BY created_at DESC LIMIT 10;
