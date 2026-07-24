# 手動で対応が必要な項目

最終更新: 2026-07-24（サイト公開モード切替を追加）

---

## 🔴 要対応: サイト公開モード切替のSQL（2026-07-24）

「公開／公開前（準備中）／メンテナンス」を管理者ページ（サイト状態タブ）で切り替える機能を追加。切替を保存・反映するには次のSQLを実行する。

- **`sql/2026-07-24_site_mode.sql` を Supabase → SQL Editor で実行**（`site_settings` テーブル作成＋初期値を「公開前(prelaunch)」で投入。何度実行しても安全）。

補足:
- 実行前はテーブルが無く、フォールバックで「公開」扱い（＝ゲートは効かない）。**実行した瞬間から初期値の「公開前」モードが有効**になり、一般訪問者は「準備中」ページ（/coming-soon）に誘導され、求人検索・一覧・詳細は非表示、検索エンジンにも登録されない（robots.txtでDisallow + noindex）。
- **管理者（ru_matsumoto@manabiph.com）でログイン中は、どのモードでも全ページを閲覧可能**（商談・保守用のバイパス）。商談時はこのアカウントでログインした端末で本番画面を見せる。
- 公開する準備ができたら、管理者ページ「サイト状態」タブで「公開（通常）」に切り替える。

---

## ✅ 2026-07-21 自動検証の結果（本番DB・本番URLを直接確認）

本番DBとサイトを直接プローブして確認した。**下に「未実行」と書かれていたSQLは、実際にはすべて反映済みだった**ため、この節が最新の実態を示す。

実測で確認できたこと:
- **DBスキーマ: 27カラムすべて反映済み**（`form_submissions.phone` / `user_types.agreed_terms_at` / `terms_version` / jobs・companies・student_profiles の追加項目すべて）
- **テーブル: `email_templates` / `feature_tag_options` / `site_documents` すべて存在**。`chat_messages` は削除済み
- **匿名アクセス遮断OK**: `student_profiles` / `applications` / `form_submissions` / `user_types` は anon キーで1件も読めない（RLS稼働中）
- **Googleログイン有効・メール確認OFF・新規登録許可**（Supabase Auth設定）
- **本番の公開ページ21URLすべて200**、フルビルド成功（39ルート）
- **Slack即時通知は稼働中**（`#bizdev-all` へのWebhook送信を実測で確認）
- `/api/send-email` の宛先ハードニングは**すでに実装済み**（宛先はDBからサーバー側で確定＋所有権チェック済み。旧「残タスク」は解消済み）

まだ手動確認が必要なもの（外部からは判定不可）:
1. 🔴 **`sql/2026-07-21_rls_hardening.sql` の実行**（権限昇格の修正。外部からは検証できないため、未実行なら必ず実行すること。何度実行しても安全）
2. 🔴 **Resend のドメイン認証**（https://resend.com/domains で `intern.toukobe.com` が Verified か確認）。未認証だと本番の自動メールが全て失敗する。APIキーが送信専用のため外部から判定不可
3. 🔴 **Google OAuth同意画面の公開**（テストのままだとオーナー以外ログイン不可）
4. 🟡 **テストデータの削除**: 現在 応募2件・学生プロフィール2件・フォーム送信2件 が残存。動作確認で作ったものなら本番公開前に削除する
5. 🟡 **公開求人が1件のみ**（企業1社）。このまま公開すると検索結果がほぼ空になるため、掲載を増やしてからの公開を推奨

### この検証で見つけて修正したバグ（コード側・対応不要）

- 🔴 **申し込みフォームで複数メールを入力すると必ず送信失敗していた**: `/forms/early` `/forms/normal` は「請求先」「法人アカウント登録」メールを *「複数ある場合はカンマ区切りで入力してください」* と案内しているのに、API側は単体メール用の正規表現で検証していたため、案内どおり `a@x.com, b@y.com` と入力すると400で弾かれていた。しかもフォームは原因を出さず「送信に失敗しました」とだけ表示していた。→ カンマ区切りを1件ずつ検証する `isValidEmailList` を追加して解消（実コードでの単体テストと、API実測400→エラー文言表示まで確認済み）
- **フォームのエラー表示を改善**: APIが返す日本語メッセージを4フォームすべてで表示するようにした（従来はどんな失敗でも一律「送信に失敗しました」だった）

### 既知の未解決事項（本番影響なし）

