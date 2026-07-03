-- ================================================================
-- 架空企業アカウント × 4社 完全セットアップ
-- Supabase Dashboard > SQL Editor に丸ごとコピペして実行するだけ
-- ================================================================

DO $$
DECLARE
  uid_milestone  UUID;
  uid_cloudcare  UUID;
  uid_workhero   UUID;
  uid_soel       UUID;
BEGIN

-- ────────────────────────────────────────
-- 1. auth.users（ログインアカウント）作成
-- ────────────────────────────────────────

-- マイルストーン
INSERT INTO auth.users (
  instance_id, id, aud, role,
  email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  is_super_admin
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(), 'authenticated', 'authenticated',
  'demo-milestone@toukobe.test',
  crypt('Demo1234!', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}', '{}',
  '', '', '', '', false
)
ON CONFLICT (email) DO NOTHING;
SELECT id INTO uid_milestone FROM auth.users WHERE email = 'demo-milestone@toukobe.test';

-- クラウドケア
INSERT INTO auth.users (
  instance_id, id, aud, role,
  email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  is_super_admin
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(), 'authenticated', 'authenticated',
  'demo-cloudcare@toukobe.test',
  crypt('Demo1234!', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}', '{}',
  '', '', '', '', false
)
ON CONFLICT (email) DO NOTHING;
SELECT id INTO uid_cloudcare FROM auth.users WHERE email = 'demo-cloudcare@toukobe.test';

-- WORK HERO
INSERT INTO auth.users (
  instance_id, id, aud, role,
  email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  is_super_admin
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(), 'authenticated', 'authenticated',
  'demo-workhero@toukobe.test',
  crypt('Demo1234!', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}', '{}',
  '', '', '', '', false
)
ON CONFLICT (email) DO NOTHING;
SELECT id INTO uid_workhero FROM auth.users WHERE email = 'demo-workhero@toukobe.test';

-- SOEL
INSERT INTO auth.users (
  instance_id, id, aud, role,
  email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  is_super_admin
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(), 'authenticated', 'authenticated',
  'demo-soel@toukobe.test',
  crypt('Demo1234!', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}', '{}',
  '', '', '', '', false
)
ON CONFLICT (email) DO NOTHING;
SELECT id INTO uid_soel FROM auth.users WHERE email = 'demo-soel@toukobe.test';


-- ────────────────────────────────────────
-- 2. auth.identities（メールログイン用）
-- ────────────────────────────────────────

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES
  (gen_random_uuid(), uid_milestone,
   jsonb_build_object('sub', uid_milestone::text, 'email', 'demo-milestone@toukobe.test'),
   'email', 'demo-milestone@toukobe.test', NOW(), NOW(), NOW()),
  (gen_random_uuid(), uid_cloudcare,
   jsonb_build_object('sub', uid_cloudcare::text, 'email', 'demo-cloudcare@toukobe.test'),
   'email', 'demo-cloudcare@toukobe.test', NOW(), NOW(), NOW()),
  (gen_random_uuid(), uid_workhero,
   jsonb_build_object('sub', uid_workhero::text, 'email', 'demo-workhero@toukobe.test'),
   'email', 'demo-workhero@toukobe.test', NOW(), NOW(), NOW()),
  (gen_random_uuid(), uid_soel,
   jsonb_build_object('sub', uid_soel::text, 'email', 'demo-soel@toukobe.test'),
   'email', 'demo-soel@toukobe.test', NOW(), NOW(), NOW())
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────
-- 3. companies テーブル
-- ────────────────────────────────────────

INSERT INTO companies (id, company_name, industry, contact_email, description, location, employee_count, founded_year, website)
VALUES
  ('aaaaaaaa-0001-0001-0001-000000000001',
   'マイルストーン株式会社', 'IT・ソフトウェア', 'demo-milestone@toukobe.test',
   'AIプロダクトの「すべて」を動かす。企画から実装まで担うフルスタック・AIエンジニアが活躍する会社です。生成AI・エージェント開発を中心に、急成長中のスタートアップです。',
   '東京都渋谷区', '32', '2021', 'https://example.com/milestone'),

  ('aaaaaaaa-0002-0002-0002-000000000002',
   '株式会社クラウドケア', 'SaaS・クラウド', 'demo-cloudcare@toukobe.test',
   'CEO直下で事業開発からCSまで一気通貫で担えるスタートアップです。BtoBのSaaSプロダクトを展開し、年率150%成長を続けています。インターン生でも裁量を持って働けます。',
   '東京都渋谷区 渋谷駅徒歩8分', '18', '2020', 'https://example.com/cloudcare'),

  ('aaaaaaaa-0003-0003-0003-000000000003',
   'WORK HERO株式会社', 'AI・プロダクト開発', 'demo-workhero@toukobe.test',
   'AI駆動開発に挑む自社プロダクト企業。チーム全員がフルリモートで働きながら、グローバルに展開するAIツールを開発しています。未経験でも歓迎。',
   'フルリモート（東京都港区登記）', '12', '2022', 'https://example.com/workhero'),

  ('aaaaaaaa-0004-0004-0004-000000000004',
   'SOEL株式会社', 'コンサルティング・戦略', 'demo-soel@toukobe.test',
   '代表・CxO直下でAI開発×戦略をリアルに学べる環境。本気で成長したい学生向けの就労型長期インターンが中心。多くのOBOGがコンサル・投資銀行に進んでいます。',
   '東京都港区 乃木坂駅徒歩3分', '45', '2018', 'https://example.com/soel')
