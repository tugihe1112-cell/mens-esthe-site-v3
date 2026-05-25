# mens-esthe-site — Technical Briefing

> エンジニア向け引き継ぎ資料。コードベース全体の設計・現状・注意点を網羅する。

---

## 1. プロジェクト概要

メンズエステ店舗の情報ポータルサイト。いわゆる「エンエスme」的なポジション。

- 全国 **586店舗**、総セラピスト数 **数千名** のデータを保有
- 店舗詳細・セラピスト一覧・口コミ・出勤スケジュール埋め込みを提供
- ユーザーはお気に入り・閲覧履歴・口コミ投稿が可能
- 有料プラン（premium / vip）でロック解除される機能あり

---

## 2. 技術スタック

| レイヤー | 技術 |
|----------|------|
| フロントエンド | React 18 + Vite + Tailwind CSS |
| バックエンド / DB | Supabase（PostgreSQL + Storage + Auth） |
| デプロイ | Vercel |
| スタイル | Tailwind CSS（dark theme、slate-950ベース） |
| OGP / SEO | react-helmet-async |
| ルーティング | react-router-dom v6 |

ローカル起動: `npm i && npm run dev`

---

## 3. ディレクトリ構成

```
src/
├── App.jsx                  # ルーティング定義（全ルートはここ）
├── main.jsx
├── pages/                   # ページコンポーネント
│   ├── Home.jsx             # トップページ
│   ├── SearchPage.jsx       # キャスト検索（Supabase直接クエリ）
│   ├── ShopListPage.jsx     # 店舗一覧
│   ├── ShopDetailPage.jsx   # 店舗詳細（最重要・最大コンポーネント）
│   ├── ThreadDetailPage.jsx # セラピスト個別ページ（"thread"は旧称）
│   ├── RankingPage.jsx      # ランキング
│   ├── BrandPage.jsx        # ブランド（チェーン）ページ
│   ├── MyPage.jsx           # マイページ
│   └── ...（認証・法律系ページ等）
├── components/
│   ├── BottomNav.jsx        # スマホ用フローティングナビ
│   ├── Header.jsx
│   ├── SeoHead.jsx          # OGP / titleタグ管理
│   ├── LazyImage.jsx        # 遅延読み込み画像
│   ├── PrefectureSelector.jsx # 都道府県フィルタ
│   └── ui/                  # 汎用UIパーツ
├── contexts/
│   ├── DataContext.jsx      # 全店舗データの中央管理（最重要）
│   └── AuthContext.jsx      # Supabase Auth + プラン管理
├── context/
│   └── AppContext.tsx       # お気に入り・閲覧履歴等のUIステート
├── features/
│   └── ranking/             # ランキング機能（hooks + components）
├── utils/
│   └── shopHelpers.js       # getDisplayName等のユーティリティ
└── _archive/                # 使っていない旧ファイル群（削除不要）

scripts/
├── debug/                   # DB調査用（読み取り専用）
└── maintenance/             # DB更新スクリプト群
    └── *.mjs

.env                         # VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY（Git管理外）
```

---

## 4. データベース設計

### `shops` テーブル

最重要テーブル。全カラムを直接使うのではなく `raw_data` JSON に旧データが混在している点に注意。

```
id            TEXT PRIMARY KEY   例: "tokyo_shinjuku_orenoie"（都道府県_エリア_店名）
name          TEXT               表示名 例: "俺の家（梅田店）"
group_id      TEXT               ブランドグループID 例: "g_brand_ryugujo"
website_url   TEXT               公式サイトURL
schedule_url  TEXT               出勤スケジュールページURL（iframe埋め込み用）
image_url     TEXT               サムネイル画像URL
raw_data      JSONB              旧構造のデータを格納（prefecture, city, area等）
```

**重要**: `prefecture` / `city` / `area` は `raw_data` の中に入っている。
フロントでは `shop.raw_data?.prefecture` または DataContext でマージ済みの `shop.prefecture` を使う。

**group_id の命名規則**:
- `g_brand_{ブランド名}` — 複数店舗のチェーン（例: `g_brand_ryugujo`）
- `g_solo_{shop_id}` — 単独店舗