- 🟡 **ローカル開発サーバーでのみ `/search` がスケルトン表示のまま止まる**（Supabaseへのリクエストが0件＝effectが走らない）。**本番 https://intern.toukobe.com/search は正常に求人が表示されることを実測で確認済み**のため利用者への影響は無い。devサーバー再起動でも再現するが原因未特定。ローカルで求人検索を触る際は要注意。

---

## ✅ 完了: フォーム電話番号 + Slack即時通知（2026-07-21・検証済み）

> 下記2つの手動作業は**両方とも完了済み**。`phone` 列の存在をDBで確認し、Slack通知は実際に `#bizdev-all` へ届くことを確認した。
> 採用したのは Incoming Webhook 方式（環境変数 `SLACK_WEBHOOK_URL`。ローカル `.env.local` と Vercel Production に設定済み）。
> 以下は経緯の記録。

### （記録）当時の残作業

全4フォーム（早期/通常申し込み・資料請求・お問い合わせ）に**電話番号を必須入力**として追加し、送信内容を**Slackへ即時通知**できるようにした（コード側は対応済み）。稼働させるには2つの手動作業が必要:

1. **電話番号カラムの追加**: `sql/2026-07-21_form_phone.sql` を Supabase → SQL Editor で実行（`form_submissions` に `phone` 列を追加。何度実行しても安全）。
   - 未実行でも送信は壊れないフォールバック入り（列が無い場合、電話番号は管理者宛メール／Slackにのみ載る）。管理画面の一覧・CSVに残すには実行が必要。
2. **Slack通知の有効化（メール投稿方式・Slackアプリ不要）**: フォーム送信時の管理者宛通知メールを、Slackチャンネルのメールアドレスにも送ることでチャンネルに投稿する。
   - Slackで通知したいチャンネルを開く → チャンネル名をクリック →「インテグレーション」タブ →「メールを送信（Send emails to this channel）」でチャンネル専用メールアドレスを発行。
   - 発行されたアドレス（例 `abc123@toukobe.slack.com`）を環境変数 `SLACK_CHANNEL_EMAIL` に設定。ローカル `.env.local` と **Vercel（Production/Preview）の両方**に追加。
   - 未設定の場合はチャンネル投稿だけスキップされる（フォーム送信・DB保存・管理者宛メールはそのまま動作）。
   - ※ Incoming Webhook 方式（環境変数 `SLACK_WEBHOOK_URL`）もコード上は残してあり、Slackアプリを作れる場合はそちらでも通知可能（任意）。今回はアプリのボットユーザー設定で詰まったためメール投稿方式を採用。

---

## 🔴🔴 最優先(ローンチブロッカー): RLS権限昇格の修正（2026-07-21）

セキュリティ監査で **重大な権限昇格ホール** を発見。`user_types` の自己INSERTポリシーが `user_id=auth.uid()` しか確認しておらず、ログインした攻撃者が自分の行を `user_type='company'` かつ `company_id=<任意の実在企業ID>` でINSERTでき、**その企業の応募者管理権限を奪取＝他社に応募した学生の個人情報（氏名・連絡先・大学・経歴）を閲覧し、選考ステータスを改ざんできる**状態だった。企業IDは公開ディレクトリから取得可能で、新規ユーザーは user_types 行が未作成の隙に実行できる。

- **`sql/2026-07-21_rls_hardening.sql` を Supabase → SQL Editor で必ず実行**（`user_types`の自己INSERTを「学生・company_id無し」に限定＋未使用の`companies`誰でもINSERTポリシー削除）。何度実行しても安全。
- 実行後、同ファイル末尾の確認クエリでポリシーを一覧し、`applications` のINSERTポリシーが `WITH CHECK (user_id = auth.uid())` になっているか確認する（緩い場合は張り替え。詳細は同SQL内コメント）。

検証済み: 匿名(anon)ロールは student_profiles / applications / user_types / 非公開求人 / form_submissions を一切読めず、書き込みも全てRLSで拒否されることを実DBで確認（＝RLS自体は有効。今回の穴は「認証済みユーザーの user_types 自己申告INSERT」に限定される）。

補足（別途検討・今回SQLには含めない）:
- `/api/send-email` は認証必須＋レート制限(20通/時)＋固定テンプレだが、`to`（宛先）がクライアント指定のまま。ログインユーザーが公式ドメイン差出で任意宛先に定型メール（内定/ウェルカム等）を送れる。宛先をサーバー側でDB由来に固定する改修を推奨（既知の残タスク）。

