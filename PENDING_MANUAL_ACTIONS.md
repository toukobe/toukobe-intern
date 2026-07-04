# 手動で対応が必要な項目

最終更新: 2026-07-03（2回目の監査で以下を自動修正済み: 404/エラーページ・セキュリティヘッダー・求人/企業詳細のOGP/JSON-LD・公開ページのmetadata・ブランドfavicon差し替え・Webマニフェスト・チャットのモバイルUX・Supabase preconnect）

---

## 🔴 ローンチ前必須: デモ企業アカウントのパスワード変更

`seed/fake_companies.sql` で作成した架空企業4社（demo-milestone / demo-cloudcare / demo-workhero / demo-soel @toukobe.test）のパスワードは `Demo1234!` で、**GitHubリポジトリに公開されています**。本番DBでこのseedを実行済みの場合、誰でもこれらの企業アカウントにログインできます。

ローンチ前に以下のいずれかを実施してください（Supabase ダッシュボード → Authentication → Users）:
- 4アカウントのパスワードを強力なものに変更する、または
- 4アカウントを削除する（求人・企業データを残す場合はアカウントのみBan/無効化）

また、架空企業の求人が本番の検索結果に出続けるのが適切かどうかも判断してください（実企業の求人が揃ったら非公開化を推奨）。

---

## 🟡 環境変数（ローカル設定済み・本番未設定）

- ✅ `.env.local` に `SUPABASE_SERVICE_ROLE_KEY`（新体系の Secret key `sb_secret_...`）を設定済み（2026-07-03、キーの有効性確認済み）
- 🔴 **本番環境（Vercel等）には未設定**。デプロイ先の環境変数に同じ4つを設定すること:
  `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` / `RESEND_API_KEY` / `RESEND_FROM_EMAIL`
- Secret key は旧 service_role キーの後継で supabase-js にそのまま渡せる（コード変更不要）。管理者ページの「企業を追加」がこのキーを使用。

### 🔴 本番環境のメール設定
現在 `.env.local` は `RESEND_FROM_EMAIL=onboarding@resend.dev`（テストモード）のため、**全メールが管理者宛に転送され、件名に [テスト] が付きます**。本番では:

1. Resend ダッシュボードで `toukobe-intern.com` のドメイン認証（DNSレコード追加）
2. 本番環境変数に `RESEND_FROM_EMAIL=noreply@toukobe-intern.com` と `RESEND_API_KEY` を設定

---

## ✅ Supabase SQL（全項目 実行確認済み 2026-07-03）

DBを直接プローブして以下すべての反映を確認した:

1. ✅ student_profiles のカラム追加（last_name / first_name / birth_date / department）
2. ✅ jobs.cover_image_url
3. ✅ applications の重複防止UNIQUE制約（2重に存在するが無害）
4. ✅ 匿名read用ポリシー（companies / jobs published・paused）
5. ✅ job-covers バケット（public、6/30作成）

---

## 🟡 Googleログイン（設定済み・公開ステータスのみ残り）

2026-07-03 に設定完了・動作確認済み（authorize エンドポイントが Google へ正常にリダイレクトすることを確認）:

- ✅ Google Cloud Console で OAuth クライアント作成（リダイレクトURI設定済み）
- ✅ Supabase → Providers → Google 有効化（Client ID / Secret 設定済み）
- ✅ Supabase → URL Configuration（Site URL + Redirect URLs 4件）
- ✅ コード側の OAuth コールバックバグは 2026-07-02 修正済み（`/auth/callback` はクライアントページ）

**🔴 残り1つ: OAuth同意画面の公開**

現在「テスト」ステータスのため、**プロジェクトオーナーのGoogleアカウント以外はログインできません**。ローンチ前に必ず公開してください:

- https://console.cloud.google.com/auth/audience?project=toukobe-intern → 「アプリを公開（Publish app）」
- 基本スコープ（email / profile）のみなのでGoogleの審査は不要

---

## ✅ Supabase Realtime（設定済み確認 2026-07-03）

`chat_messages` と `jobs` はどちらも `supabase_realtime` パブリケーションに登録済み（ADD TABLE 実行時に「already member」エラーになることで確認）。通知バッジのリアルタイム更新は動く状態。