### `therapists` テーブル

```
id            TEXT PRIMARY KEY   例: "tokyo_shinjuku_orenoie_さくら"
shop_id       TEXT               shops.id への外部キー
name          TEXT               セラピスト名
image_url     TEXT               写真URL（Supabase Storage または元サイトURL）
raw_data      JSONB              age / T（身長）/ types（タグ）等
```

**重要**: セラピスト写真はホットリンク保護サイトの場合 Supabase Storage（`therapist-images` バケット）に移行済み。Storage URL: `azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/therapist-images/...`

### `reviews` テーブル

```
shop_id       TEXT
therapist_id  TEXT（nullable）
rating        INTEGER
content       TEXT
user_id       UUID（Supabase Auth）
```

### `profiles` テーブル

```
id            UUID（auth.users.id）
plan          TEXT  "free" | "premium" | "vip"
image_url     TEXT
```

---

## 5. フロントエンドアーキテクチャ

### データフロー

```
Supabase
  ↓
DataContext（DataProvider）    ← アプリ起動時に全店舗を一括取得・キャッシュ
  ↓
useShopData() hook             ← 各ページがこれで店舗データを取得
  ↓
各ページコンポーネント
  ↓（店舗詳細・セラピストは遅延取得）
Supabase直接fetch              ← ShopDetailPage / SearchPageはSupabase REST APIを直叩き
```

**DataContext の設計意図**:
- 初回に全586店舗の基本情報（id, name, image_url, group_id 等）を一括取得してメモリキャッシュ
- セラピスト・口コミは「その店舗を開いた時」に遅延取得（`loadTherapistsForShop`）
- `shopById` / `therapistById` の Map で O(1) アクセス

### ShopDetailPage の特殊設計

最も複雑なコンポーネント。以下の点に注意:

1. **DataContext は「保険」**: `cloudShop` という state に Supabase から直接取得したデータを入れて使う。DataContext のデータはフォールバック用。
2. **group_id による系列店統合**: 系列店の全セラピスト・口コミをまとめて表示（例: 竜宮城全5店舗のキャストを1ページで見られる）
3. **タブ構成**: トップ / キャスト / 口コミ / 出勤（schedule_urlがある場合のみ）
4. **出勤タブ**: `schedule_url` を iframe で埋め込み。X-Frame-Options: SAMEORIGIN のサイト（約2件）は表示されないためフォールバックボタンあり。

### SearchPage の設計

- キーワード入力 → 300ms デバウンス → Supabase に直接クエリ
- 都道府県名検索バグの対策: `PREFECTURE_NAMES` Set（47都道府県）を持ち、都道府県名で検索した場合は `prefecture` フィールドのみ照合（「宮城」で「竜宮城」がヒットしないように）
- タグフィルタ（BODY TYPE / ATMOSPHERE / AGE GROUP / ATTRIBUTES）はローカル処理

### ルーティング

```
/                        Home
/search                  SearchPage（?q=キーワード&tags=タグ1,タグ2 でURLパラメータ対応済み）
/shops                   ShopListPage
/shops/:shopId           ShopDetailPage
/shops/:shopId/threads/:threadId  ThreadDetailPage（セラピスト個別ページ）
/ranking                 RankingPage
/brands/:brandId         BrandPage
/mypage                  MyPage
/favorites / /history / /my-reviews
/login / /register
/legal / /terms / /privacy
/premium                 PremiumPage（有料プラン案内）
```

---

## 6. 重要なユーティリティ

### `getDisplayName(name)` — `src/utils/shopHelpers.js`

店舗名から末尾の店舗サフィックスを除去して表示名にする。

```js
getDisplayName("Lynx 新宿店")      // → "Lynx"
getDisplayName("俺の家（梅田店）")  // → "俺の家"
```

DBには正式名称（サフィックスあり）を保持し、表示時だけこれを通す。検索はDB名で行うので精度に影響なし。

### `group_id` による系列店束ね