---

## 🔴 要対応: 規約同意の記録用SQL（2026-07-21）

学生登録時にチェックボックスで得た同意を、日時＋規約バージョンとしてDBに記録するようにした（コード側は対応済み・カラムが無くても登録は壊れないフォールバック入り）。記録を実際に残すには次のSQLを実行すること:

- `sql/2026-07-21_consent_tracking.sql` を Supabase → SQL Editor で実行（`user_types` に `agreed_terms_at` / `terms_version` を追加。何度実行しても安全）

補足:
- 規約・プライバシーポリシーを改定したら `utils/legal.ts` の `LEGAL_VERSION` を改定日に更新する（以降の同意はその版数で記録される）。
- 実行前に登録した学生は両カラムが NULL（同意自体は必須チェックで担保済み。記録が残るのはSQL実行後の登録から）。

---

## 🔴 進行中: 本番ドメイン移行（2026-07-11）

本番ドメインは `intern.toukobe.com`（サブドメイン方式）に決定。DNS は toukobe.com 本体と同じ Xserver 管理で、湯谷さんにレコード追加を依頼済み（2026-07-12 対応予定）。

完了済み:
- ✅ Vercel プロジェクト `toukobe-intern-b2kt` に `intern.toukobe.com` を追加（CNAME値も湯谷さんに送付済み）
- ✅ Resend に `intern.toukobe.com` を追加（DKIM/SPF/MX レコードも送付済み）
- ✅ コード内の旧仮ドメイン `toukobe-intern.com` を全箇所 `intern.toukobe.com` に置換
- ✅ Vercel 環境変数: `SUPABASE_SERVICE_ROLE_KEY` / `NEXT_PUBLIC_SITE_URL` を追加、`RESEND_FROM_EMAIL` を `noreply@intern.toukobe.com` に変更

DNS反映後の状況（2026-07-14更新）:
1. ✅ DNS反映確認済み。SSL証明書は自動発行されず `npx vercel certs issue intern.toukobe.com` で手動発行して解決 → **https://intern.toukobe.com は稼働中（200確認済み）**
2. 🔴 Resend: DKIM/SPF/MXレコードはDNSに反映済みだが、**ダッシュボードで Verify ボタンを押すまで認証未完了 → メール送信は403で失敗する**。https://resend.com/domains で Verify を押すこと
3. 🔴 Supabase → Authentication → URL Configuration: Site URL を `https://intern.toukobe.com` に変更、Redirect URLs に `https://intern.toukobe.com/**` を追加（未対応）
4. 🔴 Resend認証後、管理者ページ「メール文面」タブの「自分にテスト送信」で送信確認
5. 🔴 SQL未実行: `sql/2026-07-11_featured_jobs_and_site_documents.sql` と `sql/2026-07-14_email_templates_and_job_details.sql` を SQL Editor で実行（メール文面編集・注目求人・求人詳細項目・企業セルフ登録の穴塞ぎに必要）。※07-14のSQLには user_types のユニーク制約(④)を後から追記したため、**以前に実行済みでももう一度実行すること**（何度実行しても安全）

---

## ✅ ローンチ前総点検（2026-07-14 自動監査）

本番DBに対するE2Eテストで以下すべての通過を確認（テストデータは完全削除済み）:
- 学生: サインアップ → 種別登録 → プロフィール保存 → 編集
- 企業: アカウント発行(仮PW) → ログイン → パスワード変更 → 求人投稿(承認待ち) → 公開
- 応募: 学生が公開求人を閲覧・応募 → 企業が応募・応募者プロフィール閲覧 → 選考ステータス更新
- 本番の全公開ページ(19URL)が200、フルビルド成功

修正したバグ:
- 🔴 プロフィール保存時の user_types upsert がRLSにより必ず失敗する問題（全学生の登録を止める致命傷）
- 🔴 user_types にユニーク制約が無く重複行を作れる問題（コード側ガード+SQLに制約追加）
- 企業ページに代表者・関連URLが未表示 / 架空のAPI Docsタブ / 対象大学の曖昧な文言

---

## ✅ 2026-07-07 の自動修正（コード側・対応不要、記録のみ）