ON CONFLICT (id) DO NOTHING;


-- ────────────────────────────────────────
-- 4. user_types（アカウントと企業の紐づけ）
-- ────────────────────────────────────────

INSERT INTO user_types (user_id, user_type, company_id)
VALUES
  (uid_milestone, 'company', 'aaaaaaaa-0001-0001-0001-000000000001'),
  (uid_cloudcare,  'company', 'aaaaaaaa-0002-0002-0002-000000000002'),
  (uid_workhero,   'company', 'aaaaaaaa-0003-0003-0003-000000000003'),
  (uid_soel,       'company', 'aaaaaaaa-0004-0004-0004-000000000004')
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────
-- 5. jobs テーブル（各社2件ずつ）
-- ────────────────────────────────────────

INSERT INTO jobs (company_id, job_title, salary, location, job_description, requirements, job_categories, work_days, work_conditions, job_features, status)
VALUES

  -- マイルストーン
  ('aaaaaaaa-0001-0001-0001-000000000001',
   '【時給2,000円〜/リモート】AIエージェント開発からプロダクト改善まで担うフルスタック・AIエンジニアインターン',
   '時給2,000円〜4,000円', 'フルリモート',
   E'■ 業務内容\n・LLMを活用したAIエージェントの設計・実装\n・Pythonバックエンド / Next.jsフロントエンドの開発\n・プロダクトのパフォーマンス改善・機能追加\n・週次のスプリントレビューへの参加\n\n■ 環境\nPython / TypeScript / Next.js / FastAPI / LangChain / AWS',
   E'・プログラミング経験1年以上（言語不問）\n・週3日以上コミット可能な方\n・自走力・好奇心のある方',
   ARRAY['エンジニア'], ARRAY['週3日〜','週4日〜','週5日'],
   ARRAY['フルリモート','服装自由','フレックス','フレックス勤務','土日勤務可'],
   ARRAY['AI実装','プロダクトマネジメント','スタートアップ','服装髪型自由'], 'published'),

  ('aaaaaaaa-0001-0001-0001-000000000001',
   '【渋谷/週2〜】AIプロダクトのグロースを担うマーケティングインターン',
   '時給1,500円〜2,000円', '東京都渋谷区（一部リモート可）',
   E'■ 業務内容\n・SNS広告の企画・運用（Meta / X / LinkedIn）\n・LP制作・ABテストの設計と分析\n・ユーザーインタビューの実施\n・競合調査・レポーティング',
   E'・マーケティングに興味がある方\n・データを読むことが好きな方\n・週2日以上コミット可能な方',
   ARRAY['マーケティング'], ARRAY['週2日〜','週3日〜'],
   ARRAY['一部リモート可','服装自由','一部リモート'],
   ARRAY['未経験OK','スタートアップ','データ分析','服装髪型自由'], 'published'),

  -- クラウドケア
  ('aaaaaaaa-0002-0002-0002-000000000002',
   '【CEO直下】急成長スタートアップの事業開発インターン｜インサイドセールス〜CSまで一貫担当',
   '時給1,400円〜2,000円', '東京都渋谷区 渋谷駅徒歩8分',
   E'■ 業務内容\n・新規顧客へのテレアポ・メール開拓\n・商談設定・同席サポート\n・既存顧客のオンボーディング・CS対応\n・顧客データの分析・施策提案\n\n■ やりがい\nCEO直下なので意思決定スピードが速く、提案がすぐ反映されます。',
   E'・コミュニケーション能力が高い方\n・ビジネスの仕組みを学びたい方\n・週3日以上コミット可能な方',
   ARRAY['営業','コンサルティング'], ARRAY['週3日〜','週4日〜'],
   ARRAY['出社あり','交通費支給'],
   ARRAY['IT業界','スタートアップ','テレアポ','未経験OK','交通費支給'], 'published'),

  ('aaaaaaaa-0002-0002-0002-000000000002',
   '【渋谷/未経験OK】SaaSプロダクトのUI/UXデザインインターン',
   '時給1,200円〜1,800円', '東京都渋谷区（リモート可）',
   E'■ 業務内容\n・BtoB SaaSのUI改善提案・ワイヤーフレーム作成\n・Figmaを使ったデザインカンプ制作\n・ユーザーテストの設計・実施\n・デザインシステムの整備',
   E'・Figmaの基本操作ができる方（未経験でも学習意欲があれば可）\n・週2日以上コミット可能な方',
   ARRAY['デザイナー'], ARRAY['週2日〜','週3日〜'],
   ARRAY['リモート可','フレックス','一部リモート','フレックス勤務'],
   ARRAY['未経験OK','ポートフォリオ作成','スタートアップ'], 'published'),

  -- WORK HERO
  ('aaaaaaaa-0003-0003-0003-000000000003',
   '【未経験OK/フルリモート】AI駆動開発に挑む｜自社プロダクト開発エンジニアインターン',
   '時給1,250円〜1,500円', 'フルリモート',
   E'■ 業務内容\n・自社AIツールのフロントエンド実装（React / Next.js）\n・API設計・実装（Node.js / FastAPI）\n・ユニットテスト・コードレビュー\n・社内ドキュメント整備\n\n■ 学習環境\nメンターが週1でレビュー。未経験でも丁寧にサポートします。',
   E'・HTML/CSS/JavaScriptの基礎知識がある方\n・週3日以上コミット可能な方\n・フルリモートで自律的に動ける方',
   ARRAY['エンジニア'], ARRAY['週3日〜','週4日〜'],
   ARRAY['フルリモート','フレックス','服装自由','フレックス勤務'],
   ARRAY['未経験OK','AI実装','メンター制度あり','服装髪型自由'], 'published'),

  ('aaaaaaaa-0003-0003-0003-000000000003',
   '【フルリモート/週2〜】AIプロダクトのカスタマーサクセスインターン',
   '時給1,100円〜1,400円', 'フルリモート',
   E'■ 業務内容\n・新規ユーザーへのオンボーディングサポート\n・チャットサポート対応（日/英）\n・FAQ・ヘルプドキュメントの整備\n・解約防止のためのユーザーヒアリング',
   E'・ユーザーファーストな考え方ができる方\n・英語で簡単なメールが書ける方（TOEIC600点以上推奨）\n・週2日以上コミット可能な方',
   ARRAY['コンサルティング','事務・アシスタント'], ARRAY['週2日〜','週3日〜'],
   ARRAY['フルリモート','フレックス','フレックス勤務'],
   ARRAY['グローバル','未経験OK','SaaS'], 'published'),

  -- SOEL
  ('aaaaaaaa-0004-0004-0004-000000000004',
   '【代表・CxO直下】AI開発×戦略採用｜本気の学生向け就労型インターン（有給）',
   '時給1,500円〜2,500円', '東京都港区 乃木坂駅徒歩3分',
   E'■ 業務内容\n・経営戦略・新規事業の立案支援\n・AIツールを活用した業務改善プロジェクト\n・クライアント向け提案資料の作成\n・定例ミーティングへの参加・議事録作成\n\n■ キャリア\nOBOGはコンサル・PE・投資銀行に多数進出。',
   E'・論理的思考が得意な方\n・責任感を持って業務に取り組める方\n・週3日以上コミット可能な方\n・就活でコンサルや金融を目指している方歓迎',
   ARRAY['コンサルティング','経営・企画'], ARRAY['週3日〜','週4日〜'],
   ARRAY['出社あり（一部リモート可）','交通費支給','服装自由','一部リモート'],
   ARRAY['スーツ不要','就活準備中歓迎','コンサル志望歓迎','戦略','交通費支給','服装髪型自由'], 'published'),

  ('aaaaaaaa-0004-0004-0004-000000000004',
   '【乃木坂/週3〜】ライター・コンテンツマーケティングインターン',
   '時給1,200円〜1,600円', '東京都港区 乃木坂駅徒歩3分（リモート可）',
   E'■ 業務内容\n・ビジネス系ブログ・SNSコンテンツの企画・執筆\n・SEO記事の調査・ライティング\n・メルマガ・LP文章の作成\n・効果測定・改善提案',
   E'・文章を書くことが好きな方\n・リサーチが得意な方\n・週3日以上コミット可能な方',
   ARRAY['ライター・メディア','マーケティング'], ARRAY['週3日〜'],
   ARRAY['リモート可','服装自由','一部リモート'],
   ARRAY['未経験OK','ポートフォリオ作成','SEO','服装髪型自由'], 'published')

ON CONFLICT DO NOTHING;

RAISE NOTICE '✅ 完了: 4社のアカウント・企業情報・求人（8件）を作成しました';

END $$;