```js
// DataContext内
const getBrandShopIds = (shopId) => {
  const shop = shops.find(s => s.id === shopId);
  if (shop.group_id) {
    return shops.filter(s => s.group_id === shop.group_id).map(s => s.id);
  }
  return [shopId];
};
```

---

## 7. スクリプト体系

Node.js ESM（`.mjs`）で書かれた管理スクリプト群。**外部ネットワークが必要なため、Claude等のサンドボックスからは実行不可。必ずローカルターミナルで実行すること。**

### 共通パターン

```js
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));
```

- `--dry-run` フラグ対応が原則
- `scripts/debug/` → DBを読むだけ
- `scripts/maintenance/` → DBを更新する

### 主要スクリプト（現在有効なもの）

| スクリプト | 用途 |
|-----------|------|
| `debug/check_all_shops_status.mjs` | 都道府県別セラピスト登録状況確認 |
| `debug/find_schedule_urls.mjs` | schedule_url自動検出 |
| `maintenance/fix_missing_schedule_urls.mjs` | schedule_url一括設定 |
| `maintenance/fix_missing_shop_images.mjs` | shop画像OGP/ロゴから自動取得・設定 |
| `maintenance/fix_group_ids.mjs` | group_id統合（実行済み） |

---

## 8. 画像管理

### Supabase Storage (`therapist-images` バケット)

ホットリンク保護があるサイトの画像はStorageに移行済み。

```
therapist-images/
├── {prefix}_{fileName}.{ext}   # prefixは店舗略称
```

アップロード関数の標準実装は `scripts/maintenance/fix_ryugujo_images.mjs` の `uploadImage()` を参照。`Referer` ヘッダー付きfetch対応版。

### 注意事項

- WordPress の `/wp-content/uploads/` → ホットリンク保護あり → Storage移行が必要
- Cloudflare Images (`imagedelivery.net`) → token不要、`/member` variant指定
- Firebase Storage → `?alt=media&token=UUID` 形式。tokenなしでは403
- caskan.com CDN / re-db.com CDN → 認証不要のパブリックCDN

---

## 9. 認証・プラン

Supabase Auth（メールアドレス）を使用。

```
free    → 通常ユーザー
premium → 有料ユーザー（口コミ全表示等）
vip     → 最上位
```

`AuthContext` で `userPlan` を管理。`profiles` テーブルの `plan` カラムを参照。

---

## 10. 現在の既知の問題・TODO

### データ面
- `schedule_url` 未設定: 5店舗（No Brand: サイトダウン、他4件は手動確認要）
- `image_url` 未設定: No Brand 1件（サイトダウンのため取得不可）
- LIRICA OSAKA: セラピスト26件が写真なし（動画要素でJS描画のため取得不可）
- ミセスムーンR 兵庫: 8件退職者のため写真なし

### フロントエンド面
- SearchPage のフィルターカテゴリ名（BODY TYPE等）が英語のまま
- ShopDetailPage の「Total X」表示が英語
- スケルトンローディング未実装（現状はテキスト「読み込み中...」）
- お気に入り追加時のトースト通知未実装

### 実装できていない機能
- セラピスト個別ページからの「このセラピストの他店舗」動線
- 料金・コース情報の表示（DBに未登録の店舗多数）
- SNSシェアボタン

---

## 11. デプロイ

Vercel に接続済み。`main` ブランチへのプッシュで自動デプロイ。環境変数は Vercel ダッシュボードに設定済み（`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`）。

---

## 12. 注意事項まとめ

1. **JS描画サイトはcheerioで取得不可** → Claude in Chrome（ブラウザエージェント）が必要
2. **サンドボックスから外部ネットワーク不可** → スクリプトは必ずローカルで実行
3. **`therapist-images` バケットはSupabaseダッシュボードで手動作成が必要**（anon keyでは作成不可）
4. **`raw_data` に旧データが眠っている** → 新規カラムに値がなければ `raw_data->>xxx` を疑う
5. **shop_idは原則 `{都道府県}_{エリア}_{店名}` 形式** だが、旧データは数値ID（`60026` 等）が混在
6. **group_idで系列店を束ねる設計** → セラピスト・口コミは系列全店舗分が表示される仕様
