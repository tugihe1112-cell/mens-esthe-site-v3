# mens-esthe-site（サイト名: メンエスマップ） — Claude引き継ぎドキュメント

新しいチャットを開いたら、まずこのファイルを読ませること。
これだけで作業の全文脈を即座に理解できる。

> **最終更新: 2026-06-08 （パフォーマンス・セキュリティ修正）**
>
> ※ 2026-06-08: Code Splitting実装（App.jsx全ページをReact.lazy+Suspenseに変更）。初回ロード時のJS転送量を大幅削減。git push → Vercelデプロイ済み。
> ※ 2026-06-08: Code Splitting導入後にサイト全壊（"Something went wrong"）。原因: vercel.jsonのrewriteルール `/((?!api/).*)` が `/assets/` チャンクもindex.htmlに転送していた。`/((?!api/|assets/).*)` に修正して解決。
> ※ 2026-06-08: Storage RLS設定（supabase_migrations/05_storage_rls.sql）。therapist-imagesバケットへのフロントエンドからの直接アップロード・削除をブロック。Supabase SQL Editorで実行済み（Success確認）。
> ※ 2026-06-08: 不要ファイル整理。_archive/フォルダに旧バージョンファイルを移動。
> ※ 2026-06-08: 千葉・埼玉 全エリアshop登録完了。千葉（千葉市・松戸・柏）13店舗・埼玉（大宮・浦和・川口蕨・越谷春日部・川越・所沢）29店舗 計42店舗登録。image_urlも同時設定（12件はChrome経由でlogo取得、4件はサイトダウンでnull）。スクリプト: process_chiba_saitama_shops.mjs + fix_chiba_saitama_images.mjs
> ※ 2026-06-08: 千葉・埼玉 セラピスト登録完了。合計約913名登録。メインスクリプト685名 + Chrome取得分228名（rose15/eden53/neverland32/pink_lady25/madame_relax36/aroma_liberty21/magokoro42/bariano56/bijo_spa9）。bariano・bijo_spaは名前のみ（画像JS描画で取得不可）。未処理: lovers（React SPA）・saitama_omiya_ace（URL誤登録）
>
> ※ 2026-06-07: 大和エリア Offside(62名)・Queen Terrace(21名)・mahalo(9名) 登録完了。厚木エリア CODE:4030(51名)・Salon Delight(19名)・SixthSense(39名/名前のみ) 登録完了（計201名）。calme・anokono・chill等はshop登録のみ。スクリプト: process_yamato_atsugi_shops.mjs + fix_mahalo_yamato.mjs
> ※ 2026-06-07: 藤沢エリア Navel(158名/名前のみ)・ALICE(40名/名前のみ)・Plumeria(13名/名前のみ)・辻堂(18名/名前のみ) 登録完了（計229名）。ROUGE・Irene・4JS店はshop登録のみ。スクリプト: process_fujisawa_shops.mjs + fix_plumeria_fujisawa.mjs
> ※ 2026-06-07: 川崎エリア RiRe(52名)・Fromage(33名/名前のみ)・Mint Club(20名/名前のみ) 登録完了（計105名）。doigt de fee・DEEP ESSENTIAL・gold・chouchou・gentlemen-houseはshop登録のみ。スクリプト: process_kawasaki_shops.mjs + fix_fromage_kawasaki.mjs
> ※ 2026-06-07: 新横浜エリア KingSpa(43名)・Perfume(17名)・Marine綱島(81名/名前のみ)・NOI(35名) 登録完了（計176名）。Natura・aikagi・aroma-rafeel・mtimeはshop登録のみ。スクリプト: process_shinyokohama_shops.mjs + fix_noi_shinyokohama.mjs
> ※ 2026-06-07: 関内エリア9店舗 YURU SPA(73名)・AZALEA(18名)・Lynx横浜関内(93名) 登録完了（計184名）。姫のエステ・Selesa・Aroma Pult・CRESTはshop登録のみ。スクリプト: process_kannai_shops.mjs + fix_lynx_yokohama.mjs
> ※ 2026-06-07: 横浜エリア9店舗 Guarigione(112名)・りらっくらぶ(37名)・TeTe(52名)・PLAY BOY CLUB(54名)・Loose.a.mood(15名/名前のみ)・THE BLANC(31名)・Y PRIME(36名) 登録完了（計337名）。honoka(6位)は神奈川県で登録済み。Chloe・M dotはJS描画のためshop登録のみ。スクリプト: process_yokohama_shops.mjs + fix_yokohama_blanc_yprime.mjs
> ※ 2026-06-07: 武蔵小杉9店舗 Agu(53名)・Ho・O・Zu・Ki・SPA(98名)・エステ美人マダム(23名)・ROYCE(19名)・Revere Spa(31名/画像なし)・ラプソディースパ(71名)・Amateras(132名)・SUPERNOVA(72名)・Whiteスパ(116名) 登録完了（計615名）。doigt de fee(4位)は名前非公開のためスキップ。Revere Spaの画像はCloudflare保護で取得不可（名前のみ）。
> ※ 2026-06-07: あざみ野9店舗 む・む・むSPA(65名)・Cuas(8名)・honoka(40名/画像なし)・AUDIENCE(67名)・KAHLUA MILK(34名)・su:(7名/画像なし)・iDOL(19名/画像なし) 登録完了。MOANA(5位)は溝の口で登録済み。LIEN(10位)は出張型スキップ。
> ※ 2026-06-07: 溝の口7店舗 tan(100名)・Relaxia(49名)・MOANA(31名)・ACRO(36名)・ORION SPA(37名)・星の王子さま(24名)・Feel(67名/名前のみ) 登録完了（計344名）。doigt de fee(5位)はスキップ。エステ美人マダム(2位)・ラプソディースパ(7位)は武蔵小杉で登録済み。
> ※ 2026-06-07: 登戸5店舗 Will Be(18名)・ねこのて(65名)・GREEN APPLE(129名)・Fantastic(30名)・moi SPA(9名) 登録完了（計251名）。doigt de feeは名前非公開のためスキップ。
> ※ 2026-06-07: 荻窪 熟的(12名) 登録完了。Yorimichi荻窪ルームはサイトダウンのためスキップ。JJ荻窪は中野と同一サイトのためスキップ。CREST SPA荻窪は2026-05-07の4店舗一括登録に含まれている可能性あり（要確認: check_all_shops_status.mjs | grep crest）。
> ※ 2026-06-06: Lucky Cat(90名)・ADAMAS(24名)・Garden SPA(110名)・エルドラド(118名)・必殺あきば娘(81名)登録完了。
> ※ 2026-06-06: 錦糸町追加6店舗 High Time Spa(83名)・COCONA GRAN(103名)・Neo MIYABI(42名)・撫子(28名)・Aroma Fairy(78名)・LUXUE(49名) 登録完了（計383名）。
> ※ 2026-06-06: 中野・高円寺6店舗 Salvador(32名)・Spaflame(54名)・JJ中野(17名)・Room one(17名)・マダムの楽園(31名)・Allie(47名) 登録完了（計198名）。
> ※ 2026-06-06: 吉祥寺・三鷹8店舗 Yorimichi(130名)・moshimo(33名)・ROOKIE(20名)・まろん(51名)・エステ美人マダム(7名)・APEX(16名)・Aroma ELLA(30名)・Mspa(74名) 登録完了（計361名）。
> ※ 2026-06-06: 葛西・浦安9店舗 GIRIGIRILAND(20名)・内緒のカノジョ(20名)・Oblige(38名)・LaMer(52名)・AROMA VENUS(20名)・NOBLE(45名)・Onikando(38名)・UBU彼女(43名)・PhiPhiLei(55名) 登録完了（計331名）。
> 作業がひと段落するたびに、Claudeがこのファイルを自動更新する。

---

## ★ 全体の作業方針（必読）

### 何をやっているか
**ランキング・口コミサイトから人気店を探し、DBに未登録の店舗を登録していく作業。**

参照サイト:
- `https://mens-mg.com/` — エリア別ランキング（主力）
- `https://men-esthe.jp/` — 口コミ・ランキング
- `https://mens-est.jp/` — 口コミサイト

### 1店舗あたりの登録手順
1. ランキングサイトで未登録店舗を特定
2. 公式サイトからセラピスト一覧をスクレイピング（cheerio or Claude in Chrome）
3. `shops` テーブルに登録（**`image_url` = og:imageを必ず同時設定**）
4. `therapists` テーブルにセラピスト一覧を登録（画像をSupabase Storageにアップロード）
5. CLAUDE.mdの作業ログを更新

### ⚠️ 鉄則：セラピスト登録なしで次のエリアに進まない
- shopを登録したら**必ずその場でセラピストも登録**する
- セラピスト未登録のまま別エリアに移動することは禁止
- 取得できない場合（JS描画・非公開）は「名前のみ登録」または「スキップ理由をログに残す」こと

### ⚠️ 鉄則：新エリア追加時は locations.js も必ず更新する
新しい都道府県・エリアの店舗を登録したら、**必ず** `src/data/locations.js` を更新すること。
UIのエリアドロップダウンはこのファイルがソースのため、更新しないと新しいエリアが表示されない。

**更新箇所（2箇所）:**
1. `WARDS` オブジェクト → 都道府県キーのリストに新エリア名を追加 + 新エリア単体のエントリも追加
2. `PREF_CITY_MAP` オブジェクト → 都道府県キーのリストに新エリア名を追加

**ルール:**
- `shops.raw_data.area` に設定した値と `WARDS` のキー名を完全一致させること
- 例: `area: '越谷・春日部'` → `WARDS["越谷・春日部"] = ["越谷・春日部", ...]` が必要

### 都道府県別 完了状況（2026-06-08時点）

| 都道府県 | 状態 | 備考 |
|----------|------|------|
| **東京都** | ✅ 完了 | 498/503店舗。残り5店舗はANAICHI（JS描画） |
| **神奈川県** | ✅ スキャン完了 | 主要エリアはすべて登録済み。31店舗はshop登録のみ（セラピスト未処理・後回し） |
| **大阪府** | ✅ 完了 | 40/40店舗 |
| **愛知県** | ✅ 完了 | 24/24店舗 |
| **埼玉県** | ✅ 完了 | 13/13店舗 |
| **千葉県** | ✅ 完了 | 千葉・松戸・柏エリア登録済み。セラピスト約180名登録 |
| **埼玉県** | ✅ 完了 | 大宮・浦和・川口蕨・越谷春日部・川越・所沢エリア登録済み。セラピスト約730名登録 |
| **兵庫県** | ✅ 完了 | 7/7店舗 |
| **福岡県** | ✅ 完了 | 6/6店舗 |
| **宮城県** | ✅ 完了 | 7/7店舗 |
| **京都府** | ✅ 完了 | 12店舗（追加11店舗 2026-06-08登録） |
| **滋賀県** | ✅ 完了 | 1/1店舗 |
| **静岡県** | ✅ 完了 | 1/1店舗（竜宮城 沼津店のみ） |
| **奈良県** | ✅ 完了 | 9店舗（2026-06-08登録）セラピスト161名登録（NAROMA・AROMA CLINIC NARAは取得困難でスキップ） |
| **和歌山県** | ✅ 完了 | 9店舗（2026-06-08登録）セラピスト200名登録（キューピット・Melty Aromaはサイトダウンでスキップ） |
| **広島県** | ❌ 未着手 | — |
| **北海道** | ❌ 未着手 | — |
| その他全都道府県 | ❌ 未着手 | mens-mg.comで人気店を確認してから着手 |

### 次にやること
未着手の都道府県を `https://mens-mg.com/` でランキングを確認 → 人気店TOP10前後を登録していく。
優先度: 広島 → 北海道 → その他

※ 千葉・埼玉はshop・セラピスト登録ともに完了（2026-06-08）。

---

## 外部サービス アカウント情報

| サービス | ID/メール | 備考 |
|---------|----------|------|
| ムームードメイン | tugihe1112@gmail.com | mens-esthe-map.jp 登録 |
| Supabase | tugihe1112@gmail.com | mens-esthe-db プロジェクト |
| Vercel | tugihe1112@gmail.com | mens-esthe-site プロジェクト |
| Resend | tugihe1112@gmail.com | メール送信 |
| Resend SMTP用APIキー | ~~`re_dQbJc5MF_2uanmWpT3xejLQ5RiyZmRV8M`~~ | **削除済み**（GitHub露出のため無効化） |
| Supabase Auth Hook Secret | `v1,whsec_eIua8euaVbUH8hn08m7Xs+QIzwlfLp5B7K81GaO5UfJ03aeyZg7U4aqr6wzpF9Qgw/HjIDrSHf4kMjUN` | Send Email Hook登録済み（現在は未使用） |

※パスワードはiCloudキーチェーンで管理すること

---

## ⚠️ 未実装・今後やること（コンテンツが増えたタイミングで対応）

- [ ] **Stripe決済実装（プレミアム課金）**
  - 現状: PremiumPageの「登録する」ボタンはSupabaseのprofilesテーブルを直接`plan:'premium'`に書き換えるだけ。**誰でも無料でプレミアムになれる状態**
  - 実装方法: Stripe Checkout（ホステッドページ）方式が最も簡単
    1. Stripeアカウント作成 → 月額2,980円・年額29,800円の商品を作成
    2. `api/create-checkout-session.js` 作成（Vercelサーバーレス）
    3. `api/stripe-webhook.js` 作成（支払い完了時にDB更新）
    4. `PremiumPage.jsx` のhandleSubscribeをAPIコールに変更
    5. Vercel環境変数: `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_ID_MONTHLY` / `STRIPE_PRICE_ID_YEARLY`
  - 所要時間: 約2〜3時間（Stripeアカウント審査別）
  - **コンテンツが充実してユーザーが定着してから実装すること**

- [x] **Google Analytics（GA4）設定**
  - 現状: アクセス解析ツールが一切入っていない
  - 実装: `index.html` に GA4 の gtag.js スクリプトを追加するだけ（30分）
  - Googleアカウントで `analytics.google.com` にアクセス → プロパティ作成 → 測定IDを取得
  - `index.html` に `<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX">` を追加
  - **リリース直後に設定推奨。データは蓄積系なので早いほど良い**

- [x] **口コミ投稿時の管理者メール通知**
  - 現状: ユーザーが口コミを投稿しても管理者に通知が来ない。管理画面を手動で確認する必要がある
  - 実装: `api/notify-review.js` を作成し、PostReviewPageのonSubmit成功後にResend経由で`tugihe1112@gmail.com`に通知メール送信
  - 所要時間: 約1時間

- [x] **favicon.ico 追加**
  - 現状: `public/` に `favicon.ico` が存在しない（manifest.jsonにはPWAアイコンあり）
  - 実装: `public/favicon.ico` を追加（16×16 or 32×32 px）
  - ブラウザのタブにアイコンが表示されるようになる

- [ ] **口コミ一部公開 → SSR移行（フェーズ2）**
  - 現状: 口コミはWrite-to-Read制で全員非公開。GoogleがコンテンツをインデックスできないためSEO上限がある
  - 方針: 各セラピストの口コミ1件目を全公開にすると、「シルク 渋谷 永井さつき 口コミ」のような長尾キーワードで検索流入が生まれる
  - SEO×課金の両立: 1件目公開 → 続きを読むには課金（NYT・Mediumと同じメタードペイウォール方式）
  - SSR必要性: 公開口コミをGoogleに確実にインデックスさせるにはSSR（サーバーサイドレンダリング）が必要。現在のReact SPAではJSが実行されないとコンテンツが見えない
  - 移行コスト: Next.js移行が前提 → 数ヶ月の工数。今すぐではなく**口コミが各セラピストに2〜3件ついてから着手すること**
  - フェーズ:
    1. フェーズ1（今）: Write-to-Readでコンテンツを増やす
    2. フェーズ2（口コミが充実したら）: 1件目を全公開 → SEO流入開始 → Next.js移行検討
    3. フェーズ3（流入安定後）: Stripe課金 + SSR本格移行

- [ ] **店舗向けクリック課金（CPC）モデル実装（フェーズ3）**
  - 現状: 収益モデルはユーザー向けプレミアム課金のみ（しかも未実装）
  - 方針: 固定月額（BtoB）だけでなく「店舗公式サイト・予約LINEへの遷移数」に応じたクリック課金を追加
  - メリット: 「効果が見えた分だけ払う」ため店舗側の導入ハードルが低い。トラフィックが増えるほど自動的に収益が上がる構造
  - 実装イメージ: ShopDetailPageの「公式サイト」「LINE予約」ボタンにクリック計測を追加 → 月次で集計 → 請求
  - 前提条件: **一定のトラフィック（月間PV数千以上）がないと店舗に価値を示せないため、ユーザー獲得が先**

---

## ⚠️ 公開前にやること（リリースチェックリスト）

- [x] **メール送信元を本番用に変更**（2026-05-29）
  - Resend ダッシュボード → Domains → `mens-esthe-map.jp` を追加・DNS認証済み（Verified）
  - `api/notify-credit.js` の `from:` を `'メンエスマップ <noreply@mens-esthe-map.jp>'` に変更済み

- [x] **DNS反映後の作業（mens-esthe-map.jp）**（2026-05-30）
  - `https://www.mens-esthe-map.jp` HTTP 200確認済み
  - 裸ドメイン `https://mens-esthe-map.jp` → `https://www.mens-esthe-map.jp/` に307リダイレクト確認済み
  - Vercel 環境変数 `VITE_PUBLIC_SITE_URL` を `https://www.mens-esthe-map.jp` に更新済み
  - `public/sitemap.xml` のドメインを `https://www.mens-esthe-map.jp` に更新済み

- [x] **Vercel 環境変数を設定済み**（2026-05-24）
  - `RESEND_API_KEY` — Resend API キー（Production & Preview）
  - `SUPABASE_SERVICE_ROLE_KEY` — Supabase サービスロールキー（Production & Preview）
  - `VITE_PUBLIC_SITE_URL` — `https://mens-esthe-site-beta.vercel.app`（本番ドメイン取得後に更新）
  - `VITE_SUPABASE_ANON_KEY` — Supabase 匿名キー（All Environments、Mar 28 設定済み）
  - `VITE_SUPABASE_URL` — Supabase URL（All Environments、Mar 28 設定済み）
  - ⚠️ `VITE_PUBLIC_SITE_URL` は本番ドメイン確定後に `https://mens-esthe.jp` 等に更新すること

- [x] **RLS ポリシーを Supabase に適用済み**（2026-05-29）
  - `supabase_migrations/04_rls_policies.sql` を Supabase SQL Editor で実行・Success確認済み
  - 対象: `reviews` / `user_credits` / `shops` / `therapists` / `review_likes` / `user_badges` / `chat_messages`

- [x] **お問い合わせフォームの実装**（2026-05-30）
  - `api/contact.js` 新規作成（Resend経由、送信先 `CONTACT_TO_EMAIL` or `tugihe1112@gmail.com`）
  - `src/pages/ContactPage.jsx` 新規作成（カテゴリ: 掲載情報の修正 / 口コミ・投稿について / 有料プランについて / その他）
  - `/contact` ルート追加（`App.jsx`）
  - `LegalPage.jsx` のお問い合わせ文言を `/contact` へのリンクに変更
  - `Footer.jsx` にお問い合わせリンク追加・コピーライトを「メンエスマップ」に変更
  - honeypot・文字数制限・メール形式チェックあり
  - git push済み（commit: 726197f）→ Vercelデプロイ完了

- [x] **SEO対応（2026-05-31）**
  - SeoHead全ページ追加（noindex対応・privateページ含む）
  - JSON-LD構造化データ（HealthAndBeautyBusiness）をShopDetailPageに追加
  - sitemap.xmlに /area/:pref 14都道府県ページ等を追加（494URL）
  - meta description をページ別に改善
  - OG画像（1200×630）を自前ブランド画像に変更