---

## 🟡 未完成の機能（コードだけでは完結しない）

### ~~資料請求フォーム~~
- ✅ 実装済み: `/forms/material`（資料請求）・`/forms/contact`（お問い合わせ）・`/forms/early`・`/forms/normal` の4フォームを作成済み
- ✅ 送信内容は `form_submissions` テーブルに保存され、管理者ページ（`/dashboard/admin` → フォーム申し込みタブ）で確認・ステータス管理・メモ・CSV出力が可能
- ✅ 送信時に管理者宛通知メール + 送信者宛確認メールを自動送信（`/api/form-submit`）

### ~~企業新規登録フロー~~
- ✅ `/auth/signup` ページに企業登録フローあり（会社名・業種・連絡用メール入力）
- ✅ `/auth/company-login` から新規登録リンクを追加済み

### ~~よくある質問ページ~~
- ✅ `/faq` ページ作成済み

### ~~チャット機能の既読管理~~
- ✅ 実装済みを確認（2026-07-03）: チャット画面を開いたとき相手のメッセージを一括で `is_read = true` に更新し、画面表示中のリアルタイム受信時も即時既読化する（`app/chat/[applicationId]/page.tsx`）

---

## ✅ セキュリティ: RLS 有効化・全ポリシー整備（2026-07-03 完了・検証済み）

調査の結果、**主要5テーブル（applications / companies / jobs / student_profiles / user_types）のRLS自体が無効**で、anonキーで全データの読み書きが可能な状態だった。`sql/2026-07-03_enable_rls.sql` を実行して修正済み:

- 全開放ポリシー（誰でも全応募・全学生プロフィールを読める等）を削除
- 不足ポリシーを追加（企業の応募閲覧/選考ステータス更新、登録フローのINSERT、管理者のみのフォーム閲覧・全件アクセス等）
- 5テーブルのRLSを有効化

外部から検証済み: 匿名は公開求人・企業のみ閲覧可、学生PII・応募・フォーム送信・下書き求人は遮断。企業アカウントは自社求人・自社への応募・応募者のプロフィールのみ閲覧可。

🟡 ブラウザでの最終確認推奨: 管理者ページ（統計カウント・求人/企業/フォームタブ）と学生の応募フローを一度ずつ触って正常動作を確認する。

### ~~`/api/send-email` が誰でも呼べる状態（オープンリレー懸念）~~ → 対応済み (2026-07-02)
- ✅ 認証必須化: `Authorization: Bearer <Supabaseアクセストークン>` を検証（未ログインは401）。3箇所の呼び出し元も更新済み。
- ✅ 全差し込みフィールドのHTMLエスケープ + 件名の改行除去（HTMLインジェクション/ヘッダインジェクション防止）
- ✅ ユーザー単位のレート制限（20通/時間、インメモリのベストエフォート）
- ✅ `/api/form-submit` も同様に強化（IPレート制限 5件/10分・メール形式検証・文字数制限・エスケープ）
- 🟡 残タスク: 独自ドメイン設定後、`to` をサーバー側でDBから再取得する方式（選択肢B）への移行を推奨。SUPABASE_SERVICE_ROLE_KEY 設定後に対応可能。

---

## ✅ 実装済み（確認のみ）

| 機能 | ファイル | 状態 |
|---|---|---|
| ログイン後リダイレクト | `auth/login`, `auth/callback` | ✅ |
| 企業ダッシュボード求人グリッド | `dashboard/company` | ✅ |
| 求人停止時の応募ブロック | `jobs/[id]` | ✅ |
| 求人カバー画像 | `dashboard/post-job`, `dashboard/edit-job/[id]` | ✅ |
| 重複応募防止 | `jobs/[id]` + DB制約 | ✅ |
| 未確認ステータス | `dashboard/company/applicants` | ✅ |
| 通知バッジ | 学生・企業・管理者 | ✅ |
| 言語設定 | `app/layout.tsx` | ✅ |
| 姓名分離・生年月日・学部学科 | `dashboard/student`, `auth/signup-profile` | ✅ |
| 学年選択肢更新 | 同上 | ✅ |
| 学部・学科 必須 | 同上 | ✅ |
| スマホ対応 | 主要ページ | ✅ |