- 🔴 **お問い合わせフォームが全件500エラーだったのを修正**: `form_submissions.company_name` の NOT NULL 制約により、企業名を送らない `/forms/contact` の送信が全て失敗していた。API側で空文字を補って解消（API実測で200確認済み）。DB変更は不要
- **退会機能を追加**: 学生はマイページから退会可能（`/api/delete-account`、E2E検証済み）。企業アカウントは403でお問い合わせ誘導
- **共通フッター**: 全公開ページに利用規約/プライバシーポリシー等へのリンクを追加
- **サインアップ堅牢化**: メール確認ONに設定変更しても壊れないよう、セッション無し時は確認画面→初回ログイン時に `/auth/setup` で登録完了する流れに（現在この Supabase プロジェクトはメール確認OFFと実測確認済み）
- その他: 応募者管理のN+1解消、選考通知メールの成否トースト、企業ダッシュボードのサイレント失敗解消、求人投稿の二重送信防止、フォームのレート制限メッセージ

---

## 🔴 チャット廃止に伴うDBクリーンアップ（2026-07-06）

アプリ内チャットを廃止し、連絡は双方の登録メールアドレス（`student_profiles.contact_email` / `companies.contact_email`）に一本化した。コード側の削除は完了済み。残る手動タスク:

- `sql/2026-07-06_drop_chat_messages.sql` を Supabase SQL Editor で実行して `chat_messages` テーブルを削除する（チャット履歴は完全に消えるので、必要ならバックアップを先に取る）

---

## ✅ デモデータ全削除（2026-07-11 完了）

ローンチに向けて、デモ企業4社・テスト企業/学生アカウント・全求人(28件)・応募(4件)・フォーム送信履歴(3件)を削除した。**残っているのは管理者 `ru_matsumoto@manabiph.com` のみ**。削除前の全データは `C:\Users\loumi\toukobe-intern-backup-2026-07-11\` にJSONでバックアップ済み。

- これでGitHubに公開されていたデモ企業パスワード（`Demo1234!`）の問題も解消（アカウント自体が消滅）
- ⚠️ `seed/fake_companies.sql` を本番で再実行すると同じ公開パスワードで復活するので、**本番では二度と実行しないこと**
- 🟡 Supabase Storage の `job-covers` バケットに求人カバー画像の残骸がある可能性（実害なし・気になれば手動削除）

---

## ✅ 環境変数（2026-07-11 本番設定完了）

Vercel（Production / Preview）に以下すべて設定済みを確認:
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` / `RESEND_API_KEY` / `RESEND_FROM_EMAIL`（`noreply@intern.toukobe.com`）/ `NEXT_PUBLIC_SITE_URL`（`https://intern.toukobe.com`）

- Secret key は旧 service_role キーの後継で supabase-js にそのまま渡せる（コード変更不要）。管理者ページの「企業を追加」がこのキーを使用。
- 🟡 注意: `RESEND_FROM_EMAIL` を本番ドメインに切り替えたため、**Resend のドメイン認証（DNS反映）が完了するまで自動送信メールは失敗する**（フォーム送信内容自体はDBに保存されるので消失はしない）。ローカル `.env.local` はテスト用 `onboarding@resend.dev` のまま（管理者宛転送・件名に [テスト]）。

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

## ✅ Supabase Realtime（設定済み確認 2026-07-03 / チャット廃止 2026-07-06）

`jobs` は `supabase_realtime` パブリケーションに登録済み（管理者の承認待ちバッジで使用）。`chat_messages` はチャット廃止に伴い不要になった（テーブルDROPでパブリケーションからも自動的に外れる）。

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
- ❌ 廃止（2026-07-06）: チャット機能自体を削除し、連絡はメールに一本化した

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
- ✅ 対応済み（2026-07-21 検証）: `to` はクライアント指定を一切使わず、サーバー側で `applications` → `jobs` → `companies`/`student_profiles` を辿って確定する方式に移行済み。呼び出し元の所有権（学生本人か、その求人を持つ企業か）も検証している。

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
| 通知バッジ | 管理者（承認待ち求人）※未読メッセージバッジはチャット廃止で削除 | ✅ |
| 言語設定 | `app/layout.tsx` | ✅ |
| 姓名分離・生年月日・学部学科 | `dashboard/student`, `auth/signup-profile` | ✅ |
| 学年選択肢更新 | 同上 | ✅ |
| 学部・学科 必須 | 同上 | ✅ |
| スマホ対応 | 主要ページ | ✅ |