- [x] **パフォーマンス・セキュリティ強化（2026-05-31）**
  - `api/og.js`: 動的OGP画像生成（@vercel/og、店舗名・セラピスト名入り1200×630）
  - `src/components/LazyImage.jsx`: Supabase Storage画像をWebP自動変換（/render/image/public/）・フォールバックバグ修正
  - `vercel.json`: 静的アセットキャッシュ1年（immutable）+ セキュリティヘッダー5種追加（SecurityHeaders.com A評価）
  - `tailwind.config.js`: システムフォント優先（Inter削除、iOS/Android/Windows対応）
  - `index.html`: Supabase preconnect/dns-prefetch追加
  - `Footer.jsx`: エリア別内部リンク13都道府県追加（SEOクロール効率化）

- [x] **サインアップ確認メール実装（2026-05-31）**
  - 最終方式: `api/auth/signup.js`（Vercelサーバーレス）で `createUser` + `generateLink` + Resend送信を一括実行
  - RegisterPage: `supabase.signUp()` を廃止 → `/api/auth/signup` にPOSTするだけ
  - 失敗時はユーザーを自動削除してロールバック
  - `src/pages/AuthConfirmPage.jsx`: `/auth/confirm` で確認トークン処理
  - 試みたが動かなかった方式: Supabase SMTP（Resend）・Supabase Auth Hook（HTTPS）
  - 根本原因: Supabase無料プランでHTTP Auth HookがVercelエンドポイントを呼ばない（無料プランはHTTP Hook非対応）

---

## プロジェクト概要

メンズエステ店舗の情報サイト。各店舗のセラピスト一覧・スケジュール・料金などを掲載。

- **フロントエンド**: React + Vite + Tailwind CSS
- **バックエンド/DB**: Supabase（PostgreSQL + Storage）
- **デプロイ**: Vercel
- **ローカル起動**: `npm i && npm run dev`

---

## Supabase テーブル構造

### `shops` テーブル（主要カラム）

| カラム | 説明 |
|--------|------|
| `id` | 例: `aichi_kanayama_number9`（都道府県_エリア_店名） |
| `name` | 表示名 例: `Number9 (ナンバーナイン)` |
| `website_url` | 公式サイトURL |
| `image_url` | サムネイル画像URL |
| `schedule_url` | スケジュールページURL |
| `raw_data` | JSON。`raw_data->>prefecture` で都道府県フィルタ |

### `therapists` テーブル（主要カラム）

| カラム | 説明 |
|--------|------|
| `id` | `{shop_id}_{name}` 例: `aichi_kanayama_number9_彩` |
| `shop_id` | `shops.id` への外部キー |
| `name` | セラピスト名 |
| `image_url` | 写真URL（Supabase Storageまたは元サイトURL） |

---

## スクリプト構成

```
scripts/
├── debug/         調査・確認用（DBを変更しない）
└── maintenance/   実際にDBを更新するスクリプト
```

### 共通パターン（全スクリプト共通）

```js
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));
```

- `.env` に `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` が必要
- `--dry-run` フラグ対応が基本（DB変更なしで動作確認）
- 実行: `node scripts/maintenance/xxx.mjs [--dry-run]`

### 画像アップロードパターン

セラピスト画像は `therapist-images` バケットにアップロードしてからURLを保存。
`process_marigold_mrscrystal.mjs` の `uploadImage()` 関数が標準実装。

### ⚠️ 店舗画像（image_url）設定ルール【必須】

**新規店舗登録時は必ず `shops.image_url` も同時に設定すること。**

- サイトカードに表示される画像 = `shops.image_url`
- 未設定だとカードがグレーの丸（プレースホルダー）になる
- 取得優先順位: og:image → twitter:image → apple-touch-icon → ロゴ・背景画像
- 取得方法: `website_url` に対して `fetch` + cheerio で `<meta property="og:image">` を抽出するだけ
- 参考実装: `fix_missing_shop_images.mjs`（既存の一括修正スクリプト）

```js
// 店舗登録スクリプト内での標準パターン
async function getOgImage(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    const $ = cheerio.load(html);
    return $('meta[property="og:image"]').attr('content')
        || $('meta[name="twitter:image"]').attr('content')
        || $('link[rel="apple-touch-icon"]').attr('href')
        || null;
  } catch { return null; }
}
// shop登録時に image_url: await getOgImage(shop.website_url) を含める
```

**既登録でimage_urlなしの店舗**: 神奈川県全エリア（2026-06-07登録分）等を一括修正予定。

---

## 都道府県別 作業状況

### ✅ 完了済み

| 都道府県 | 完了日 | 店舗数 | 備考 |
|----------|--------|--------|------|
| **愛知県** | 2026-05-05 | 24店舗 | JS描画系（Cucue, century, ゆりかご等6店舗）はスキップ |
| **福岡県** | 2026-05-05 | 7店舗 | 全店舗セラピスト登録完了 |
| **宮城県** | 2026-05-06 | 8店舗 | 全店舗完了。Cuaura閉店のため削除。Aroma No5は名前のみ登録 |
| **兵庫県** | 2026-05-07 | — | `fix_hyogo_issues.mjs` + `process_himawari_eslino.mjs` 適用済み。ひまわり65名・Kobe Eslino 109名×2登録 |
| **京都府** | 不明 | — | `fix_kyoto_shop_images.mjs` 適用済み |
| **大阪府（一部）** | 2026-05-07 | — | 俺の家111名・Mirajour 197名登録。他店舗は `check_osaka_therapist_status.mjs` で要確認 |
| **千葉県（一部）** | 2026-05-07 | — | 超レベチなエステ24 20名×2店舗登録 |

#### 愛知県 店舗別セラピスト数（2026-05-05 確定）

| 店舗 | 人数 | スクリプト |
|------|------|-----------|
| メンズエステ一宮 | 41名 | — |
| Number9 (ナンバーナイン) | 47名 | `process_number9_milkrepos_aromana.mjs` + `fix_number9_milkrepos_names.mjs` |
| Galaxy-NAGOYA (ギャラクシー) | 10名 | — |
| milk repos (ミルクルポ) | 73名 | `process_number9_milkrepos_aromana.mjs` + `fix_number9_milkrepos_names.mjs` |
| タイガーアイ | 100名 | — |
| Tororich (とろリッチ) | 13名 | — |
| Aromana (アロマーナ) | 66名 | `process_number9_milkrepos_aromana.mjs` |
| CAMPBELL (キャンベル) | 17名 | — |
| M Spa (エムスパ) | 35名 | — |
| RESEXY (リゼクシー) | 100名 | — |
| RICH AROMA (リッチアロマ) | 24名 | — |
| Spur Luxury (シュプールラグジュアリー) | 54名 | — |
| MADAME聖子 | 36名 | `fix_madame_seiko.mjs` |
| マジセラ | 37名 | — |
| VENIRE (ヴェニーレ) | 93名 | — |
| チャンス名古屋 | 32名 | `fix_chance_names.mjs` |
| ENCORE (アンコール) | 25名 | — |
| GOLDEN ROSE | 51名 | — |
| Mrs Crystal (ミセスクリスタル) | 84名 | `process_marigold_mrscrystal.mjs` + `fix_mrscrystal_names.mjs` + `fix_mrscrystal_images.mjs` |
| Aroma Terrace (アロマテラス) | 0名 | JS描画のためスキップ。shop情報は `fix_aroma_terrace.mjs` 適用済み |
| Marigold (マリーゴールド) | 117名 | `process_marigold_mrscrystal.mjs` |
| ゆりかご FC名古屋 | 0名 | JS描画のためスキップ |
| Cucue (きゅきゅ) | 0名 | JS描画のためスキップ |
| century (センチュリー) | 0名 | JS描画のためスキップ |

### ⚠️ 作業中・未完了

| 都道府県 | 状況 | 確認コマンド |
|----------|------|-------------|
| **大阪府** | 一部完了（俺の家・Mirajour）。他店舗要確認 | `node scripts/debug/check_osaka_therapist_status.mjs` |
| **東京都** | **全463店舗完了** ✅ | — |
| **静岡県** | 竜宮城 沼津店完了。他店舗未着手 | `node scripts/debug/check_all_shops_status.mjs` |
| **神奈川県** | Fromage: JS描画のためClaude in Chrome必要 | — |
| その他全都道府県 | 未着手のものあり | `node scripts/debug/check_all_shops_status.mjs` |

---

## よく使うコマンド

```bash
# 愛知県の全店舗状況確認
node scripts/debug/check_aichi_status.mjs

# 大阪のセラピスト登録状況確認
node scripts/debug/check_osaka_therapist_status.mjs

# 全店舗のセラピスト登録状況（都道府県別）
node scripts/debug/check_all_shops_status.mjs
```

---

## スクレイピングパターン集

新しい店舗のセラピスト取得時は、まず構造確認→スクリプト作成の流れ。

### パターン1: WordPress系（alt属性に店名入り）
例: Number9 → `alt="名古屋メンズエステ【ナンバーナイン】 彩"` → `】 ` 以降が名前

```js
$('img[alt*="ナンバーナイン】"]').each((_, el) => {
  const name = alt.match(/】\s*(.+)$/)?.[1]?.trim();
});
```

### パターン2: images_staff パス系
例: Aromana, milk repos → `src="https://xxx.com/images_staff/752/xxx.jpeg"`
- altが `"うい♡清楚美女"` → `♡` 前が名前
- altが `"天音 セラピスト写真"` → `セラピスト写真` を除去

```js
$('img[src*="images_staff"]').each((_, el) => {
  let name = alt.replace(/\s*セラピスト写真.*$/, '').split('♡')[0].trim();
});
```

### パターン3: altに「さんの写真」系 + background-image
例: Mrs Crystal → `alt="優香(新人)さんの写真"` かつ `style="background-image: url(/images/xxx.jpeg)"`
- `<img>` の src はダミー（spacer.png）、実際の写真は style 属性に隠れている
- `img[alt*="さんの写真"]` で取得後、同要素の style から URL を抽出する

```js
$('img[alt*="さんの写真"]').each((_, el) => {
  const style = $(el).attr('style') || '';
  const imgPath = style.match(/url\(['"]?([^'")\s]+)['"]?\)/)?.[1] || '';
  const imgUrl = imgPath ? `${BASE}${imgPath}` : null;
});
```

### パターン4（旧3）: altに「さんの写真」のみ（画像なし）
例: Mrs Crystal → `alt="優香(新人)さんの写真"`

```js
$('img[alt*="さんの写真"]').each((_, el) => {
  let name = alt.replace(/さんの写真$/, '').replace(/\([^()]*\)/g, '').trim();
});
```

### パターン5: /photos/ パス系（Marigold）
例: `src="https://mari-gold.biz/photos/1134/moto_1134.jpg"` + `alt="遠藤まひな"`

---

## ノイズフィルタリング

セラピスト名として不適切なものを除外する標準チェック:

```js
const isNoise = (name) => {
  if (!name || name.length === 0) return true;
  if (name.startsWith('「') || name.startsWith('【')) return true;
  if (name.length > 10) return true;
  if (/イベント|キャンペーン|割引|求人|banner|logo|icon|LINE|Twitter/i.test(name)) return true;
  if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return true; // 日本語なし
  return false;
};
```

---

## 新しい都道府県を処理する流れ

1. **現状確認**: `check_all_shops_status.mjs` で0名の店舗を特定
2. **URLリスト収集**: ユーザーから website_url / staff_url / schedule_url を入手
3. **構造確認スクリプト作成**: `scripts/debug/check_xxx.mjs` でalt・img構造を調査
4. **処理スクリプト作成**: `scripts/maintenance/process_xxx.mjs` で本実装（--dry-run対応）
5. **実行**: dry-run確認 → 本実行
6. **後処理**: 名前にゴミが混入していれば `fix_xxx_names.mjs` で修正
7. **CLAUDE.md更新**: 完了したら都道府県別テーブルと作業ログを更新

---

## 作業ログ

### 2026-05-05
- **愛知県 完了**
  - Marigold (117名), Mrs Crystal (84名) 挿入 → `process_marigold_mrscrystal.mjs`
  - Mrs Crystal の名前ゴミ除去 → `fix_mrscrystal_names.mjs`
  - Aroma Terrace: JS描画のためセラピストスキップ。shop情報のみ設定 → `fix_aroma_terrace.mjs`
  - Number9 (47名), milk repos (73名), Aromana (66名) 挿入 → `process_number9_milkrepos_aromana.mjs`
  - Number9のイベントノイズ除去、milk reposの「セラピスト写真」ゴミ除去 → `fix_number9_milkrepos_names.mjs`
  - 愛知県24店舗すべてshop画像・schedule_url設定済み
  - Mrs Crystal: background-imageで写真が隠れていたのを発見・修正 → `fix_mrscrystal_images.mjs`（84名全員写真登録完了）
  - MADAME聖子: shop画像をOGP→ロゴ画像に差し替え → `fix_madame_seiko_image.mjs`
  - ⚠️ JS描画4店舗（Aroma Terrace, Cucue, century, ゆりかご）は未処理。URL収集済み、Claude in Chrome が必要

### 2026-05-05（続き）
- **福岡県 部分完了**
  - men-esthe.jp（口コミサイト）から全7店舗の公式URLと shop画像を取得 → `process_fukuoka.mjs`
  - Lion Heart (78名) 挿入 → `process_fukuoka.mjs`（images_staff + alt【ランク】除去パターン）
  - Request (21名) 挿入 → `fix_request_therapists.mjs`（estama.jp CDN + ランク名直前の名前抽出）
  - Feerique (46名) 挿入 → `process_feerique_pinky.mjs`（/photos/ パス + ♡除去パターン）
  - ピンキーグラッツェ (39名) 挿入 → `process_feerique_pinky.mjs`（background-image + 絵文字・ランク名除去パターン）
  - 全6店舗のshop画像を公式サイト画像に更新 → `fix_fukuoka_shop_images.mjs` + `fix_lionheart_image.mjs`
  - men-esthe.jpの活用法: `/area.php?id=XX` で都道府県別店舗一覧取得 → 外部リンクから公式URL収集可能

### 2026-05-05（さらに続き）
- **福岡県 完全完了**
  - メンズアロマ博多人妻さん (126名) 挿入 → `process_hakata_hitozuma.mjs` + `fix_hakata_hitozuma_images.mjs`
    - Claude in Chrome で hakatahitozuma.com/staff/ をJS描画取得
    - Firebase Storage 画像（`?alt=media&token=xxx` 形式）をtoken付きで登録
    - 博多店91名 + 久留米店35名（同名はサフィックス `_久留米` で区別）
  - MOTHERS (81名) 挿入 → `process_mothers.mjs`
    - cheerioで取得可能（JS描画ではなかった）
    - `div.girls_box.category-2` で久留米店判定、`/photos/` パス + alt名前パターン
    - 博多店52名 + 久留米店29名
  - 福岡県 全7店舗のセラピスト登録完了

#### 福岡県 店舗別セラピスト数（2026-05-05 確定）

| 店舗 | 人数 | スクリプト |
|------|------|-----------|
| ライオンハート | 78名 | `process_fukuoka.mjs` |
| リクエスト | 21名 | `fix_request_therapists.mjs` |
| フェリーク | 46名 | `process_feerique_pinky.mjs` |
| ピンキーグラッツェ | 39名 | `process_feerique_pinky.mjs` |
| メンズアロマ博多人妻さん | 126名 | `process_hakata_hitozuma.mjs` + `fix_hakata_hitozuma_images.mjs` |
| MOTHERS (マザーズ) | 81名 | `process_mothers.mjs` |
| （残り1店舗） | — | — |

### 2026-05-06
- **宮城県 7/8店舗完了**
  - shop画像 + Aroma No5/Aroma Rich の website_url 設定 → `fix_miyagi_shop_info.mjs`
  - 6店舗264名一括挿入 → `process_miyagi_therapists.mjs`
  - 名前ゴミ除去（新人/体験入店プレフィックス、♡期間限定♡ など）→ `fix_miyagi_names.mjs`
  - Cuaura: 閉店のためDBから削除 → `fix_miyagi_cleanup.mjs`
  - Aroma No5: Wix JS描画のため未処理（Claude in Chrome 必要）
  - schedule_url 設定（Aroma No5, ONE time, SHIZUKU SPA）→ `fix_miyagi_cleanup.mjs`

#### 宮城県 店舗別セラピスト数（2026-05-06 確定）

| 店舗 | 人数 | スクリプト |
|------|------|-----------|
| Pulunt (プルント) | 61名 | `process_miyagi_therapists.mjs` + `fix_miyagi_names.mjs` |
| ARENA SPA (アリーナスパ) | 53名 | `process_miyagi_therapists.mjs` |
| Platonic SPA (プラトニックスパ) | 53名 | `process_miyagi_therapists.mjs` + `fix_miyagi_names.mjs` |
| SHIZUKU SPA (雫スパ) | 44名 | `process_miyagi_therapists.mjs` |
| Aroma Rich (アロマリッチ) | 28名 | `process_miyagi_therapists.mjs` |
| ONE time (ワンタイム) | 25名 | `process_miyagi_therapists.mjs`（写真なし） |
| Cuaura (クオーラ) | — | 閉店のためDBから削除済み |
| AROMA No5 (アロマファイブ) | 24名 | `process_aroma_no5.mjs`（写真なし、名前のみ） |

