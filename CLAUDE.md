# mens-esthe-site — Claude引き継ぎドキュメント

新しいチャットを開いたら、まずこのファイルを読ませること。
これだけで作業の全文脈を即座に理解できる。

> **最終更新: 2026-05-21 （東京中央エリア口コミ一括スクレイピング・268件v2書き直し完了）**
> 作業がひと段落するたびに、Claudeがこのファイルを自動更新する。

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
| **東京都** | 竜宮城・QUEEN'S COLLECTION・CREST SPA・GRACE・Lunabelle・Candy Spa・ゴールデン中野・らんぷ北千住・First新宿・Assouplir秋葉原・癒しの空間ANNEX・Tigger・Weal秋葉原・NO BRAND銀座 完了。他店舗未着手 | `node scripts/debug/check_all_shops_status.mjs` |
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

---

## .env ファイル（要確認）

```
VITE_SUPABASE_URL=https://xxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

プロジェクトルートに配置。Gitには含まれていない（.gitignore済み）。

---

## 注意事項

- **JS描画サイト**はcheerioでは取得不可。Claude in Chromeブラウザ経由が必要
- サンドボックス（Claude側のbash）は外部ネットワーク不可。スクリプトはユーザーのターミナルで実行
- 画像URLがSupabase Storage（`azuetkuzzmshqfbrhqmf.supabase.co/storage/...`）になっていれば正常
- `therapist-images` バケットに画像アップロード済みの場合は `upsert: true` で上書き可