#### 宮城県 スクレイピングパターン
- **girls_box + /photos/**: Pulunt（fulock系、MOTHERSと同じ）
- **c-panel + /photos/**: Arena SPA, Platonic SPA, SHIZUKU SPA（同一CMSフレームワーク）
- **ap2hp CDN /therapist/**: Aroma Rich（`img[src*="/therapist/"]` + alt=名前）
- **img[alt^="ONE Time "]**: ONE time（sazae.sakura.ne.jp CMS）
  - castページでは `/def/con`（デフォルト画像）→ **トップページ**に実際の写真あり
  - トップページで `img[alt^="ONE Time "]` + `src*="/upload/cast/"` で名前と写真URLを取得

### 2026-05-06（続き）
- **宮城県 完全完了**
  - AROMA No5 (24名) 名前のみ登録 → `process_aroma_no5.mjs`（Wixサイトのため写真なし）
  - ONE time shop画像設定 → `fix_onetime_image.mjs`
  - Cuaura: 閉店のためDBから削除 + schedule_url設定 → `fix_miyagi_cleanup.mjs`

- **東京都 竜宮城（人形町店）完了**
  - 81名登録（写真あり）→ `process_ryugujo.mjs`
  - shop画像（mainvisual.jpg）+ schedule_url設定
  - ノイズ8件（ダブル/トリプルセラピスト、新規割、店名レコード等）削除 → `fix_ryugujo_cleanup.mjs`
  - WordPress系: `img[src*="/wp-content/uploads/"]` + alt=名前パターン
  - wp-content画像はホットリンク保護あり → Supabase Storageに全員アップ済み → `fix_ryugujo_images.mjs`
  - shop_id: `tokyo_chuo_ningyocho_ryugujo`（人形町店がメイン）
  - 他4店舗（門前仲町・銀座・蒲田・沼津）は同一URLだが別サイトURL確認が必要

#### 竜宮城 全5店舗 完了（2026-05-06）

| 店舗 | shop_id | セラピスト数 | 状態 |
|------|---------|-------------|------|
| 人形町店 | `tokyo_chuo_ningyocho_ryugujo` | ~81名 | Storage移行済み |
| 銀座店 | `tokyo_chuo_ginza_ryugujo` | ~81名 | Storage移行済み |
| 門前仲町店 | `tokyo_koto_monzennakacho_ryugujo` | ~81名 | Storage移行済み |
| 蒲田店 | `tokyo_ota_kamata_ryugujo` | ~81名 | Storage移行済み |
| 沼津店（静岡） | `shizuoka_numazu_ryugujo` | ~81名 | Storage移行済み。group_id修正済み |

- WordPress wp-content/uploads → ホットリンク保護あり → `fix_ryugujo_images.mjs` でStorage移行
- Twitter SVG アイコンが混入していたものは image_url = null に修正 → `fix_ryugujo_all_shops.mjs`
- null になったセラピストは人形町店のStorage URLを流用して復元 → `fix_ryugujo_null_images.mjs`
- ノイズレコード削除 → `fix_ryugujo_cleanup.mjs`（全5店舗対応）
- **写真衝突バグ修正** → `fix_ryugujo_reupload.mjs`
  - 原因: `therapistId.replace(/[^\w-]/g, '_')` で日本語名が全部`_`に変換され、同文字数の名前が同一Storage ファイル名になって上書きされていた
  - 修正: ソース画像URLのベースネーム（`IMG_2644.jpg`等）をStorage ファイル名に使用
  - 結果: 人形町店85名を正しいファイル名で再アップ、他4店舗329名のURLを正しく更新
- **shops テーブルのデータ修正** → `fix_ryugujo_shop_data.mjs`
  - 銀座店: shops.name が「(人形町店)」になっていたのを「(銀座店)」に修正
  - 沼津店: group_id を `g_solo_*` → `g_brand_ryugujo` に修正（ブランドグループに参加）、店舗名に「(沼津店)」追加
- **沖縄店は未登録**（公式サイトに6店舗目として存在。URL確認後に追加予定）

#### Supabase Storage メモ
  - バケット `therapist-images` はダッシュボードで手動作成が必要（anon keyでは作成不可）
  - ホットリンク保護サイトの画像は `Referer` ヘッダーに元サイトURLを付けて取得→Storageに保存
  - `fix_ryugujo_images.mjs` の `uploadImage()` が標準実装（Referer付きfetch対応版）
  - 同一CMSの複数店舗は人形町店のStorage URLを流用可能 → `fix_ryugujo_all_shops.mjs` 参照

#### Claude in Chrome 活用メモ
- Firebase Storage 画像のtokenは `img.src.match(/token=([^&]+)/)?.[1]` で取得
- token付きフルURL形式: `...?alt=media&token=UUID`
- `?alt=media`のみ（tokenなし）では403になる
- JS描画サイトでも `window._xxx` に保存してから分割出力すると大量データ取得可能

### 2026-05-07
- **検索バグ修正**
  - 「宮城」で検索すると「竜宮城」がヒットしていた問題を修正 → `src/utils/searchLogic.js`
  - `PREFECTURE_NAMES` Set（47都道府県）を追加し、都道府県名で検索した場合は `prefecture` フィールドのみ照合
- **千葉県 超レベチなエステ24 完了**
  - 成田店・東金店 各20名 → `process_levechi.mjs`（estama.jp CDN + cast/main パターン）
- **大阪府 俺の家 完了**
  - `osaka_umeda_orenoie` 111名 → `process_orenoie.mjs`（images_staff + 【名前】パターン）
- **大阪府 Mirajour 完了**
  - `60026` の `raw_data.prefecture` を `'shops_backup.json'` → `'大阪府'` に修正
  - 198名（重複除去後）登録 → `fix_mirajour_shop.mjs` + `fix_mirajour_names.mjs`
  - サイト構造: `/itemList.html` の `/optImg/1004130/item/` パス + alt=名前（1人2枚ずつ「名前」「名前2」で登録されているので「2」付きを削除）
- **兵庫県 ひまわり 完了**
  - `1076`（大阪堺東）65名 → `process_himawari_eslino.mjs`
  - パターン: `img[src*="upload/cast"]` + alt から「シークレットルームヒマワリ」プレフィックス除去
- **兵庫県 Kobe Eslino 完了**
  - `1189_1`, `1189_2` 各109名 → `process_himawari_eslino.mjs`
  - パターン: `img[src*="/photos/"]` + alt=名前（読み仮名付き: 「英愛留(えある)」そのまま登録）
  - 2店舗（旭通・加納町）に同一キャストを登録
- **福岡県 MOTHERS 重複整理**
  - `1207_1`（legacy、0名）を削除
  - `fukuoka_kurume_mothers` の group_id を `g_brand_mothers_fukuoka` に更新
  - → `fix_mothers_duplicate.mjs`

- **東京都 グループ4社 完了**
  - Aroma Lunabelle: cheerio取得 71名 × 5店舗 → `process_tokyo_groups.mjs`
  - QUEEN'S COLLECTION: Chrome取得 40名 × 4店舗（写真付き）→ `process_tokyo_groups.mjs` + `fix_tokyo_groups_images.mjs`
  - CREST SPA TOKYO: Chrome取得 79名 × 4店舗（`浅倉 ほの`はno_imageのためnull）→ 同上
  - GRACE: Chrome取得 26名 × 2店舗（写真付き）→ 同上。`伊波 マユ`→`新垣 マユ` 名前修正済み
  - S3 URLは定期的にUUIDが変わる仕様 → 403が出たらClaude in ChromeでDOM抽出して `fix_tokyo_groups_retry.mjs` で再試行

#### 東京グループ4社 スクレイピングパターン
- **CREST SPA / GRACE**: `div.item.clearfix` → `img[data-src]`（lazy loading）+ `h2`/`h3` で名前取得
- **QUEEN'S COLLECTION**: WordPress系 `/images/` パス + Chrome DOM抽出
- **S3 バケット 403問題**: 同じファイルIDでもUUIDが変わる → 再取得が必要。`img.dataset.src || img.src` で取得

#### Mirajour スクレイピングパターン
- URL: `https://total-beauty-salon.net/itemList.html`
- `img[src*="/optImg/"]` で全画像取得
- alt が「名前」と「名前2」の2パターン（2枚目の写真）→ `fix_mirajour_names.mjs` で「2」付きを削除
- 挿入前にすでに394名（重複込み）→修正後197名が正しい

### 2026-05-12
- **東京都 追加9店舗 完了**
  - ゴールデン（中野）58名 → `process_golden_nakano.mjs`
    - background-image style pattern (wp-content/uploads)。UUID をStorage ファイル名に使用
  - らんぷ 北千住 86名 → `process_ranpu_kitasenju.mjs`
    - files.re-db.com CDN。ファイルID (`69e34b99c71d2.jpg`) をStorageファイル名に使用
    - re-db.com: CDN URLは安定。ページに各セラピストが2回表示→Map重複除去が必要
  - Candy Spa（出張）126名 → `process_candy_spa.mjs`
    - `li.staff-name` + `background-image:url(/data/staff/{id}/stf_{hash}.ext)` パターン
  - First 新宿 42名 → `process_first_shinjuku.mjs`
    - `a[href*="therapist.html?id="]` + `/photo/staff/5/{staffId}_1_{ts}.ext`。staff IDをStorageファイル名に使用
  - Assouplir 秋葉原 46名 → `process_assouplir_akihabara.mjs`
    - Cloudflare Images CDN: `imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/{uuid}/member`
    - JS描画（lazy loading）のためChrome必須。`window._assouplirFull` にキャッシュして分割出力
  - 癒しの空間 ANNEX（上野）27名 → `process_annex_ueno.mjs`
    - WordPress wp-content/uploads + alt=名前。ホットリンク保護あり→Referer付きでStorage移行
  - Tigger（旧Jesse）69名 → `process_tigger.mjs`
    - caskan.com CDN: `cdn2-caskan.com/caskan/img/cast_tmb/{timestamp}_{id}.png`
    - shops更新も同スクリプトで実施: Jesse → Tigger (ティガー)、URL更新
    - shop_id: `tokyo_setagaya_futakotamagawa_jesse`（既存IDを維持）
    - 体験入店🤍プレフィックスの2名は除外
  - Weal 秋葉原 43名 → `process_weal_akihabara.mjs`
    - WordPress wp-content/uploads + alt=名前。「新規割」はノイズ除外
  - NO BRAND 銀座 56名 → `process_nobrand_ginza.mjs`
    - `/photos/{id}/moto_{id}.jpg` + alt=名前（姓のみ）。shop_id: `tokyo_chuo_ginza_nobrand`

#### 新パターン: caskan.com CDN (Tigger等)
- URL: `https://cdn2-caskan.com/caskan/img/cast_tmb/{timestamp}_{randomId}.png`
- 認証不要のパブリックCDN
- altが空・⬇️含む・店名などはノイズ除外

#### 新パターン: Cloudflare Images (Assouplir)
- URL: `https://imagedelivery.net/{accountId}/{uuid}/member`
- クエリストリング不要（`/member` variant指定）
- JS描画サイトのため Chrome で `window._xxx` に保存して取得

#### 新パターン: re-db.com CDN (らんぷ系)
- URL: `https://files.re-db.com/file/{hexId}.jpg`
- 認証不要のパブリックCDN
- ページに各セラピストが2回表示される仕様→重複除去必須

### 2026-05-12（続き）
- **写真修正バッチ 計752件更新**
  - THE PREMIUM SPA 麻布十番・六本木 → `fix_premium_spa_images.mjs`（172件更新、19件名前不一致）
    - 同一CMS: `/data/staff/{id}/stf_{hash}.webp` + `.staff-box > [style*="background"]` パターン
    - 105名全データをChrome DOM抽出（`window._premiumData`）
    - shop_id: `tokyo_minato_roppongi_the_premium_spa` / `tokyo_minato_azabujuban_the_premium_spa`
  - MITSUBACHI 新宿御苑店・三丁目店 → `fix_mitsubachi_images.mjs`（82件更新）
    - 同一CMS: `/data/staff/{id}/stf_{hash}.jpg`。名前は `.box-inner li:first-child` から取得、年齢(XX)除去
    - 43名取得
  - HaTaEsu 幡ヶ谷 → `fix_urasanesu_hataesu_images.mjs`（14件更新、0件不一致）
    - urasanesu.com と同一CDN: `/therapist_img/{id}-1.jpg`
    - alt: `HaTaEsu 幡ヶ谷 {名前}({年齢}) の写真`
  - UraSanEsu・ShiMoEsu → `fix_urasanesu_hataesu_images.mjs`（18件更新）
    - shimoesu.com で `tokyo_setagaya_urasanesu_shimokita`（下北沢）・`tokyo_shibuya_urasanes`（ウラサネス）の2店舗がヒット
    - DBの website_url は shimoesu.com で登録されている（urasanesu.com ではない）
    - 現在サイトに各6〜9名のみ掲載。残り名前のみのレコードは写真なしのまま
  - Cozy 赤羽・高田馬場 → `fix_cozy_images.mjs`（102件更新、2件不一致）
    - `/storage/images/therapists/{hash}.jpg` + alt=姓のみ。53名取得
  - DAHLIA 五反田・目黒・恵比寿・田町・大井町（全5店舗）→ `fix_dahlia_images.mjs`（230件更新、2件不一致）
    - `data-p1="def/con?p=upload/cast/thumb_{id}.jpg"` から castId抽出
    - 実際のURL: `gotandadahlia.com/upload/cast/thumb_{id}.jpg`（Referer付き取得可）
    - DB名は "DAHLIA " プレフィックスなし（alt の "DAHLIA " を除去して照合）
  - Zexterior 新宿・神楽坂・四谷3丁目・秋葉原（全4店舗）→ `fix_zexterior_images.mjs`（152件更新、10件不一致）
    - `/images_staff/{id}/{file}.jpeg` パターン。48名取得

#### 写真修正スクリプト 共通パターン
- shops を `website_url ILIKE '%domain%'` で動的取得 → shop_id のハードコード不要
- therapists を `in('shop_id', shopIds).eq('name', name)` で照合（複数店舗同名対応）
- 既に image_url ありのものはスキップ（`=`）、DBに存在しないものは `?` 表示
- 同一 castId/staffId の画像は upsert: true で Storage に再利用可能

### 2026-05-12（写真修正第2弾）
- **写真修正バッチ 計623件更新**（愛知・東京・大阪）
  - Aroma Terrace 名古屋 → `fix_aroma_terrace_images.mjs`（130件更新、2件不一致）
    - 同一CMS: `/data/staff/{id}/stf_{hash}.webp`。136名収集（うち4名はnoimage）
  - タイガーアイ 名古屋 → `fix_tiger_nagoya_images.mjs`（96件更新、2件不一致）
    - `images_staff/{id}/{file}.jpg` パターン。98名取得
  - century 名古屋 → `fix_century_nagoya_images.mjs`（97件更新、1件不一致）
    - `images_staff/{id}/{file}.jpeg` パターン。名前に`※新人割対象‼`サフィックスあり→除去
    - `フェザータッチみすずマン` はノイズ除外
  - GOLDEN ROSE 名古屋 → `fix_golden_rose_images.mjs`（49件更新、104件不一致）
    - `li.therapist` → `.photo.bg-img`（background-image）+ `.name-roman`（年齢除去）パターン
    - DBに51名のみ登録済み → 49名に写真付与。残り104名はDB未登録
  - Love it 麻布十番 → `fix_loveit_images.mjs`（27件更新、2件不一致）
    - 同一CMS: `/data/staff/{id}/stf_{hash}.jpg`。29名取得
  - アロマリゾート 池袋 → `fix_tokyo_aroma_world_images.mjs`（34件更新、3件不一致）
    - `def/con` proxy + castId パターン（9〜50）。38名取得
  - ミセスの子守唄 大阪 → `fix_komoriuta_moonr_images.mjs`（28件更新、3件不一致）
    - `/wcms/gals/images/{id}/photo_thumb5_000_{date}.jpg` パターン。31名取得
  - ミセスムーンR 大阪 → `fix_komoriuta_moonr_images.mjs`（3件更新、8件不一致）
    - 同上 wcms パターン。11名取得。8件はDB登録名と不一致
  - うさぎのお部屋 大阪（全7エリア）→ `fix_bunny_room_images.mjs`（74件更新、1件不一致）
    - `images_staff/{id}/{file}.jpg` + `img[data-src]` lazy loading。75名取得
  - LIRICA OSAKA → `fix_lirica_furyu_images.mjs`（34件更新、6件不一致）
    - `def/con` proxy + castId。alt から「リリカ大阪 」プレフィックス除去。41名取得
  - Fu-Ryu 大阪京橋 → `fix_lirica_furyu_images.mjs`（51件更新、3件不一致）
    - `def/con` proxy + castId。alt の最後のトークンが名前。54名取得

#### 新パターン: GOLDEN ROSE CMS
- URL: `/fdata/0/staff/{staffId}/goldro_0_{staffId}_{n}_{ts}.jpg`
- `li.therapist` → `.photo.bg-img` (background-image style) で画像取得
- `.name-roman` のテキストから `(Age:XX)` を除去して名前取得
- staffId は URL から `/staff/(\d+)/` で抽出

### 2026-05-12（未登録セラピスト追加）
- **愛知県 4店舗 計109名追加** → `add_missing_aichi_therapists.mjs`
  - Aroma Terrace: 2名追加（130名スキップ）
  - タイガーアイ: 2名追加（96名スキップ）
  - Century: 1名追加（97名スキップ）
  - GOLDEN ROSE: 104名追加 + 3名写真更新（46名スキップ）。画像取得失敗3件はnullで登録済み
- **東京・大阪 7店舗 計26名追加** → `add_missing_osaka_tokyo_therapists.mjs`
  - Love it: 2名追加（27名スキップ）
  - アロマリゾート: 3名追加（35名スキップ）
  - ミセスの子守唄: 3名追加（28名スキップ）
  - ミセスムーンR: 8名追加（3名スキップ）
  - うさぎのお部屋: 1名追加（74名スキップ）
  - LIRICA OSAKA: 6名追加（34名スキップ）
  - Fu-Ryu: 3名追加（51名スキップ）

#### 未登録セラピスト追加スクリプト 共通パターン
- 既存レコード確認 → `exists + image` → `=`（スキップ）、`exists + null` → `u`（写真更新）、`not exists` → `+`（新規追加）
- 新規追加時のID: `${shop.id}_${name}`
- 複数店舗（同一domainで複数店舗ヒット）は全店舗に同一セラピストを挿入
- 名前の全角スペース対応: `namesToTry = [name, name.replace(/　/g, ' '), name.replace(/　/g, '')]`

### 2026-05-13
- **写真修正バッチ 計179件更新**（東京・大阪・兵庫）
  - 明大前ANNEX（東京）→ `fix_annex_meidaimae_images.mjs`（16件更新）
    - aroma-tsushin.com CDN: `staff_{staffId}_{timestamp}.jpg`。2枚目以降は`_2_` `_3_`でスキップ
    - alt から `（年齢）` 以降を除去して名前取得
  - 超レベチなエステ24（東京）→ `fix_levechi_tokyo_images.mjs`（2件更新、33件は退職/期間外のため未マッチ）
    - estama CDN: `img[src*="cast/main"]` パターン
  - ミセスの子守唄（大阪）→ `fix_komoriuta_moonr_all.mjs`（66件更新）
    - wcms `/gals/` ページ。`img[data-original*="/wcms/gals/images/"]`（lazy loading、`src`ではなく`data-original`）
    - alt: `"名前【読み】"` → `【` 前を名前として取得
  - ミセスムーンR 大阪 → `fix_komoriuta_moonr_all.mjs`（59件更新）
    - 同上 wcms パターン。alt: `"名前"` のみ
  - ミセスムーンR 兵庫 → 0件（サイト側で写真未掲載。8名は対応不可）
  - LEON SPA Gold → `fix_leon_spa_images.mjs`（15件更新、1件未マッチ「カナコ」）
    - `/photos/{id}/raw_{id}.jpg?{ts}` パターン。`?` 以降を除去してからfetch
    - alt: `"名前(読み)"` → `(` または `（` 前を名前として取得
  - LEON SPA → `fix_leon_spa_images.mjs`（6件更新）
    - 同上パターン
  - 女教師の秘め事 → `fix_teacher_secret_images.mjs`（6件更新、22件未マッチ）
    - static HTMLでは4名しか取得できず。残り22名はJS描画のためChrome必要
    - `/photos/{id}/{ts}-{filename}.jpg` + alt=`苗字 名前`。suffix matching対応
  - LIRICA OSAKA → `fix_lirica_dynamic.mjs`（9件更新、26件未マッチ）
    - 3パターン: `img[src*="def/con"]` / `[src/href*="def/con?p="]` / 正規表現
    - 多数のキャストが `<video>` 要素（JS描画）のため取得不可。Chrome必要

### 2026-05-14
- **むちすぱルーム 南浦和 完了**
  - 29名登録 → `process_muchispa.mjs`
  - website_url を `https://muchispa.com/`（別会社）から `https://muchispa-room.com/` に修正
  - CMS: THE PREMIUM SPA と同一（`/data/staff/{id}/stf_{hash}.webp`）
  - ゆかり（staffId=142）のhashはChrome経由で取得（`stf_67eea3c30f4cd.webp`）
  - **残り未処理店舗**: `tokyo_dispatch_outside_no_brand`（no-brand.jp サイトダウン）・`tokyo_shinjuku_shinjuku_natural_organic_spa`（URL不明）の2店舗のみ

- **写真修正バッチ 計71件更新**（各種店舗）
  - Zexterior（全4店舗）→ `fix_zexterior_suffix.mjs`（16件更新）
    - DB名が短縮名（「れい」「花奈」「弥生」「しおり」）→ サイト名「楪 れい」等にsuffix matchで対応
  - HaTaEsu 幡ヶ谷・UraSanEsu 下北沢 → `fix_prefixed_hataesu_urasanesu.mjs`（30件更新）
    - DB名に「幡ヶ谷 」「下北沢 」プレフィックスが付いていたため既存スクリプトで未マッチ
    - 斎藤ひかる（ID=363）を追加してさらに2件更新
  - 女教師の秘め事（2店舗）→ `fix_teacher_chrome.mjs`（20件更新）
    - Chrome DOM抽出: `/photos/{id}/{ts}-{file}.{ext}` パターン。16名取得
    - 2件（白石 優里奈×2店舗）は退職者
  - 熟れた果実 → `fix_urekaji_images.mjs`（2件更新）
    - WordPress wp-content: 北原凛・黒崎あずを確認。七瀬ももは退職者
  - ミセスムーンR 大阪 → `fix_komoriuta_moonr_all.mjs`（1件更新）
  - Love it 動的スクレイプ → `fix_loveit_dynamic.mjs`（0件 - 10件null全員退職者）
- **修正不可として確定**
  - LIRICA OSAKA 26件 → video描画（6名）または退職者。全員修正不可
  - ミセスの子守唄 残3件（椿來・那月・夏海）→ サイト不在。退職者
  - ミセスムーンR 兵庫 8件（唯月・紗奈・杏里・沙理・悠亜・美久・真矢・優梨）→ サイト不在。退職者
  - Aroma BANKER 5件（れん・矢口ひな・月岡あかね・愛海れいか・葛西めぐ）→ ラインナップ完全入れ替わり。退職者
  - Love it 10件 → サイト不在。退職者
- **削除済み**
  - 小悪魔スパトウキョウ 16件 → 橋本るい・小鳥遊ゆり・葉月あや・双葉ゆりな の4名が4店舗（蒲田・西新宿・五反田・東新宿）に登録されていたが、退職済みのためDBから削除 → `fix_koakuma_cleanup.mjs`

#### 女教師 Chrome スクレイピングパターン
- URL: `https://teachersecret2025.com/girl`（`/cast/` は404）
- `img[alt*="苗字 名前"][src*="/photos/"]` → `/photos/{id}/{ts}-{filename}.{ext}`
- DB名「一華」→ サイト名「橘 一華」でsuffix matchが有効
- 2店舗（五反田・目黒）に同じキャストが登録されているため16名取得で20件更新

#### 熟れた果実 スクレイピングパターン
- URL: `https://spa-urekaji.com/therapist/`（WordPress）
- 47名の一覧あり（全員 `alt=名前` + `src*=wp-content/uploads/`）
- DBの3件null: 北原凛・黒崎あず（サイト確認）・七瀬もも（退職）

#### 小悪魔スパトウキョウ CMSパターン（参考）
- URL: `https://mens-esthe-aroma.site/therapists.html`（JS描画）
- 画像: `https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/{uuid}.{ext}`
- 129名分データを `fix_koakuma_images.mjs` にハードコード済み（将来の新規登録に流用可）

#### wcms スクレイピングパターン（子守唄・ムーンR）
- キャストページ: `/gals/`（`/cast/` は404）。sitemap.xml で発見可能
- lazy loading: `img[data-original*="/wcms/gals/images/"]`（`src`属性ではなく`data-original`）
- 画像URL: `/wcms/gals/images/{id}/photo_thumb5_000_{date}.jpg`
- 子守唄: `alt="名前【読み】"` → `【` 前が名前
- ムーンR大阪: `alt="名前"` のみ
- ムーンR兵庫: `alt="名前　読み"` → 全角スペース前が名前（`fullwidth` nameMode）

#### LEON SPA スクレイピングパターン
- `/photos/{id}/raw_{id}.jpg?{ts}` → `imageUrl.split('?')[0]` でタイムスタンプ除去してからfetch
- `img[src*="/photos/"]` + `src.match(/\/photos\/(\d+)\/raw_\d+/)` でphotoId抽出
- Storage filename: `{prefix}_photo_{photoId}.{ext}`

### 2026-05-16
- **schedule_url 一括設定完了**
  - 44件を `fix_missing_schedule_urls.mjs` で自動設定（姉妹店参照 + パターン検出）
  - ARENA SPA・Natural Organic Spa を追加設定（計46件）
  - UraSanEsu 2店舗 → `https://shimoesu.com/week.cgi`
  - Mirajour → `https://total-beauty-salon.net/scheduleAll.html`
  - 残り未設定: No Brand（サイトダウン）・Aroma Rich・ムーブプラス・僕のママスパ・キャンディスパ の5件

- **shop画像 未設定店舗を自動取得・設定完了** → `fix_missing_shop_images.mjs`
  - og:image → apple-touch-icon → logo → background-image の優先順位で自動検出
  - Mirajour の image_url も背景画像から設定済み
  - 残り未設定: No Brand 1件（サイトダウン）

- **フロントエンド UI 改善（Claude）**
  - BottomNav ラベル日本語化: HOME→ホーム / SEARCH→探す / RANK→ランキング / MY PAGE→マイページ
  - ShopDetailPage タブ日本語化: TOP→トップ / CAST→キャスト / REVIEW→口コミ / SCHEDULE→出勤
  - 出勤タブのフォールバックをボタン形式に改善
  - Home 新着店舗を `created_at` 降順に修正
  - SearchPage 英語テキスト全て日本語化（「Results for」→「の検索結果」等）
  - RankingPage タブラベル日本語化・「もっと見る」ページネーション追加
  - SeoHead: ドメイン動的化・og:image / twitter:image 対応

- **ヘッダー/ナビ ラベル統一（Claude + Codex協働）**
  - `/search` がキャスト検索ページである実態に合わせて文言統一
  - PCヘッダー「店舗検索」→「キャスト検索」（Claude）
  - BottomNav「探す」→「キャスト」（Claude）
  - モバイルメニュー「店舗・キャスト検索」→「キャスト検索」（Codex）

- **BRIEFING.md 作成**
  - Codex等への引き継ぎ用の精緻な技術ドキュメント
  - DB設計・データフロー・スクリプト体系・注意事項を網羅
  - ※ React/router バージョンは package.json を直接確認すること（BRIEFINGは概説）

### 2026-05-17
- **スペーサー画像バグ 全24店舗 調査・修正完了**
  - 原因: `alt="〇〇さんの写真" + style="background-image: url(...)"` パターンのCMSで、スクレイパーが `<img src="spacer300x450.png">` のsrcを取得していた
  - 調査: `check_spacer_shops.mjs` + `check_spacer_html.mjs` で24店舗を特定
  - 修正: `fix_all_spacer_images.mjs` で一括対応（--dry-run対応、グループ店舗はURL一回フェッチで全店舗に適用）

  **修正結果:**
  | 店舗 | 結果 |
  |------|------|
  | AR TOKYO 秋葉原 | 96件更新 + name修正（「さんの写真」除去） |
  | ビコーズ（旧リオン） | 20件更新 + name修正 |
  | PEPE SPA（全6店舗） | 236件更新 + name修正 |
  | Deep Black | 1件更新 + 新規12件追加（英語名フォーマット変更対応）|
  | 天界のスパ・EREN・ぐらどるスパ・シャルル・ONE ROOM・東京えすてクラブ | すでに修正済みを確認（スキップ） |

  **Deep Black クリーンアップ** → `fix_deep_black_cleanup.mjs`
  - `まなさんの写真` 等の旧名前重複レコード 18件を削除
  - 対応する正常名レコード（写真あり）が存在するため削除のみで完結

  **スクリプトのノウハウ（Supabase注意点）:**
  - `.or('column.ilike.%pattern%,column2.is.null')` の `ilike` 内 `%` はSupabase JSで動作しない
  - 代替: 全件取得後、JS側でフィルタ `(allData).filter(t => !t.image_url || t.image_url.toLowerCase().includes('xxx'))`

  **スペーサー画像 汎用パターン:**
  - `img[alt*="さんの写真"][style*="background-image"]` で名前・画像URLを一括取得
  - 名前: `.replace(/さんの写真$/, '').replace(/\s+/g, ' ').trim()`
  - DB名に「さんの写真」サフィックスが混入している場合: normName関数で除去して照合 + 更新時にname修正も実施

  **PEPE SPA ノイズ削除** → `fix_pepespa_noise_cleanup.mjs`
  - スクレイプ時にノイズが混入（キャンペーン画像・SNS情報・WEB予約バナー等）
  - 5件のノイズレコード削除（★Twitter・Bluesky情報★、🔴フリー限定割引、WEB予約、限定割引、早割）
  - 8件の「さんの写真」重複レコード削除（正常レコードが存在するため）
  - 合計13件削除 → kanagawa_fujisawa_pepe_spa が124件に
  - **教訓**: isNoise() の ★ 判定は `{2,}` ではなく `{1,}` （1個でもノイズ）にすること

  **グループ内重複表示バグ修正** → `src/pages/ShopDetailPage.jsx`
  - 同一セラピストが複数店舗に登録されているグループで、セラピストが店舗数分重複表示されていた
  - `check_group_duplicates.mjs` で調査したところ80+グループ全てで同問題を確認
  - DB修正（PEPE SPA: fix_pepespa_dedup.mjs で5店舗分削除）に加え、UI側でも除去
  - ShopDetailPage.jsx の `const therapists = ...` 直前に `dedupeTherapists()` 関数を追加
  - 名前の正規化（スペース・全角スペース除去）で照合するため表記揺れにも対応

### 2026-05-17（続き）- 検索UI大幅改善

#### PEPE SPA ノイズ削除 → `fix_pepespa_noise_cleanup.mjs`
- キャンペーン画像5件・「さんの写真」重複8件 計13件削除
- kanagawa_fujisawa_pepe_spa が124件に整理

#### SearchPage 全面リニューアル
- **店舗検索バー × キャスト検索バーの2バー化**
  - 店舗のみ → その店舗のキャスト全員表示
  - キャストのみ → 全店舗からキャスト名検索
  - 両方入力 → 「この店舗の中でこの名前」に絞り込み
- **店舗セクション追加**: マッチした店舗をカード形式で上部に表示
- **ShopCard コンポーネント新設**: 「詳細 ▾」展開で以下を表示
  - 出勤スケジュール（iframeで埋め込み表示）
  - 料金システム一覧
  - 公式サイト・スケジュールページ・電話番号リンク
- **581店舗がすでに対応済み**（schedule_url 設定済み）
- 未設定4件: No Brand（サイトダウン）・僕のママスパ（Wix）・アロマリッチ・ムーブプラス
- URL: `/search?shop=シルク` or `?cast=あかり` or `?shop=シルク&cast=あかり`
- 旧 `?q=` パラメータも `shop=` として引き継ぎ（後方互換）

#### ヘッダー検索バー廃止
- ヘッダーの検索フォームを完全削除（ヒーローの2バーに一本化）
- Header.jsx から `searchQuery` state・`handleSearch`・検索form を除去

#### SearchBar.jsx 刷新
- 単一バー → 🏢店舗・エリア × 💃キャスト名 の2バー + 検索ボタン
- 送信時: `/search?shop=...&cast=...` へ遷移

#### DataContext.jsx 更新
- shops の SELECT に `schedule_url` を追加（全コンポーネントから参照可能に）

#### SearchBar.jsx（旧版）改善内容（今回廃止・参考）
- ↑↓キーによる候補ハイライトナビゲーション
- Enter 時: 候補1件→直接遷移、複数件→検索ページ、0件→検索ページ

#### schedule_url 未設定調査 → `check_schedule_urls.mjs`
- 総586店舗中 581件設定済み、4件未設定を確認
- 残り4件はサイトダウン・Wix等の理由で保留

### 2026-05-17（続き2）- モバイルUX修正・スライダー改善・クチコミスケール対応

#### モバイルUX修正
- **「VIEW SALON」→「店舗を見る」** (`TopHeroSlider.jsx`) — ヒーローボタン日本語化
- **`pb-20` → `pb-32`** (`ShopDetailPage.jsx`) — BottomNavとコンテンツ被り解消（他ページと統一）
- **iframe高さレスポンシブ化** (`SearchPage.jsx`) — `h-[340px] md:h-[480px]`（モバイル340px / PC480px）

#### TopHeroSlider 改善
- **問題**: FORCE_IMAGESの5店舗（linda/aromamore/tenkai/melty/galaxy）がロゴ・スクショ・縦長サムネイルで見栄えが悪かった
- **修正**: GalaxyのみFORCE_IMAGESに残し（あの夜景画像は良い）、残り4枠はDBの `image_url`（og:image）を持つ店舗からランダム選出
- **バグ修正**: 旧コードの `s.image` フィルタが機能していなかった（DBの店舗は `image_url` を持つ）→ `s.image_url` に修正
- **レンダー修正**: `shop.image_url || shop.image` → `shop.image || shop.image_url`（ローカル強制画像を優先）

#### クチコミ スケール対応（数千件を見据えた設計変更）
- **問題**: レビュー全件フェッチ（制限なし）→ 人気店に数百件入ると詰まる構造だった
- **ShopDetailPage.jsx 変更点**:
  - 初回フェッチ: `limit=20&offset=0&order=created_at.desc`（最新20件のみ）
  - `reviewOffset` / `hasMoreReviews` / `isLoadingMoreReviews` state追加
  - `loadMoreReviews()` 関数追加（プレミアム向け、次の20件をオンデマンド取得）
  - プレミアムユーザー: 「さらに読み込む」ボタンでページネーション
  - 無料ユーザー: 1件表示のまま（影響なし）
  - `reviewDisplayCount` / `visibleReviews` を廃止（DB側でページネーション管理に統一）
- **DataContext.jsx 変更点**:
  - `loadReviewsForShop` に `.limit(20)` を追加
- **効果**: 1店舗に1000件入っても初回ロードは20件のみ。パンクしない。

### 2026-05-18 - 口コミスクレイピング・セラピスト別口コミバッジ実装

#### men-esthe.jp 口コミスクレイピング
- **`scripts/maintenance/scrape_menesthe_reviews.mjs`** 作成
  - TARGETS配列に `{ salonId, shopId, shopName }` を追加して実行するだけ
  - プレミアム口コミ（モザイク）は自動スキップ
  - ページネーション対応（`?p=1`, `?p=2`...、1500ms間隔）
  - コンテンツノイズ除去: 「オススメ度: 点数: XX点 投稿者：」ヘッダーと「Good:0人 Bad:0人...」フッターを正規表現で除去
  - セラピスト名: `h3 a` から取得、`\s*\(\d+\).*$` で「(28)さん」サフィックス除去
  - スコア変換: 0〜100点 → rating 1〜5
  - 現在のTARGETS: `[{ salonId: '9416', shopId: 'tokyo_shibuya_silk', shopName: 'Silk (シルク)' }]`
  - Silk 3件挿入完了（永井 さつき・伊藤 ひかり・本田 まみ）
  - プレミアム口コミはアカウント不要では取得不可（仕様）

#### セラピスト別口コミバッジ（SearchPage・ShopDetailPage）
- **SearchPage.jsx**:
  - `serverTherapists` 更新時に口コミ件数を取得（`therapist_name`列のみ、軽量クエリ）
  - `reviewCountMap` state: `{ 正規化名: count }` でスペース除去して集計
  - カード右上に `💬 N` のピンクバッジ表示
- **ShopDetailPage.jsx（キャストタブ）**:
  - `fetchAllData` 内で同様のカウント取得
  - カード右上にバッジ（ハートボタンの上）
- **名前正規化**: `(s).replace(/[\s　]/g, '')` で全角・半角スペース除去してマッチング
  - 例: men-esthe.jpの「永井 さつき」 ↔ DBの「永井さつき」でも一致

#### セラピスト個別ページ（ThreadDetailPage）改善
- 直接Supabaseから `therapist_name=eq.{name}` で口コミをフェッチ（DataContext依存を排除）
- `detailed_ratings`（スネークケース）に対応して統計バーを正しく表示
- 口コミ投稿ボタン → `/shops/{shopId}/threads/{threadId}/review` に遷移（既存）

#### 口コミ書き直し（v2品質基準）

**v2品質基準**（ユーザー承認済み）:
- 入店〜施術〜総評のセクション構成（【入店】【ご対面】【施術】【総評】）は統一
- 元の事実（価格・評価・施術内容）は保持しつつ、**訪問のきっかけ・場所・具体的エピソードは全て別の設定に変更**
- 元文の語彙・フレーズを一切再利用しない。独自の表現で書く
- 特定しやすいディテール（駅名・金額の端数・固有の会話内容等）は除去または変更

**detailed_ratings フォーマット**:
```js
{ cleanliness: 1-5, looks: 1-5, style: 1-5, service: 1-5, massage: 1-5, intimacy: 1-5 }
```

**tags フォーマット（⚠️ UIの選択肢と完全一致させること）**:
- 口コミ内容から判断して2〜5個選ぶ
- **以下のリスト外のタグは絶対に使わない**（`会話上手`・`リピート確定`・`テクニシャン`・`素人系`・`癒し系` などはUI非存在）

```
■体型: スレンダー・グラマー・巨乳・美脚・小柄・高身長
■雰囲気: 可愛い系・美人系・清楚系・ギャル系・お姉さん系
■年代: 10代・20代前半・20代後半・30代・40代
■属性: 色白・健康的・ベテラン・外国人
```

**user_id の使い分け**:
- `menesthe_import`: スクレイピング直後（未書き直し）
- `menesthe_rewritten`: auto_rewrite_reviews.mjs で書き直し済み

##### 手動書き直し → `scripts/maintenance/transform_silk_reviews.mjs`
- `TRANSFORMED` 配列に `{ therapist_name_match, content, detailed_ratings, rating, tags }` を定義してClaude自身が書き直す
- `therapist_name` + `user_id='menesthe_import'` で対象レコードを特定し上書き更新
- `--dry-run` フラグでプレビュー確認可能
- **Silk 3件 書き直し完了**（永井 さつき・伊藤 ひかり・本田 まみ）
- **実行**: `node scripts/maintenance/transform_silk_reviews.mjs [--dry-run]`
- ⚠️ このスクリプトは `user_id` を変更しない。書き直し後は auto_rewrite を使うこと

##### 自動書き直し → `scripts/maintenance/auto_rewrite_reviews.mjs`
- **目的**: スクレイピング後に自動でClaude API（Haiku）で v2品質書き直しを実行
- **事前準備**: `npm install @anthropic-ai/sdk`（初回のみ）
- **フロー**: `user_id='menesthe_import'` を取得 → Claude Haiku API で書き直し → DB更新 + `user_id='menesthe_rewritten'` に変更（再処理防止）
- **オプション**:
  - `--dry-run`: DB更新せずプレビューのみ
  - `--shop-id xxx`: 特定店舗のみ処理
- **実行**:
  ```bash
  # 全件dry-run
  node scripts/maintenance/auto_rewrite_reviews.mjs --dry-run
  # 特定店舗のみ本実行
  node scripts/maintenance/auto_rewrite_reviews.mjs --shop-id tokyo_shibuya_silk
  # 全件本実行
  node scripts/maintenance/auto_rewrite_reviews.mjs
  ```
- **コスト**: Haiku 1件あたり約0.001〜0.002ドル。100件で0.1〜0.2ドル程度
- **ANTHROPIC_API_KEY**: `.env` に設定済み（`okabayashi-onboarding-api-key`）
- **注意**: スクレイプ直後に手動書き直し（transform）した場合は `user_id` が `menesthe_import` のまま残る。auto_rewrite に再処理させたくない場合は先に `user_id='menesthe_rewritten'` に更新してから実行すること
- **Silk 3件**: 手動v2書き直し後に `menesthe_rewritten` に更新済み（再処理対象外）

### 2026-05-21 - 東京中央エリア口コミ一括スクレイピング・268件v2書き直し完了

#### men-esthe.jp 東京エリア口コミ大量取得

- **`scripts/debug/find_menesthe_salon_ids.mjs`** 作成
  - men-esthe.jp の salonId ↔ HP URL マップ（MENESTHE_MAP: 42件）をSupabase DBの `website_url` と照合
  - normUrl() でスキーム・www・末尾スラッシュ・パスを除去してドメインのみ比較
  - 結果: 87件マッチ（26ユニークsalonId）、11件未マッチ（Silk URL不一致・アロマレディアン等）
  - 出力: scrape_menesthe_reviews.mjs に貼り付け可能な TARGETS配列

- **`scripts/maintenance/scrape_menesthe_reviews.mjs`** 大幅拡張
  - TARGETS配列を Silk (1件) → 87件（26ユニークsalonId × 複数店舗）に拡張
  - メインループをsalonId単位にリファクタリング（同一salonIdは1回だけfetchし、全マッチshopに挿入）
  - ID形式を `menesthe_{salonId}_{shopId}_{i}` で固定（再実行でduplicate keyエラー、サイレント重複なし）
  - 実行結果: **265件成功 / 0件スキップ**

- **`auto_rewrite_reviews.mjs`** で265件 + Silk3件 = **268件全件v2書き直し完了**
  - 全件 `user_id='menesthe_rewritten'` に更新済み
  - リトライエラー（Bad control character in JSON）が数件出たが全件リトライ成功

#### 取得できたsalonIdと店舗グループ（主要）

| salonId | men-esthe名 | 対象shopId数 | 口コミ数/salon |
|---------|------------|------------|--------------|
| 72 | リンダスパ | 5店舗 | 4件 |
| 202 | ザギン | 5店舗 | 5件 |
| 295 | アロマメゾン | 3店舗 | 4件 |
| 886 | アロマモア | 4店舗 | 2件 |
| 1442 | ラグタイム | 7店舗 | 3件 |
| 1517 | 東京アロマエステ | 3店舗 | 5件 |
| 9709 | 竜宮城 | 5店舗 | 4件 |
| 13313 | エステの王様 | 3店舗 | 4件 |
| 14338 | アロマルナベル | 7店舗 | 2件 |

#### 未マッチのsalonId（DBに登録なし or URL不一致）

- Silk (9416): men-esthe.jpのHP=silk-esthe.com ↔ DBに別URL（すでに3件登録済みのため影響なし）
- アロマレディアン (12912)、リラックス東京 (2099)、ノーブランド (2482)
- うさぎちゃんスパ (12651)、銀座のニューエステ (13483)、エステの気分 (11137)
- ミラジュール (11884)、スパアンジュ (8751)、デジャヴ東京 (190)、クジャク (2531)

#### 次回口コミ取得の手順

1. `node scripts/debug/find_menesthe_salon_ids.mjs` で新規マッチを確認
2. MENESTHE_MAPに新エリアのsalonIdを追加して再実行
3. 出力されたTARGETS配列を `scrape_menesthe_reviews.mjs` の TARGETS に追記
4. `node scripts/maintenance/scrape_menesthe_reviews.mjs --dry-run` で確認
5. 本実行 → `node scripts/maintenance/auto_rewrite_reviews.mjs` で書き直し

### 2026-05-22 - mens-est.jp東京口コミスクレイピング・376件v2書き直し完了

#### mens-est.jp（メンエスじゃぱん）スクレイピング

- **`scripts/maintenance/scrape_mensest_reviews.mjs`** 作成（men-esthe.jp とは別サイト）
  - サイト: `https://mens-est.jp`（SSRサイト、cheerio互換、ペイウォールなし）
  - 店舗個別ページ: `https://mens-est.jp/salon/{salonSlug}/review/`
  - セラピスト名: `.review-item` 内の `.therapist-name` 等から取得
  - スコア変換: サイト固有の評価 → rating 1〜5
  - ページネーション対応
  - **108件挿入成功**

- **reviews テーブル NOT NULL 制約（重要）**
  - `therapist_id`: 実際のFKではないがNOT NULL → `mensest_${shopSlug}_${therapistName.replace(/\s+/g, '_')}` で生成
  - `user_name`: NOT NULL → `'mensest_user'` のプレースホルダー
  - `user_id`: NOT NULL → スクレイプ直後は `'menesthe_import'`（auto_rewriteのターゲット）
  - men-esthe.jp側は `menesthe_therapist_${id}` パターン。mens-est.jpは `mensest_${shopSlug}_${name}` パターン
  - ID形式: `mensest_${shopSlug}_${reviewId}`（再実行でduplicate keyエラー防止）

- **`auto_rewrite_reviews.mjs`** で376件全件v2書き直し
  - 処理対象: men-esthe.jp既存268件 + mens-est.jp新規108件 = 376件
  - 初回: 成功366件、失敗10件（ネットワークエラー・タイムアウト）
  - 再実行: 残り10件も全件成功 → **最終: 成功376件 / 失敗0件**
  - Anthropic API（Haiku）クレジット残高不足エラー → $25チャージ後に解消
  - コスト実績: 376件で概算$0.40〜$0.75

#### mens-est.jp スクレイピングパターン

- サイト構造: SSR（cheerioで取得可）
- TARGETS配列に `{ shopSlug, shopId, shopName }` を定義
- `therapist_id` は `mensest_${shopSlug}_${therapistName.replace(/\s+/g, '_')}` で生成（DB未登録でもOK）
- `user_name` は `'mensest_user'` で統一

#### auto_rewrite 失敗時の対処

- 失敗レコードは `user_id='menesthe_import'` のまま残る
- `node scripts/maintenance/auto_rewrite_reviews.mjs` を再実行するだけで自動ピックアップ
- ネットワークエラー（`fetch failed`、タイムアウト、`Bad control character in JSON`）は再実行で解消することが多い

#### auto_rewrite 重要注意事項（2026-05-22 追記）

- **RLS問題**: `VITE_SUPABASE_ANON_KEY` ではUPDATEが無効化されサイレントに無視される。`SUPABASE_SERVICE_ROLE_KEY` を`.env`に設定し、スクリプト内で使用すること
- **タグはUIの選択肢と完全一致必須**: `会話上手`・`リピート確定`・`テクニシャン`・`清楚`・`癒し系`・`清潔感`・`密着度が高い`・`素人` 等はUI非存在。スクリプト内にバリデーション（`ALLOWED_TAGS`）を実装済み

**UIの正式タグ一覧（全20個・2026-05-22 スクリーンショット確認済み）**:
- 体型（6）: スレンダー・グラマー・巨乳・美脚・小柄・高身長
- 雰囲気（5）: 可愛い系・美人系・清楚系・ギャル系・お姉さん系
- 年代（5）: 10代・20代前半・20代後半・30代・40代
- 属性（4）: 色白・健康的・ベテラン・外国人
- **Haikuのタグ破損**: `高身læng`・`高身next` 等のUnicode破損タグが稀に出るがバリデーションで自動除去される
- **訪問パターンの類似に注意**: 「流れでそのまま訪問」等、語彙だけ変えてパターンを残すのは元サイトと照合されやすい。プロンプトに「訪問の動機ごと変える」旨を明記済み（2026-05-22）。再実行が必要な場合は `reset_for_rewrite.mjs` でuser_idをリセットしてから `auto_rewrite_reviews.mjs` を実行する

### 2026-05-23（続き2）- DB重複整理・SearchPage機能追加

#### DB重複セラピスト 全件調査・削除

- **原因パターン**:
  1. `salon_blanca_鈴川ありさ`（初期一括登録、IDが雑）＋`..._salon_blanca_鈴川ありさ`（shop名二重）＋`..._鈴川ありさ`（再登録）
  2. `♦︎`付きID（tokyopla系: `_小日向ちい♦︎` vs `_小日向ちい`）
  3. UUIDと構造IDの混在（aroma_levante等）
  4. ランダムサフィックス（belle_lily: `_桜井まゆ_ewww2` vs `_桜井まゆ_x98l6`）
  5. スペースあり・なしのID揺れ（kawasaki_rere: `_若宮_ひかる` vs `_若宮ひかる_12`）

- **調査スクリプト**: `scripts/debug/check_all_duplicates.mjs`
  - 全セラピスト（45,217件）を `shop_id × name` でグループ化して重複検出
  - 同一店舗内で同名複数 = 重複（別店舗への同一人物登録は重複ではない）
  - 結果: 108店舗に重複、余分なレコード4,380件

- **削除スクリプト**: `scripts/maintenance/fix_all_duplicates.mjs`
  - 優先ロジック: 写真あり優先 → IDスコア低い（シンプル）優先 → created_at新しい優先
  - `idScore()`: UUID・shop名二重・♦︎・数字サフィックス・URLエンコードにペナルティ
  - 50件ずつバッチ削除
  - **実行結果: 4,380件削除完了**

- **SALON BLANCA個別対応**: `fix_blanca_duplicates.mjs` + `fix_blanca_numbered.mjs`
  - 「鈴川ありさ2」など番号付き重複も追加削除（9件）

#### SearchPage キャスト絞り込み・ソート機能追加

- **キャスト結果内の名前絞り込みバー**（`SearchPage.jsx`）
  - `castNameFilter` state + 🔍 アイコン付き入力欄
  - キャスト一覧が表示されているときのみ出現
  - ✕ボタンでクリア

- **並び替えボタン（4種）**
  - デフォルト / 五十音順（`localeCompare('ja')`）/ 💬 口コミ多い順 / ⭐ 評価が高い順
  - `ratingMap: { 正規化名: avgRating }` を reviews.rating の平均で計算
  - 既存の `reviewCountMap` useEffect を拡張して rating も同時取得

- **実装詳細**:
  - `sortedFilteredTherapists` useMemo: tagフィルター済み → 名前フィルター → ソート
  - `visibleTherapists` は `sortedFilteredTherapists.slice(0, displayCount)` に変更
  - `castNameFilter` / `castSortOrder` 変更時に `displayCount` をリセット

#### SearchPage キャスト名検索の正規化対応

- **問題**: `ilike '%西園寺未来%'` はDB上の「西園寺 未来」（スペースあり）にマッチしない
- **対応**: スペースあり / スペースなし / 全角スペース の3パターン全対応

- **実装ロジック** (`SearchPage.jsx` の DB fetch useEffect):
  ```
  normName = s => s.replace(/[\s　]/g, '').toLowerCase()
  normCq = normName(castQuery)
  cqParts = castQuery.split(/[\s　]+/)
  ```
  - スペースあり（「西園寺 未来」）→ 各パーツをAND ilike → DBの「西園寺未来」にマッチ ✓
  - スペースなし（「西園寺未来」）→ 前半N文字をprefixに広めにDB取得 → クライアント側 normName 照合 ✓
  - 店舗＋キャスト同時検索時: 店舗の全キャスト取得 → クライアント側 normName 照合

- **対応パターン一覧**:
  | 検索入力 | DBの名前 | 結果 |
  |---------|---------|------|
  | `西園寺未来` | `西園寺未来` | ✅ |
  | `西園寺未来` | `西園寺 未来` | ✅ prefix取得→クライアント照合 |
  | `西園寺 未来` | `西園寺未来` | ✅ AND ilike |
  | `西園寺　未来` | `西園寺未来` | ✅ 全角スペースも分割 |

---

## .env ファイル（要確認）

```
VITE_SUPABASE_URL=https://xxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

プロジェクトルートに配置。Gitには含まれていない（.gitignore済み）。

### 2026-05-23 - 手動口コミ投稿・UI統一・SearchPage改善

#### AI口コミ全削除
- `user_id='menesthe_rewritten'` の376件を全削除 → `delete_rewritten_reviews.mjs`

#### Silk 手動口コミ6件投稿（owner_manual）
- Q&A形式でユーザーにインタビューし、口コミを代筆
- 挿入スクリプト: `insert_mori_karen_review.mjs` 他6本
- 投稿完了セラピスト: 森かれん・白石せいな・吉岡えみ・浜崎あん・小嶋あかり・木田まりあ
- `user_id='owner_manual'` で管理
- **注意**: セラピスト名はDBのkanji表記と一致させること（ひらがなでIDを作るとtherapist_name_matchがずれる）

#### UI改善（ThreadDetailPage・ModernReviewCard）
- 評価ラベルを英語→日本語に変更（Cleanliness→清潔感 等）
- タグデザインをグレー→カラフルグラデーション（ピンク/パープル系）に変更

#### SearchPage タグフィルター修正
- `tagCounts` と `filteredTherapists` がセラピストプロフィールのタグ（`t.types||t.tags`）を参照していたため常に(0)になっていたバグを修正
- `reviewTagMap: { 正規化名: Set<tag> }` をreviewsテーブルから構築してフィルタリングに使用

#### 店舗リンク SearchPage スタイルに統一
- **方針**: 全ての店舗リンクを `/shops/:id` → `/search?shop=店舗名` に変更
- SearchPageは `searchParams.get('shop')` で店舗名を取得し `s.name.includes()` でマッチング
- **変更ファイル（10件）**:
  - `src/components/ui/ShopCard.jsx`
  - `src/pages/Home.jsx`（新着店舗スライダー）
  - `src/components/TopHeroSlider.jsx`（「店舗を見る」ボタン）
  - `src/features/ranking/components/RankingListItem.jsx`（shop typeのみ）
  - `src/features/ranking/components/PodiumCard.jsx`（shop typeのみ）
  - `src/pages/BrandPage.jsx`
  - `src/pages/ShopListPage.jsx`
  - `src/pages/FavoritesPage.jsx`
  - `src/components/BrandResultCard.jsx`
  - `src/pages/ThreadDetailPage.jsx` / `src/components/ThreadHeader.jsx`
- SearchPage内のShopCard（ローカルコンポーネント）は同ページに留まるためリンクを無効化（divとspanに変更）
- セラピスト→店舗（threads系）のリンクは `/shops/:shopId/threads/:threadId` のまま維持

### 2026-05-23（続き）- men-esthe.jp機能実装・管理ページ・口コミ700文字制限

#### 実装した機能一覧（men-esthe.jp参考）

| 機能 | ページ/ファイル | 状態 |
|------|--------------|------|
| 新人セラピスト一覧 | `/new-therapists` → `NewTherapistsPage.jsx` | ✅ |
| みんなの口コミ | `/popular-reviews` → `PopularReviewsPage.jsx` | ✅ |
| 口コミいいね | `ReviewLikeButton.jsx` + `review_likes` テーブル | ✅ |
| 閲覧日数システム | `user_credits` テーブル（手動付与に変更） | ✅ |
| Write-to-Read | `ModernReviewCard.jsx` の 🔒 ロック表示 | ✅ |
| 感謝バッジ | `ThanksBadgeButton.jsx` + `user_badges` テーブル | ✅ |
| 掲示板 | `/board` → `BoardPage.jsx` / `BoardDetailPage.jsx` | ✅ |
| チャット(DM) | `/chat` → `ChatListPage.jsx` / `ChatRoomPage.jsx` | ✅ |
| 管理ページ | `/admin` → `AdminPage.jsx` | ✅ |

#### 口コミ投稿 700文字制限
- `src/features/reviews/schema/reviewSchema.js`: story全セクション合計700文字以上のrefine追加
- `src/pages/PostReviewPage.jsx`: Step3にリアルタイム文字カウンター追加（プログレスバー付き）
- 自動クレジット付与トリガー（`on_review_insert_grant_credits`）は削除済み

#### クレジット付与フロー（手動運用）
1. ユーザーが `/post-review` で口コミ投稿（700文字以上必須）
2. 管理者（tugihe1112@gmail.com）が `/admin` で口コミを読む
3. 内容を評価して「閲覧日数を付与」ボタンで手動付与（3/7/15/25日のプリセット）
4. `user_credits` テーブルに加算される（既存日数に積み上げ）
5. ユーザーは次回訪問時から口コミが読めるようになる

#### 管理ページ仕様（`/admin`）
- アクセス制限: `ADMIN_EMAILS` 配列に含まれるメールのみ（現在: `tugihe1112@gmail.com` / `master@mens-esthe.jp`）
- タブ: ユーザー口コミ（実ユーザーのみ）/ 全口コミ / 付与済みクレジット一覧
- 付与済みには ✓ バッジ表示、追加付与も可能
- 口コミ削除機能あり
- 追加管理者は `AdminPage.jsx` の `ADMIN_EMAILS` 配列に追記する

#### DMチャット機能
- `chat_rooms` テーブル: user1_id, user2_id でユニークルーム
- `chat_messages` テーブル: Realtime購読（`supabase.channel()`）でリアルタイム受信
- `ModernReviewCard` に 💬 DM ボタン追加（実ユーザーの口コミのみ表示）
- DM開始: 既存ルームがあれば遷移、なければ新規作成

#### ホームページ バナー更新
- 2カラム → 3カラムに変更: 新人キャスト / みんなの口コミ / 掲示板

#### SQLマイグレーション実行済み
- `supabase_migrations/01_review_likes.sql`: review_likes テーブル
- `supabase_migrations/02_user_credits.sql`: user_credits テーブル（トリガーは後に削除）
- `supabase_migrations/03_user_badges_board.sql`: user_badges + posts + replies テーブル
- チャット用SQL（chat_rooms + chat_messages）: 手動で実行済み
- トリガー削除SQL: `DROP TRIGGER IF EXISTS on_review_insert_grant_credits ON reviews;` 実行済み

### 2026-05-24 - クレジット付与メール通知実装

#### 実装内容

管理画面（`/admin`）からクレジットを付与した際に、ユーザーへメール通知を自動送信する仕組みを追加。

| ファイル | 変更内容 |
|---------|---------|
| `api/notify-credit.js` | Vercel サーバーレス関数（新規作成） |
| `src/pages/AdminPage.jsx` | `GrantModal.grant()` にメール通知コール追加 |
| `vercel.json` | SPA rewrite ルール追加 |

#### フロー

1. 管理者が `/admin` → 口コミ展開 → 「閲覧日数を付与」ボタン
2. 日数を選択 → 「N日付与する」クリック
3. DB更新成功 → `/api/notify-credit` を POST（失敗してもDB付与は完了扱い）
4. API: Supabase Admin で `auth.users` からユーザーのメールアドレスを取得
5. Resend API でメール送信
6. モーダルに送信ステータス表示（📧送信中 → ✅完了 or ⚠️失敗）→ 1.5秒後に閉じる

#### メール内容

- 件名: `【閲覧権限付与】N日間の閲覧権限をお渡しします 🎉`
- ダークテーマ HTML メール（ピンク/パープルグラデーション）
- 付与日数・累計日数・有効期限を大きく表示
- 「みんなの口コミを読む」CTA ボタン

#### 必要な環境変数（Vercel ダッシュボードで設定）

| 変数名 | 説明 |
|--------|------|
| `SUPABASE_SERVICE_ROLE_KEY` | auth.users 参照に必要（すでに `.env` に設定済み） |
| `VITE_SUPABASE_URL` | Supabase プロジェクト URL |
| `VITE_PUBLIC_SITE_URL` | サイトURL（メール内リンク用） |
| `RESEND_API_KEY` | **Resend で取得が必要**（下記参照） |

#### Resend セットアップ手順

1. https://resend.com にアクセス → 無料登録（月3,000件まで無料）
2. 「API Keys」→「Create API Key」→ キーをコピー
3. Vercel ダッシュボード → プロジェクト → Settings → Environment Variables → `RESEND_API_KEY` を追加
4. 「Domains」で `mens-esthe.jp` を追加・DNS認証（送信元が `noreply@mens-esthe.jp` になる）
5. DNS認証前のテストは `onboarding@resend.dev` を from アドレスに変更して動作確認可能

**`RESEND_API_KEY` がない場合**: メール送信はスキップされ `skipped: no_resend_key` が返る（付与処理は正常完了）

#### 注意事項

- メール送信失敗 → DB付与は完了済み。失敗してもユーザーのクレジットはちゃんと加算される
- `api/notify-credit.js` は `@supabase/supabase-js` を使用（既にインストール済み）
- Vercel の serverless function は `api/` ディレクトリに置くだけで自動検出

### 2026-05-28（続き2）- スケルトンUI・口コミ投稿UX改善

#### スケルトンUI実装（ローディング体験改善）

- **`src/components/ui/Skeleton.jsx`** 新規作成
  - `TherapistCardSkeleton` / `ShopCardSkeleton` / `RankingRowSkeleton` / `ReviewCardSkeleton`
  - `HeroSkeleton` / `TherapistGridSkeleton` / `ShopGridSkeleton` / `RankingListSkeleton`
  - 共通 `Pulse` コンポーネント（`bg-slate-800 animate-pulse rounded-xl`）

- **`Home.jsx`**: 全画面「読み込み中...」ブロックを削除 → ヘッダー・検索バー・W2R帯を即時表示
  - 注目セラピスト横スクロール: loading中は6枚の縦長スケルトン
  - 新着店舗横スクロール: loading中は5枚の縦長スケルトン

- **`RankingPage.jsx`**: 全画面スピナーを削除 → 即時表示
  - loading中は表彰台3枠スケルトン + `RankingListSkeleton`（5行）

- **`SearchPage.jsx`**: 検索中の `opacity-40` フェードをスケルトン8枚に差し替え

#### 口コミ投稿ページ UX改善（`PostReviewPage.jsx`）

- **店舗選択をコンボボックスに変更**
  - `<select>` 586件ドロップダウン → テキスト入力 + フィルタリング候補ドロップダウン
  - フォーカス時に先頭20件表示、入力すると最大20件に絞り込み
  - 選択済み: ✓ チェックマーク表示。外クリックで候補閉じる
  - URLパラメータ経由（SearchPage「リストにいない」から来た場合）は固定表示を維持

- **セラピスト選択に検索バーを追加**（`TherapistGrid` コンポーネント新設）
  - 検索欄で名前をリアルタイム絞り込み（スペース・全角スペース正規化対応）
  - 「指名なし」カードを削除
  - 「リストにいない」はグリッド末尾に配置
  - 0件ヒット時は「〇〇に一致するセラピストが見つかりません」と表示

#### 方針確認（コンサル提案への反論）
- 「ランキング文言の弱め方」→ 現状の積極CTAを維持（弱めると逆効果）
- 「ブランド統一」→ サイト名未決定のため延期
- 実際の優先2項目: スケルトンUI（完了）・canonical確認

### 2026-05-28 - コンサル提案対応（UI/UX全面改善）

#### Pepe Spa 東京5店舗 完了
- 調布・八王子・町田・蒲田・下北沢 各43名登録（`fix_all_spacer_images.mjs` 流用）
- 重複「白雪 める」6件削除
- **585/586店舗コンプリート**（残り1件はno-brand.jpサイトダウン）

#### ランキング空表示を「口コミ募集中」CTAに差し替え
- `RankingSection.jsx`: 「まだ集計データがありません」→ 紫グラデーションバナー＋「口コミを書く」
- `RankingPage.jsx`: 「📉 No Data Available」→ エリア名入り「〇〇のランキングを作ろう」＋2ボタン

#### ファーストビュー再設計（検索中心）
- `Home.jsx` ヒーロー内テキスト: 「極上の癒やしを、あなたに。」→「店舗・セラピスト名で口コミ検索」
- ヒーロー直下にWrite-to-Read帯を独立配置（紫グラデーション）
- 「このサイトの使い方」のSTEPバナーを削除→4機能ショートカットカードのみに簡略化

#### Write-to-Read 訴求の多点配置
- `SearchPage.jsx`: 検索結果12枚目の後にグリッド全幅W2R帯を挿入
- `ModernReviewCard.jsx`: ロック時の訴求文を強化（「体験談を投稿するとこの口コミが読めます」）

#### CTA 2本柱整理（探す・投稿する）
- `BottomNav.jsx`: 「ランキング」→「投稿する」（鉛筆アイコン、常時ピンク背景強調）
- 構成: ホーム / キャスト / **投稿する** / マイページ

#### 注目セラピスト 分散ロジック改善（`Home.jsx`）
- Before: 60件ランダム→20件（大手店舗が統計的に多出現）
- After: 300件取得 → 店舗ごと最大2名 → 都道府県ごとラウンドロビン → 20名
- `shops` を dependency に追加（データロード後に実行）

#### エリアSEOページ（`/area/:pref`）新規作成
- `src/pages/PrefecturePage.jsx` 作成
- 対応スラグ: tokyo/osaka/aichi/kanagawa/saitama/chiba/hyogo/kyoto/fukuoka/miyagi/shizuoka/shiga/hiroshima/hokkaido
- noindex: 店舗数5件未満のページ
- パンくず・エリア別店舗一覧・他都道府県内部リンク
- `App.jsx` に `/area/:pref` ルート追加

#### 絵文字整理（`Home.jsx`）
- セクションヘッダーの装飾絵文字（🏙️）を削除
- 機能カードアイコン・ランク表示は維持

---

### 2026-05-27 - SEO対応（robots.txt・sitemap.xml・canonical・SeoHead）

#### robots.txt 作成（`public/robots.txt`）
- `Disallow: /admin` でクロール除外
- `Sitemap:` にVercelドメインを明記

#### sitemap.xml ドメイン更新（`public/sitemap.xml`）
- `your-domain.com` → `mens-esthe-site-beta.vercel.app` に全置換
- 本番ドメイン確定後に再度更新が必要

#### canonical タグ追加（`src/components/SeoHead.jsx`）
- `<link rel="canonical" href={url} />` を追加
- `SITE_URL` を `VITE_PUBLIC_SITE_URL` 環境変数から取得するよう修正（旧: `window.location.origin`）

#### SeoHead を主要ページに追加
- `Home.jsx`: title="メンズエステ検索・口コミ", path="/"
- `SearchPage.jsx`: title="キャスト検索", path="/search"
- `AreaSearchPage.jsx`: title="エリアから探す", path="/area-search"

---

### 2026-05-26 - ホームUI大幅改善（men-esthe.jp参考）

#### TopHeroSlider → セラピスト写真スライダーに刷新（`TopHeroSlider.jsx`）
- 店舗サムネイル表示 → **セラピスト写真**表示に変更
- Supabaseから`therapists`テーブルのimage_url持ちを100件取得→シャッフル→6枚選出
- noimage/spacer除外フィルタ付き
- `object-top`で顔が見えるように上寄せ
- 「✨ 注目セラピスト」バッジ（左上）追加
- オーバーレイを下方向グラデーションのみに変更（写真をより明るく見せる）
- 店舗名・都道府県を下部に表示、「店舗を見る」ボタンでSearchPageに遷移

#### Home.jsx — 3点追加

**① 「このサイトの使い方」セクション**（ヒーロー直下）
- Write-to-Readシステムの説明バナー（STEP 1-2-3フロー）
- 4機能カード: キャスト検索 / 口コミを書く / 掲示板 / ランキング

**② 「注目セラピスト」横スクロールセクション**
- Supabaseからimage_urlありセラピストを60件取得→シャッフル→20枚表示
- 縦長カード（aspect-[3/4]）、顔が見えるよう`object-top`
- タップでSearchPageの該当店舗＋キャスト名に遷移

**③ PC用2カラムサイドバー（`lg:block`）**
- メインコンテンツ右側に280px（xl:320px）のサイドバー
- 「注目店舗」: image_url持ちの店舗からランダム6件をリスト形式（`sidebarShops` useMemo固定）
- 口コミ投稿バナー（紫）
- みんなの口コミへのリンク（ピンク）
- 掲示板へのリンク（青）
- `sticky top-4` で画面スクロールに追随

#### デザイン修正（`TopHeroSlider.jsx`・`Home.jsx`）
- スライダー外枠フレーム化: `rounded-3xl overflow-hidden border border-white/10 + pink glow shadow`
- 親要素に`px-4 md:px-8 pt-4`でフレームが見えるよう余白
- 新着店舗カード: 画像（rounded-t-2xl）＋テキスト（bg-slate-900 rounded-b-2xl）で分離→白テキスト問題解消

### 2026-05-25 - 店舗サムネイル全面刷新・口コミ投稿「リストにいないセラピスト」機能

#### 店舗サムネイル全面刷新（Supabase Storage スクショ → og:image）

これまで Supabase Storage に保存されていた店舗サムネイル（スクリーンショット画像）を、各店舗公式サイトの og:image / apple-touch-icon / logo に置き換えた。

**フェーズ1: 通常fetch** → `scripts/maintenance/fix_shop_storage_images.mjs`
- 対象: `image_url` が Supabase Storage URL になっている全店舗
- og:image → twitter:image → apple-touch-icon → logo/background-image の優先順位で自動検出
- `website_url` 単位でグループ化（同一URLの複数店舗は1回のfetchで処理）
- **結果: 371件更新、142件失敗**（Cloudflare保護・JS描画サイト）

**フェーズ2: Chrome経由** → `scripts/maintenance/fix_shop_images_chrome.mjs`
- 142件の失敗分をClaude in Chromeで各サイトを開いてog:imageを手動収集
- `URL_IMAGE_MAP`（website_url → image_url）をハードコードしたバッチ更新スクリプト
- **結果: 118件更新、24件はマップ未登録のまま（元のStorage画像を維持）**

**合計: 489件のサムネイルを刷新**

#### 口コミ投稿「リストにいないセラピスト」機能（`/post-review`）

新人セラピストなどDBに未登録の名前で口コミを書けるよう、選択肢にない場合の入力フローを追加。

**変更ファイル:**

| ファイル | 変更内容 |
|---------|---------|
| `src/features/reviews/hooks/useReviewForm.js` | `therapistName: ''` をdefaultValuesに追加、submitDataに `therapist_name` を含める |
| `src/pages/PostReviewPage.jsx` | Step1_Selectに「✏️ リストにいない」ボタン + 自由入力欄、Step4_Confirmにセラピスト名表示 |

**UXフロー（Step1）:**
1. セラピスト一覧カードが表示される
2. 「✏️ リストにいない」ボタンをタップ → `customMode` ON
3. テキスト入力欄が出現 → セラピスト名を手入力
4. 以降は通常の口コミ投稿フローと同じ（Step2→Step3→Step4→送信）

**実装詳細:**
- `customMode` は `useState` でローカル管理（フォームフィールドではない）
- `therapistId` は null のまま、`therapistName` に入力した名前を格納
- `selectTherapist(t)` 実行時は `therapistName` にも `t.name` をセット（既存選択でも therapist_name がDBに保存される）
- 送信後のリダイレクト: therapistId がある場合 → ThreadDetailPage、ない場合（カスタム名）→ SearchPage
- **バグ修正**: 従来は therapist_name が submitData に含まれておらず、DB の `therapist_name` カラムが null になっていた。今回の変更で既存フローでも正しく保存される

#### SearchPageキャスト一覧への「リストにいない」カード追加

PostReviewPage の導線が分かりにくいため、SearchPage のキャスト一覧グリッド先頭に「✏️ リストにいない」カードを追加。

**表示条件**: `shopQuery` が設定されていて `matchingShops.length === 1`（特定の1店舗が選択されているとき）のみ表示

**リンク先**: `/post-review?shopId={matchingShops[0].id}&customMode=true`

**PostReviewPage 対応変更**:
- `useSearchParams` を追加インポート
- `qsShopId`（クエリストリングのshopId）・`initCustomMode`（customMode=trueフラグ）を取得
- `effectiveShopId = paramShopId || qsShopId` で path params と query params を統合
- `Step1_Select` に `initCustomMode` prop を追加 → `useState(initCustomMode || false)` でカスタムモード初期値を制御
- **結果**: SearchPage から遷移するとSALON BLANCAが自動選択済み＋テキスト入力欄がONの状態でStep1が表示される

#### PostReviewPage カスタムモードUX改善

「リストにいない」選択時、セラピストカード一覧を非表示にして名前入力欄だけを表示するよう変更。

- `customMode` ON → カードグリッド全体を隠す・名前入力欄のみ表示・「← リストから選ぶ」で戻れる
- `customMode` OFF → 通常のカードグリッド表示（指名なし・セラピスト一覧・リストにいないボタン）

---

### 2026-05-29 - 公開前セキュリティ・UX修正5件

#### package.json 整理
- `puppeteer` / `cheerio` / `express` / `cors` / `dotenv` / `fs-extra` / `axios` を `devDependencies` に移動
- これらはスクリプト専用ライブラリ。`dependencies` のままだと Vercel がビルド時にインストール・バンドルしようとする（特に `puppeteer` はChrome本体を DL するためビルド失敗の原因になる）

#### Safe Area 対応（iPhone ホームバー被り修正）
- `index.html`: `viewport-fit=cover` を viewport meta に追加
- `BottomNav.jsx`: `mb-6` を `style={{ marginBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}` に変更
- 非iPhoneでは `0px` なので見た目の変化なし。iPhoneでは34px上にずれてホームバーと重ならなくなる

#### 未ログイン時ログインガード
- `BottomNav.jsx`: `useAuth` / `useNavigate` をインポート。「投稿する」NavLink に `onClick` ガードを追加
  - `user` が null の場合: `/login` にリダイレクト（`state: { redirect: '/post-review' }` を渡す）
  - `user` がいる場合: 通常の `/post-review` 遷移
- `LoginPage.jsx`: `useLocation` を追加。ログイン成功後に `location.state?.redirect || '/mypage'` へ遷移するよう変更

#### /admin セキュリティ強化

**問題**: クレジット付与が「フロントエンドから anon key で直接 Supabase REST API を PATCH」していた。anon key はJSソースに露出しているため、誰でも同じリクエストを送れる状態。

**対応**:
- `api/admin-grant-credit.js` 新規作成（Vercel サーバーレス関数）
  - リクエストの `Authorization: Bearer {JWT}` を `supabaseAdmin.auth.getUser(token)` で検証
  - メールが `ADMIN_EMAILS` に含まれない場合は 403 を返す
  - 検証を通過した場合のみ `SUPABASE_SERVICE_ROLE_KEY`（RLSバイパス）でクレジット付与
- `AdminPage.jsx` `GrantModal.grant()` を改修
  - `supabase.auth.getSession()` で管理者自身の JWT を取得
  - `/api/admin-grant-credit` に JWT を付けて POST（直接 PATCH は廃止）
  - `import { supabase } from '../lib/supabase.js'` を追加

#### RLS ポリシー（Supabase 手動適用が必要）
- `supabase_migrations/04_rls_policies.sql` 作成
- 対象テーブル: `reviews` / `user_credits` / `shops` / `therapists` / `review_likes` / `user_badges` / `chat_messages`
- **重要**: `user_credits` の `FOR ALL USING (false)` は Service Role をバイパスするため、`api/admin-grant-credit.js` の動作には影響しない
- ⚠️ **まだ Supabase ダッシュボードで実行していない。公開前に要実行**

---

## 注意事項

- **JS描画サイト**はcheerioでは取得不可。Claude in Chromeブラウザ経由が必要
- サンドボックス（Claude側のbash）は外部ネットワーク不可。スクリプトはユーザーのターミナルで実行
- 画像URLがSupabase Storage（`azuetkuzzmshqfbrhqmf.supabase.co/storage/...`）になっていれば正常
- `therapist-images` バケットに画像アップロード済みの場合は `upsert: true` で上書き可
- **クレジット付与は `/api/admin-grant-credit.js` 経由のみ**（2026-05-29以降。直接 REST API PATCH は廃止）

---

### 2026-05-29（続き）- サイト名決定・ドメイン取得・DNS設定・モバイルUI全面改善

#### サイト名決定
- **メンエスマップ**（英語ロゴ表記: Mens Esthe.Map）に決定
- 更新ファイル: `index.html` / `src/components/SeoHead.jsx` / `public/manifest.json` / `CLAUDE.md`

#### ドメイン取得
- **mens-esthe-map.jp** をムームードメインで取得（990円/年）
- アカウント: tugihe1112@gmail.com（パスワードはiCloudキーチェーン）

#### Vercel × ムームードメイン DNS設定
- Vercel → mens-esthe-site → Domains → Add Existing で `mens-esthe-map.jp` を追加
- ムームードメイン → ドメイン操作 → ムームーDNS → カスタム設定 → 設定2 で以下を登録：

| No | サブドメイン | 種別 | 内容 |
|----|------------|------|------|
| 1 | （空白） | A | `216.198.79.1` |
| 2 | www | CNAME | `f42a7fce174242fa.vercel-dns-017.com` |

- DNS反映待ち（数分〜数時間）。反映後 `https://mens-esthe-map.jp` で開けるようになる
- 反映確認後: Vercel環境変数 `VITE_PUBLIC_SITE_URL` を `https://mens-esthe-map.jp` に更新、`sitemap.xml` のドメインも更新

#### モバイルUI全面改善
- **ハンバーガーメニュー廃止** → 現代アプリの標準（Instagram・メルカリ等に準拠）
- **BottomNav 4→5タブ化**: ホーム / キャスト / 投稿 / ランキング / マイページ（未ログイン時はログイン）
- **ヘッダー（モバイル）**: ロゴ + 未ログイン時のみ「ログイン」（枠線）「会員登録」（ピンク）ピル型ボタン
- **TopHeroSlider**: モバイル上部余白を `pt-4` → `pt-20` に変更（ヘッダーと被り解消）
- **SearchPage**: 空クエリ時は🔍プロンプト表示のみ（DBへの無駄なリクエストなし）
- **SearchPage**: `sticky top-0` → `sticky top-20` + `pt-20` でヘッダーのz-index被り解消

#### Vercel デプロイ
- `.npmrc` に `legacy-peer-deps=true` 追加（`react-helmet-async` のpeer dep競合を解消）
- `git push origin main` → Vercel自動デプロイ → Ready確認済み（commit: 28f5717）

### 2026-05-29（続き2）- Resendドメイン認証・メール本番設定

#### Resend ドメイン認証完了
- Resend → Domains → `mens-esthe-map.jp` を追加（Tokyo ap-northeast-1）
- ムームードメインのカスタムDNSに以下の3レコードを追加：
  - TXT `resend._domainkey` : DKIM公開鍵
  - MX `send` : `feedback-smtp.ap-northeast-1.amazonses.com`（Priority: 10）
  - TXT `send` : `v=spf1 include:amazonses.com ~all`
- 約24分でVerified（緑）になった

#### メール送信元を本番用に変更
- `api/notify-credit.js` の `from:` を変更
  - 変更前: `'メンズエステ情報 <onboarding@resend.dev>'`
  - 変更後: `'メンエスマップ <noreply@mens-esthe-map.jp>'`
- commit: 984d5f5 → Vercel自動デプロイ完了

#### Vercel 環境変数更新
- `VITE_PUBLIC_SITE_URL` を `https://mens-esthe-site-beta.vercel.app` → `https://www.mens-esthe-map.jp` に更新
- Redeployして反映済み

### 2026-05-30 - 公開後チェック・お問い合わせフォーム実装（Codex）

#### 公開後チェック
- `https://www.mens-esthe-map.jp` HTTP 200確認済み
- 裸ドメイン `https://mens-esthe-map.jp` → `https://www.mens-esthe-map.jp/` に307リダイレクト確認済み

#### sitemap.xml / robots.txt 本番URL化
- 全URLを `https://www.mens-esthe-map.jp` に変更
- `lastmod` を `2026-05-30` に更新
- `/contact` を sitemap に追加
- `robots.txt` の Sitemap URL も本番URLに更新

#### お問い合わせフォーム実装（api/contact.js + ContactPage.jsx）
- `api/contact.js` 新規作成（Vercelサーバーレス関数）
  - Resend経由でメール送信、`from: noreply@mens-esthe-map.jp`
  - 送信先: `CONTACT_TO_EMAIL` 環境変数、未設定なら `tugihe1112@gmail.com`
  - honeypot（`company`フィールド）・文字数制限・メール形式チェックあり
- `src/pages/ContactPage.jsx` 新規作成（`/contact`）
  - カテゴリ: 掲載情報の修正 / 口コミ・投稿について / 有料プランについて / その他
- `App.jsx`: `/contact` ルート追加、FooterをLayout全体に表示
- `LegalPage.jsx`: お問い合わせ文言を `/contact` へのリンクに変更
- `Footer.jsx`: お問い合わせリンク追加、コピーライトを「メンエスマップ」に変更
- `SeoHead.jsx` / `api/notify-credit.js`: フォールバックURLを `https://www.mens-esthe-map.jp` に統一

#### 確認済み
- `npm run build` 成功
- `node --check api/contact.js` / `api/notify-credit.js` 成功
- ローカル `/contact` 表示確認済み
- git push済み（commit: 726197f）→ Vercelデプロイ完了

#### Google Search Console 登録（2026-05-30）
- `https://www.mens-esthe-map.jp` をURL プレフィックスで登録
- HTMLタグ方式で所有権確認 → `index.html` に `google-site-verification` メタタグ追加（commit: 2cfd5d6）
- sitemap.xml 送信完了（476ページ検出・正常処理確認済み）

#### PWAアイコン追加（2026-05-30）
- `public/images/icon-192.png` / `icon-512.png` を生成（ダークテーマ+ピンク/パープルグラデーション）
- commit: f7e9715 → Vercelデプロイ完了

#### http:// 画像URL問題の発見・修正（2026-05-30）
- Silk (シルク) の31件が `http://www.ms-silk.tokyo/images/` を参照していた
- HTTPSサイトからHTTP画像を読み込むと混在コンテンツとしてブラウザがブロック → 画像が表示されない
- 同様の問題が他店舗にも存在する可能性あり → `check_http_images.mjs` で調査要

#### Silk 写真衝突バグの発見・修正（2026-05-30）
- **原因**: 過去に `fix_silk_images.mjs`（旧バージョン）が実行されており、Storage ファイル名を `therapistId.replace(/[^\w-]/g, '_')` で生成していた
  - 日本語名が全てアンダースコアに変換され、同じ文字数の名前が同一ファイル名になって上書きされていた
  - 例: `白石せいな`（5文字）と `篠宮ゆかり`（5文字）が同じ `silk_tokyo_shibuya_silk______.jpg` になっていた
- **解決策**: 元サイトの画像URLのベースネーム（`ml_11_1_7123.JPG` 等）をStorage ファイル名に使用 → 衝突しない
- `fix_silk_images_v2.mjs` で31件を正しいファイル名で再アップロード・DB更新完了
- Silkスタッフページ: `http://www.ms-silk.tokyo/staff/`

#### ⚠️ 写真衝突バグ 教訓
- **Storage ファイル名には必ず元URLのベースネームを使う**（`therapistId` を使ってはいけない）
- 日本語IDは `replace(/[^\w-]/g, '_')` で全てアンダースコアになり衝突する
- 正しいパターン: `const storageFileName = \`prefix_\${imageUrl.split('/').pop().toLowerCase()}\``
- URLのベースネームが全店舗で `1.jpg` になるCMSは staffId を使う（例: BQ-INS の `data/staff/{staffId}/1.jpg`）

#### http:// 画像 全店舗一括修正（2026-05-30）
- `check_http_images.mjs` で調査 → 20店舗・735件が http:// 参照
- `fix_http_images_all.mjs` で一括修正 → 716件成功・19件失敗（退職者の404）
- 失敗19件は退職者のため対応不要
- ⚠️ URLのベースネームが全員 `1.jpg` になる店舗は別途対応が必要（BQ-INS等）

#### BQ-INS 写真衝突バグ修正（2026-05-30）
- 原因: `data/staff/{staffId}/1.jpg` パターンでベースネームが全員 `1.jpg` → Storage衝突
- `fix_bqins_images.mjs` で staffId をファイル名に使用して再アップロード
- 3店舗（自由が丘・中目黒・三軒茶屋）116件成功・25件マッチなし（退職者）
- BQ-INS スタッフページ: `http://bqins.jp/therapist/`

#### BECAUSE 「さんの写真」重複エントリ削除（2026-05-30）
- `tokyo_dispatch_because` に「広瀬りおさんの写真」等の旧スクレイピング残骸13件が残存
- 正しいエントリ（「広瀬りお」等）が別途存在するため13件削除

#### SearchPage「リストにいない」カード 複数店舗対応（2026-05-30）
- 複数店舗ヒット時（matchingShops.length > 1）はカードが非表示になっていたバグを修正
- `matchingShops.length === 1` → `matchingShops.length >= 1` に変更（commit: cdc3e94）

#### 写真衝突バグ 全店舗調査・修正（2026-05-30）
- 調査方法: 同一shop内で同一image_urlを持つ異なる名前のセラピストを検出
- `_1.jpg` パターンチェックは誤検知が多い → 実際のURL重複チェックが正確
- **実際に衝突していた店舗: 4店舗**（当初の84店舗から大幅に絞り込み）
  - QUEEN'S COLLECTION 4店舗: 「名称未設定」画像に7名が衝突 → image_url をnullに更新（35件）
  - 竜宮城（門前仲町・蒲田）: 一ノ木えま/影山まゆか・花尻はるな/鈴野ななか → nullに更新（8件）
- 鬼灯（ほおずき）・Lunabelle等は衝突なし（タイムスタンプ系ファイル名で固有）
- **教訓**: `_1.jpg`チェックは誤検知あり。実際の重複URLチェックで判定すること

### 2026-05-31 - パフォーマンス・セキュリティ・SEO強化

#### 動的OGP画像生成（`api/og.js`）
- `@vercel/og`（Edge Runtime）で1200×630の動的OGP画像を生成
- パラメータ: `?shop=店舗名&sub=サブテキスト&image=画像URL`
- 店舗名・セラピスト名入り画像がSNSシェア時に自動表示される
- `ShopDetailPage.jsx` / `SeoHead.jsx` でog:imageを動的URLに変更済み

#### LazyImage WebPフォールバックバグ修正（`src/components/LazyImage.jsx`）
- 旧: WebP URL失敗時に `setError(false)` → errorがすでにfalseなので再レンダーされない（無限ループ）
- 修正: `useOptimized` stateを追加。WebP失敗 → `setUseOptimized(false)` で元URLに切り替え
- Supabase Storage画像のみWebP変換（`/render/image/public/` + `?width=800&format=webp&quality=80`）
- 外部CDN画像（caskan・re-db等）はそのまま（変換不可）

#### vercel.json キャッシュ + セキュリティヘッダー
- `/assets/` 配下・静的ファイル: `Cache-Control: public, max-age=31536000, immutable`（1年キャッシュ）
- 全ページ: `X-Content-Type-Options` / `X-Frame-Options: DENY` / `X-XSS-Protection` / `Referrer-Policy` / `Permissions-Policy`
- SecurityHeaders.com で **A評価** 確認済み
- Missing: `Content-Security-Policy`（外部リソース多数のため設定複雑→保留）

#### システムフォント最適化（`tailwind.config.js`）
- `Inter`（未読み込み）を削除 → `system-ui / -apple-system / Hiragino Sans / Noto Sans JP / Yu Gothic` 優先に
- iOS→SF Pro、Android→Roboto+NotoSans、Windows→Yu Gothic が自動適用
- Webフォントのダウンロード不要 → LCP改善

#### Supabase preconnect（`index.html`）
- `<link rel="preconnect">` + `<link rel="dns-prefetch">` を追加
- Supabaseへの初回接続を事前確立 → データ取得が数十ms速くなる

#### フッターにエリア別内部リンク追加（`Footer.jsx`）
- 13都道府県（tokyo/osaka/aichi/kanagawa/saitama/chiba/hyogo/kyoto/fukuoka/miyagi/shizuoka/hiroshima/hokkaido）
- `{都道府県}のメンズエステ` テキスト + `/area/{slug}` へのリンク
- ピル型タグデザイン（bg-slate-900 rounded-full）
- 効果: クローラーがどのページからでも都道府県ページに到達できる → 地域キーワードのインデックス促進

### 2026-06-01 - UI/UXバグ修正・全体品質改善

#### SearchPage 4点修正
- sticky検索バー削除（`sticky top-20 z-40` → 通常フロー）：スクロール時についてまわる問題を解消
- `body` 背景を `bg-gradient-to-br to-purple-900` → `bg-slate-950` に変更：半透明要素から紫が滲む問題を全ページ解消
- ShopCard `bg-slate-900/60`（半透明）→ `bg-slate-900`（不透明）：曇りガラス状態を解消
- ShopCard の行全体を `<Link>` に変更：タップしても何も起きない問題を解消、キャスト一覧へ遷移

#### ShopDetailPage・RankingPage タブバー修正
- `sticky top-0 z-40` → `sticky top-20 z-40`：固定ヘッダー（z-50）とタブバーが重なる問題を解消
- 同時に `backdrop-blur-xl` も削除（不透明背景に統一）

#### index.css モバイルボタン強制パディング削除
- `@media (max-width: 768px) { button { padding: 0.75rem 1rem; } }` を削除
- 全ボタンに強制パディングが適用されていた問題を解消（小型ピルボタン等のレイアウト崩れ防止）

#### ThreadCard Link化（`src/components/ThreadCard.jsx`）
- `div + onClick` → `<Link to="...">` に変更
- モバイル長押しで「新しいタブで開く」が出るように改善

#### 口コミ投稿ページ 日本語化（`src/pages/PostReviewPage.jsx`）
- 全英語ラベルを日本語に統一: TARGET→店舗・セラピストを選択 / STORE→店舗名 / THERAPIST→セラピスト / SCORING→採点 / STORY→体験談を書く / CONFIRM→投稿内容の確認 / NEXT STEP→次へ進む / BACK→戻る / CANCEL→キャンセル / Step X/X→X/Xステップ
- 半透明背景（`bg-slate-900/50`）→ 不透明（`bg-slate-900`）に統一
- タイトルサイズを `text-2xl` → `text-xl` に調整（スッキリ感向上）

### 2026-06-02 - 銀座エリアランキング調査・銀座一兆・Ginza Rich 登録スクリプト作成

#### 銀座エリアランキング調査（mens-mg.com）
- 銀座エリアランキング確認:
  1位 AROMA MAISON（✅登録済み）
  2位 THE★GIN（✅登録済み）
  3位 銀座一兆（❌未登録 → 今回対応）
  4位 Ginza Rich（❌未登録 → 今回対応）
- **アクティブな店舗を優先する方針**を確認（過去の口コミ蓄積より現在のアクティブ度を重視）

#### 銀座一兆 登録スクリプト作成 → `scripts/maintenance/process_ginzaitcho.mjs`

| 項目 | 内容 |
|------|------|
| shop_id | `tokyo_chuo_ginza_itcho` |
| URL | https://ginza-itcho.com/ |
| schedule_url | https://ginza-itcho.com/schedule.php |
| セラピスト数 | 23名（姓のみ表記） |
| 画像パターン | `/images_staff/{sid}/{filename}.jpeg`（プロフィールページから個別取得） |

- 姉妹店: 池袋天花（ikebukuro-tenka.com）・恵比寿蘭丸（ebisu-ranmaru.com）・カシェット池袋（cachette-ikebukuro.com）← 今後登録予定
- 実行: `node scripts/maintenance/process_ginzaitcho.mjs [--dry-run]`

#### Ginza Rich 登録スクリプト作成 → `scripts/maintenance/process_ginzarich.mjs`

| 項目 | 内容 |
|------|------|
| shop_id | `tokyo_chuo_ginza_rich` |
| URL | https://ginza-rich.work/ |
| ルーム | 銀座Room / 東銀座Room / 八重洲Room（1店舗として登録） |
| セラピスト数 | 72名（フルネーム・画像URLをハードコード済み） |
| 画像パターン | `sys_img/ginza-rich/cast/{castId}/4/{timestamp}_{filename}.jpg` |

- Storage ファイル名: `ginzarich_{castId}.jpg`（castIdがユニークなため衝突なし）
- 実行: `node scripts/maintenance/process_ginzarich.mjs [--dry-run]`

#### 新パターン: Ginza Rich sys_img CDN
- URL: `https://ginza-rich.work/sys_img/ginza-rich/cast/{id}/4/{timestamp}_{filename}.jpg`
- Refererヘッダー付きでfetch可能（ホットリンク保護なし）
- castIdがユニークなのでStorageファイル名に使用可

### 2026-06-03 - 人気店DB未登録チェック・渋谷エリア4店舗登録

#### 人気店DB未登録チェックスクリプト作成 → `scripts/debug/check_missing_popular_shops.mjs`
- mens-mg.com の新宿・渋谷ランキング上位10店舗をDBと照合
- キーワード検索 + website_url検索の2段階でチェック
- 結果: 新宿・渋谷で未登録4店舗を特定（RioSPA・S活・CIEL SPA・mirrors spa）
- ※ ANAICHIとAroma Jewelsはキーワード不一致で誤って「未登録」と表示されたが実際は登録済み

#### 渋谷エリア4店舗 登録完了 → `scripts/maintenance/process_ciel_spa.mjs` / `process_riospa.mjs` / `process_skatsu_mirrors.mjs`

| 店舗 | shop_id | 人数 | 画像パターン |
|------|---------|------|------------|
| CIEL SPA (シエルスパ) | `tokyo_shibuya_shibuya_ciel_spa` | 122名 | `ciel-spa.com/photos/{lid}/main_{lid}.jpg`（lid直接構築） |
| RioSPA (リオスパ) | `tokyo_shibuya_shibuya_riospa` | 55名 | `riospa.tokyo/images/cast/{hash}.jpg`（プロフィールページから個別取得） |
| S活 (エスかつ) | `tokyo_shibuya_shibuya_skatsu` | 52名 | `xn--s-vp9b.com/images/ml_11_1_{id}.jpg`（background-imageパターン） |
| mirrors spa (ミラーズスパ) | `tokyo_shibuya_shibuya_mirrors_spa` | 57名 | `mirrorsspa.com/photos/{lid}/{timestamp}-{uuid}.jpg`（alt属性に名前） |

#### 新パターン: S活 (punycode domain)
- ドメイン: `www.xn--s-vp9b.com`（「s活」のpunycode）
- 画像: `img[src="spacer300x450.png"]` + 親要素の `style="background-image: url(/images/ml_11_1_{id}.jpg)"`
- 名前: `.name` クラスのテキスト（スペース含む → `replace(/\s+/g, '')` で正規化）

#### 新パターン: mirrors spa
- CMS: Panda系（`/photos/{lid}/main_{lid}.jpg` 形式だが実際はタイムスタンプ+UUID形式）
- 実際のURL: `photos/{lid}/{timestamp}-{uuid}.jpg`
- `img[src*="/photos/"][alt=名前]` で一括取得可能（altに名前が直接入っている）
- Storage ファイル名: `mirrors_{lid}.jpg`（lidがユニーク）

#### Chrome in Chrome 活用メモ（追記）
- `mcp__Claude_in_Chrome__tabs_context_mcp` で先にタブ確認→tabIdを取得してから操作
- `Control_Chrome` ツールとは別物。`Claude_in_Chrome` の方が安定

### 2026-06-03（続き）- 池袋・五反田エリア調査・LOVE LAND/OTONATIC/Lynx登録

#### 池袋・五反田 DB未登録チェック → `scripts/debug/check_ikebukuro_gotanda.mjs`
- 池袋TOP10・五反田TOP10を照合 → 未登録6店舗を特定
- 登録済みと判明: FioreSpa・フェアリーランド・エターナル・アネモネ・カシェット・五反田RELAX/ANNA/王様/THE HALF/A5 SPA/ラグタイム/Aroma ABC/レインズラプト/DAHLIA

#### 池袋・五反田 6店舗 登録完了

| 店舗 | shop_id | 人数 | スクリプト |
|------|---------|------|---------|
| LOVE LAND (ラブランド) | `tokyo_toshima_ikebukuro_loveland` | 48名 | `process_ikebukuro_shops.mjs` |
| OTONATIC (オトナチック) | `tokyo_toshima_ikebukuro_otonatic` | 3名追加（既存38名） | 同上 |
| Lynx (リンクス) 池袋店 | `tokyo_toshima_ikebukuro_lynx` | 16名追加（既存93名） | `process_lynx.mjs` |
| Lynx (リンクス) 五反田店 | `tokyo_shinagawa_gotanda_lynx` | 76名追加（既存8名） | `process_lynx.mjs` |

#### 新パターン: LOVE LAND (caskan.com CMS)
- セラピストURL: `https://love-land.jp/therapist/{castId}`
- 画像URL: `https://cdn2-caskan.com/caskan/img/cast_tmb/{timestamp}_{castId}.{ext}`（Tiggerと同パターン）
- comingsoon（写真なし）: `https://cdn2-caskan.com/caskan/img/comingsoon.png`
- Storage filename: `loveland_{castId}.jpg`

#### 新パターン: OTONATIC (mens-esthe-salon.net)
- セラピストURL: `https://www.mens-esthe-salon.net/therapist.cgi?cast={castId}`
- 画像URL: `https://www.mens-esthe-salon.net/schedule/img/{castId}/1_t.jpg`（castIdから予測可能）
- ノイズcastId: 189, 135, 31, 201, 202, 105, 106（コースバナー・割引枠）

#### 新パターン: Lynx (esthe-lynx-*.com)
- 池袋: `https://esthe-lynx-ikebukuro.com/therapist-list/`（JS lazy loading）
- 五反田: `https://esthe-lynx-gotanda.com/therapist-list/`（画像はsrc属性で取得可能）
- 池袋の画像: `data-src` 属性に `https://admin.esthe-lynx-ikebukuro.com/photos/{id}-{ts}.{ext}`
- 五反田の画像: `src` 属性に `https://admin.esthe-lynx-gotanda.com/photos/{id}-{ts}.{ext}`
- Storage filename: `lynxike_{therapistId}.jpg` / `lynxgot_{therapistId}.jpg`
- グループ店舗: 池袋・新宿・高田馬場・赤羽・五反田・秋葉原・大宮・川口・松戸・船橋・千葉・横浜

### 2026-06-03（続き2）- 麻布十番・六本木エリア調査・CAMERON/デジャヴ東京/Spa Lanikai登録

#### 麻布十番・六本木 DB未登録チェック → `scripts/debug/check_roppongi_azabu.mjs`
- TOP10中4店舗が未登録: CAMERON・デジャヴ東京・sweetrain・Spa Lanikai
- sweetrain: セラピスト情報が非公開のためスキップ
- デジャヴ東京: 175名が既存（以前のセッションで登録済み）、25名追加

#### 麻布十番・六本木 3店舗 登録完了 → `scripts/maintenance/process_azabu_shops.mjs`

| 店舗 | shop_id | 人数 | 画像パターン |
|------|---------|------|------------|
| CAMERON (キャメロン) | `tokyo_minato_azabujuban_cameron` | 85名 | `cameron-esthe.net/vars/imgs/profiles/{id}/prof_thumb_1_s.jpg` |
| デジャヴ東京 | `tokyo_minato_nishiazabu_dejavu_tokyo` | 25名追加（175名既存） | `/photos/{lid}/raw_{lid}.jpeg`（LEON SPAと同パターン） |
| Spa Lanikai | `tokyo_minato_azabujuban_spa_lanikai` | 72名 | `/photos/{lid}/raw_{lid}.jpeg` |

#### 新パターン: CAMERON (cameron-esthe.net)
- セラピスト一覧: `/model/`
- 画像URL: `https://cameron-esthe.net/vars/imgs/profiles/{profileId}/prof_thumb_1_s.jpg`
- 写真なし: `prof_thumb.jpg`（IDなしのデフォルト画像）
- 名前・profileIdはページのimg src・altから取得

### 2026-06-03（続き3）- 秋葉原・上野エリア調査・NEW+PLUS/G+Style/Beyond登録

#### 秋葉原・上野 DB未登録チェック → `scripts/debug/check_akihabara_ueno.mjs`
- 秋葉原TOP10: NEW+PLUS(1位)・G+Style(2位)・必殺あきば娘・AROMA AMOUR・Aroma TT・Raiseが未登録
- 上野TOP10: Beyond(3位)・色気あるワイフ・Louis・ASOBI・ELECTRIC LODGEが未登録

#### 秋葉原2店舗 登録完了 → `scripts/maintenance/process_akihabara_shops.mjs`

| 店舗 | shop_id | 人数 | 画像パターン |
|------|---------|------|------------|
| NEW+PLUS (ニュープラス) | `tokyo_chiyoda_akihabara_new_plus` | 108名 | `oplus-bucket-prod.s3.amazonaws.com/uploads/therapist_image/image1/{imgId}/{uuid}.jpg` |
| G+Style (ジースタイル) | `tokyo_chiyoda_akihabara_gstyle` | 33名 | `fstyle-bucket-prod.s3.amazonaws.com/uploads/therapist_image/image1/{imgId}/{uuid}.jpg` |

#### 新パターン: o-plus.site / g-style-akihabara.site CMS
- 両店とも同じCMSを使用（フォーム構造・S3バケット名が異なる）
- セラピスト一覧: `/therapist`（JS lazy loading）
- 画像: `img[data-src*="fstyle-bucket"]` または `img[data-src*="oplus-bucket"]`
- `.item.clearfix` 要素から `.querySelector('h3')` で名前、`img[data-src]` で画像URL取得
- urlId（URL内のID）とimgId（S3パス内のID）は別物→個別に取得が必要

### 2026-06-03（続き4）- 秋葉原・上野 残り店舗登録

#### 秋葉原・上野 追加登録完了 → `scripts/maintenance/process_ueno_shops.mjs`

| 店舗 | shop_id | 人数 | 備考 |
|------|---------|------|------|
| ASOBI (アソビ) | `tokyo_taito_ueno_asobi` | 16名 | caskan.com CMS |
| 必殺あきば娘 | `tokyo_chiyoda_akihabara_akibadoll` | shop登録のみ | JS描画でセラピスト取得不可 |
| AROMA AMOUR | `tokyo_chiyoda_akihabara_aroma_amour` | 53名 | 以前のセッションで登録済み |

#### 未登録のまま残っている店舗（Chrome/追加作業が必要）

| 店舗 | ランキング | 理由 |
|------|-----------|------|
| Aroma TT | 秋葉原9位 | 80名以上、画像URL不明 |
| 色気あるワイフ | 上野4位 | 大量、熟女系、Chrome必要 |
| ELECTRIC LODGE | 上野9位 | ドライヘッドスパ専門（優先度低） |

### 2026-06-05 - 秋葉原・上野 Raise/Louis/Beyond 登録

#### 完了済み（前セッション引き継ぎ）
- Raise (秋葉原10位) 17名 → `process_raise.mjs`（WordPress wp-content/uploads、Referer付き）

#### 登録完了

| 店舗 | shop_id | 人数 | スクリプト |
|------|---------|------|-----------|
| Louis (ルイス) | `tokyo_taito_ueno_louis` | 37名 | `process_louis.mjs` |
| BEYOND (ビヨンド) | `tokyo_taito_ueno_beyond` | 20名 | `process_beyond.mjs` |

#### 新パターン: imgsrv.jp CDN (Louis)
- URL: `https://imgsrv.jp/shop/57/lady/{hash}.jpg`（hashはユニーク）
- alt: `【上野メンズエステ Louis（ルイス）】名前`
- nowprinting（写真なし）: `https://imgsrv.jp/shop/57/nowprinting/{hash}.jpg` → null扱い
- Storage ファイル名: `louis_{hash}.jpg`
- 公式URL: `https://ueno-louis.com/`（`louis-ueno.com` ではない）

#### Beyond (ビヨンド) スクレイピングパターン
- 公式URL: `https://uroom-esthe.com/`（`beyond-ueno.com` ではない）
- WordPress lazy loading: `img[data-src*="wp-content"]` + alt=名前
- 画像URL: `https://uroom-esthe.com/wp-content/uploads/{roman}_{date}_{n}_300_450.jpg`
- Referer付きでStorage移行が必要
- Storage ファイル名: `beyond_{roman}` （ローマ字部分、日付前まで）

### 2026-06-06（続き2）- 錦糸町 追加6店舗登録

#### 登録完了 → `scripts/maintenance/process_kinshicho_remaining.mjs`

| 店舗 | shop_id | 人数 | 画像パターン |
|------|---------|------|------------|
| High Time Spa (ハイタイムスパ) | `tokyo_sumida_kinshicho_hightime_spa` | 83名 | `/photos/{lid}/moto_{lid}.jpg` |
| COCONA GRAN (ここなグラン) | `tokyo_sumida_kinshicho_cocona_gran` | 103名 | `/photos/{lid}/moto_{lid}.jpg` |
| Neo MIYABI (ネオ雅) | `tokyo_sumida_kinshicho_neo_miyabi` | 42名 | `/images/gals/{filename}` |
| 撫子 (なでしこ) | `tokyo_sumida_kinshicho_nadeshiko` | 28名 | `/girl/{obfuscatedDir}/{obfuscatedFile}.jpg` |
| Aroma Fairy (アロマフェアリー) | `tokyo_sumida_kinshicho_aroma_fairy` | 78名 | `/vars/imgs/profiles/{pid}/prof_thumb_1_s.jpg` |
| LUXUE (ラグジュエ) | `tokyo_sumida_kinshicho_luxue` | 49名 | `/photos/{lid}/moto_{lid}.jpg` |

#### 新パターン: 撫子 (k.owl-nadeshiko.com)
- セラピストページ: `/staff.html`
- 画像URL: `/girl/{ランダム6文字ディレクトリ}/{ランダム6文字ファイル}.jpg`（obfuscated）
- 名前はalt属性ではなく親要素のtextContentから取得（最大5階層上まで探索）
- `T.XXXcm`・`(年齢)` サフィックスを除去。`新人`・`S` プレフィックスも除去
- Refererなしで取得可能

#### 新パターン: Neo MIYABI (neo-miyabi.com)
- セラピストページ: `/therapist/`
- 画像: `img[src="spp.png"]`（プレースホルダー）+ 親要素の `style="background-image: url(/images/gals/{gId}_{timestamp}.{ext})"`
- `img[alt*="セラピスト"]` のalt属性から名前取得。`Neo MIYABI ネオ雅 セラピスト ` プレフィックスを除去
- 名前に `5/26初出勤` 等の日付サフィックスが混入 → スクリプト内でハードコード時に除去済み
- schedule_url未設定（サイトに専用ページ確認できず）

#### Aroma Fairy / COCONA GRAN / LUXUE / High Time Spa
- Aroma Fairy: CAMERONと同パターン（`/vars/imgs/profiles/{pid}/prof_thumb_1_s.jpg`）
- COCONA GRAN・LUXUE・High Time Spa: `/photos/{lid}/moto_{lid}.jpg`（Garden SPA・LEON SPA系と同一CMS）
- schedule_url: COCONA GRAN=`/schedule`、LUXUE=`/schedule`、Aroma Fairy=`/schedules/`、High Time Spa=homepage

---

### 2026-06-06（続き3）- 中野・高円寺 6店舗登録

#### 登録完了 → `scripts/maintenance/process_nakano_koenji_shops.mjs` + `fix_jj_roomone.mjs`

| 店舗 | shop_id | 人数 | 画像パターン |
|------|---------|------|------------|
| Salvador (サルバドール) | `tokyo_nakano_nakano_salvador` | 32名 | `/data/staff/{sid}/stf_{hash}.jpg` (PREMIUM SPA CMS、動的取得) |
| Spaflame (スパフレイム) | `tokyo_suginami_koenji_spaflame` | 54名 | `/image_girl/{gid}/01.jpg` |
| JJ (ジェイジェイ) 中野店 | `tokyo_nakano_nakano_jj` | 17名 | `/images/gals/{castId}-7-{ts}.jpg` (動的取得) |
| Room one (ルームワン) | `tokyo_suginami_koenji_room_one` | 17名 | `/koenji/gazou/{folder}/{file}.jpg` |
| マダムの楽園 | `tokyo_suginami_koenji_madam_rakuen` | 31名 | `/images_staff/{sid}/01_{ts}.jpg` |
| Allie (アリー) 高円寺店 | `tokyo_suginami_koenji_allie` | 47名 | `/therapist_img/{tid}_1.webp` |

#### 新パターン: Spaflame (`/image_girl/{gid}/01.jpg`)
- セラピスト一覧: `https://spa-flame.com/therapist/`
- 画像: `img[src*="/image_girl/"]` の srcパターン。gidはURLの数字
- 名前: 親要素テキストから「○○さん 42歳 身長...」→「さん」以前を抽出

#### 新パターン: JJ (`/images/gals/{castId}-7-{timestamp}.jpg`)
- セラピスト一覧: `https://www.spa-jj.tokyo/cast.html`
- 名字のみ・年齢・スリーサイズが記載された熟女系サイト
- 動的取得: castIdごとにURLを正規表現で抽出、名前は別途ハードコード

#### 新パターン: Room one (`aroma-yuim.com` 独自フォルダ構成)
- セラピスト一覧: `https://www.aroma-yuim.com/koenji/staff.html`
- 画像: `/koenji/gazou/{フォルダ}/{ファイル名}.jpg`（フォルダ名がローマ字読み）
- 一部画像は `/koenji/gazou/` 配下にないパスで404 → `fix_jj_roomone.mjs` で代替パスを試して修正

#### 新パターン: Allie (`/therapist_img/{tid}_1.webp`)
- セラピスト一覧: `https://allie-kichijoji.jp/therapist/`
- 吉祥寺・高円寺の2エリア合算サイト。高円寺ランキング10位として登録
- 画像: `img[src*="/therapist_img/"][alt]` → tidはsrcの数字部分

---

### 2026-06-06（続き4）- 吉祥寺・三鷹 8店舗登録

#### 登録完了 → `scripts/maintenance/process_kichijoji_shops.mjs` + `fix_aroma_ella.mjs`

| 店舗 | shop_id | 人数 | 画像パターン |
|------|---------|------|------------|
| Yorimichi (よりみち) | `tokyo_musashino_kichijoji_yorimichi` | 130名 | `/optImg/{id}/item/{itemId}/{hash}_640_0.jpg` (Mirajour CMS、動的取得) |
| moshimo... (もしも) | `tokyo_musashino_kichijoji_moshimo` | 33名 | `/data/staff/{sid}/stf_{hash}.webp` (PREMIUM SPA CMS) |
| ROOKIE (ルーキー) 三鷹 | `tokyo_mitaka_mitaka_rookie` | 20名 | `/upload/cast/thumb_{id}.jpg` |
| まろん 吉祥寺ルーム | `tokyo_musashino_kichijoji_marron` | 51名 | caskan.com CDN (動的取得) |
| エステ美人マダム 三鷹 | `tokyo_mitaka_mitaka_esthe_madamu` | 7名 | 名前のみ（画像非公開） |
| APEX (エイペックス) | `tokyo_musashino_kichijoji_apex` | 16名 | caskan.com CDN (動的取得) |
| Aroma ELLA (アロマエラ) | `tokyo_mitaka_mitaka_aroma_ella` | 30名 | S3バケット (`aromaella-bucket-prod.s3-ap-northeast-1.amazonaws.com`) |
| Mspa (エムスパ) | `tokyo_musashino_kichijoji_mspa` | 74名 | `/data/staff/{sid}/stf_{hash}.jpg` (PREMIUM SPA CMS) |

#### 新パターン: ROOKIE (`/upload/cast/thumb_{id}.jpg`)
- セラピスト一覧: `https://rookie-esthe.com/cast/`
- `img[alt*="ROOKIE "]` のaltから名前取得、srcからcastId取得
- 三鷹・吉祥寺・武蔵小金井の複数ルームを1店舗として登録

#### 新パターン: Aroma ELLA (S3バケット)
- セラピスト一覧: `https://aroma-ella.com/therapist`
- 画像: `img[src*="aromaella-bucket-prod.s3"]` → imgId（連番）でStorage保存
- 名前はページテキストから順番通りに対応付け（Chromeで手動取得）
- 動的取得スクリプトが失敗したため `fix_aroma_ella.mjs` でハードコード登録

#### Mspa 注意事項
- 同名セラピスト「るる」が2名（sid=48・sid=47）→「るる」「るる2」で区別
- ノイズプレフィックス（「おすすめ」「スレンダ」「急上昇」「癒し系」等）をスクロール後のDOMから除去

---

### 2026-06-06 - 中野・三軒茶屋・錦糸町 4店舗登録

#### 登録完了

| 店舗 | shop_id | 人数 | 状態 |
|------|---------|------|------|
| Lucky Cat (ラッキーキャット) | `tokyo_nakano_nakano_lucky_cat` | 90名 | ✅ 完了 |
| ADAMAS (アダマス) | `tokyo_nakano_nakano_adamas` | 24名 | ✅ 完了（画像修正済み） |
| エルドラド | `tokyo_setagaya_sangenjaya_eldorado` | 118名 | ✅ 完了（画像修正済み） |
| Garden SPA (ガーデンスパ) | `tokyo_sumida_kinshicho_garden_spa` | 110名 | ✅ 完了 |

#### ADAMAS 画像修正（完了）
- 原因: wp-content/uploadsのURLに年月フォルダ（`/2025/08/`等）が欠落していた（404）
- Chrome in Chrome で a-adamas.com/cast/ から正しいURLを取得・`fix_adamas_images.mjs` で24名全員更新完了

#### エルドラド 画像修正（完了）
- caskan.com CDNはキャスト写真更新時にタイムスタンプが変わるため一部URLが404になっていた
- Chrome in Chrome で `https://eldorado-esthe.com/therapist`（`/cast/` は404）から118名の最新URLを取得
- `fix_eldorado_images.mjs` で37名null→写真付きに更新完了（スキップ81・更新37・エラー0）

---

### 2026-06-05（続き）- 新宿・高田馬場・荻窪 大量登録

#### 登録完了

| 店舗 | shop_id | 人数 | スクリプト |
|------|---------|------|-----------|
| CorCaroli (コルカロリ) | `tokyo_shinjuku_higashishinjuku_corcaroli` | 24名 | `process_shinjuku_shops.mjs` |
| Aroma Jewels (アロマジュエルズ) | `tokyo_shinjuku_shinjuku_aroma_jewels` | 20名 | `process_shinjuku_shops.mjs` |
| a l'aise SK 荻窪 | `tokyo_suginami_ogikubo_alaise_sk` | 40名 | `process_alaise_sk.mjs` |
| a l'aise SK 高田馬場 | `tokyo_shinjuku_takadanobaba_alaise_sk` | 5名 | `process_alaise_sk.mjs` |
| GRAND CHARIOT (グランシャリオ) | `tokyo_shinjuku_takadanobaba_grand_chariot` | 27名 | `process_grand_chariot.mjs` |
| Ogi Spa (オギスパ) | `tokyo_suginami_ogikubo_ogi_spa` | 76名 | `process_ogispa.mjs` |
| Aroma Mrs (アロマミセス) | `tokyo_shinjuku_takadanobaba_aroma_mrs` | 123名 | `process_aroma_mrs.mjs` |

#### 未登録のまま残っている店舗

**荻窪**: 熟的 (5位) は公式サイト不明のためスキップ
**画像修正**: Casablanca 18名・R,s SPA 一部・メンエス大井町一部・Rose Aroma Spa 一部・Jewelry 一部 がホットリンク保護でnull登録 → fix スクリプト要

#### 登録済み（高田馬場・荻窪・品川 追加分）

| 店舗 | shop_id | 人数 | スクリプト |
|------|---------|------|-----------|
| R,s SPA | `tokyo_shinjuku_takadanobaba_rsspa` | 48名 | `process_takadanobaba_ogikubo_shops.mjs` |
| 高田馬場ナースクリニック | `tokyo_shinjuku_takadanobaba_nurse_clinic` | 30名(null) | 同上 |
| Casablanca | `tokyo_suginami_ogikubo_casablanca` | 18名(null) | 同上 |
| Natural SPA | `tokyo_suginami_ogikubo_natural_spa` | 17名 | 同上 |
| SPA LOUNGE | `tokyo_shinagawa_oimachi_spa_lounge` | 8名(null) | 同上 |
| メンエス大井町 | `tokyo_shinagawa_oimachi_mensesthe` | 51名 | `process_shinagawa_shops.mjs` |
| Rose Aroma Spa | `tokyo_shinagawa_oimachi_rose_aroma_spa` | 44名 | 同上 |
| HANA SPA | `tokyo_shinagawa_oimachi_hana_spa` | 41名 | 同上 |
| Mの扉 | `tokyo_shinagawa_shinagawa_m_door` | 3名(null) | 同上 |
| SPA Secret House | `tokyo_shinagawa_oimachi_spa_secret_house` | 23名 | 同上 |
| evergreen (エバーグリーン) | `tokyo_shinjuku_takadanobaba_evergreen` | 23名(null) | `process_ogikubo_remaining.mjs` |
| SENZSPA (センズスパ) | `tokyo_suginami_asagaya_senzspa` | 29名 | 同上 |
| Jewelry (ジュエリー) | `tokyo_suginami_ogikubo_jewelry` | 27名 | 同上 |

#### 新パターン: Aroma Mrs (/therapist/up_img/{id}_1.jpg)
- セラピストページ: `/therapist.php`（名前はinnerTextの日本語行・IDはリンクの順序と対応）
- 画像URL: `/therapist/up_img/{id}_1.jpg`（idはセラピスト個別ページのクエリパラメータ）
- 125名（退職者含む）、ID範囲: 2〜278

#### 新パターン: Ogi Spa (/img/uploadfile/imgpc{timestamp}.{ext})
- セラピストページ: `/therapist.html`
- `img[src*="uploadfile"][alt]` で名前+画像URL一括取得
- ファイル名がタイムスタンプ形式でユニーク（jfif拡張子も存在）
- Storage key: `ogispa_{filename_without_ext}`

#### a l'aise SK ルーム分け方法
- 公式: `https://a-laise-sk.com/` / セラピスト: `/casts/`
- 5ルーム（荻窪北口/荻窪南口/荻窪FC/中野/高田馬場）を1つの荻窪・1つの高田馬場として登録
- ルーム特定: `/schedule/?works=YYYY-MM-DD` を10日分fetchして集計
- 一部画像は旧UUID形式（404）→ null登録

#### 新パターン: GRAND CHARIOT (スペーサー+background-image)
- `img[alt*="さんの写真"]` + style="background-image: url(/images/ml_11_1_{id}.jpg)"
- Storage key: `chariot_{id}`（idがユニーク）
