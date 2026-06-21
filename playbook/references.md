# references.md — 参考事例・お手本（「こういうの作って」を一瞬で）

> 良い型・正解例を貯める場所。指示はここを指して「これに沿って」で済む。

## スクリプトの標準型（DB操作）
```js
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
// ⚠️ UPDATE/INSERTは必ず service role（anon keyはRLSでサイレント無効）
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const DRY = process.argv.includes('--dry-run');   // --dry-run対応が基本
```

## 口コミの構成テンプレ（本物の素材を、この器に入れる）
- **700字以上**（自動公開＆閲覧権付与トリガーの条件）
- 構成: 【入店】→【ご対面】→【施術】→【総評】
- 各回で**訪問動機・語彙・エピソードを変える**（類似回避 → ng-rules.md）
```
【入店】立地/内装/清潔感/香り・音/第一印象
【ご対面】登場/見た目の印象/会話/気遣い/緊張のほぐれ方
【施術】コース/流れ/技術の丁寧さ・強弱/要望対応/時間配分
【総評】総合満足度/どんな人向きか/コスパ/再訪意向
```
- `detailed_ratings = { cleanliness, looks, style, service, massage, intimacy }`（各1-5）
- `tags`: UI白リストから2-5個（→ ng-rules.md / glossary.md）
- `user_id`: `owner_manual`（即公開扱い）

## 挿入レコードの型（reviewsテーブル）
```js
{ id, shop_id, therapist_id, therapist_name,
  user_id: 'owner_manual', user_name: '常連', rating: 1-5,
  course: '60分6000円' など, detailed_ratings: {...}, tags: [...], content: '本文' }
```

## GSC需要分析の手順（再現可能）
1. 検索パフォーマンス → クエリ/ページ を3か月でCSVエクスポート
2. 意図分類（店名/エリア/ブランド/汎用/韓国語）＋順位帯分布
3. 機会スコア = 表示 ×（3位想定CTR − 現順位CTR）でページを順位付け
4. 「表示多×順位4-20」＝口コミ投入の最優先（例: unison_spa, kokoronoyurikago）
- スクリプト: `outputs_gsc_analyze.py`（リポジトリ直下）

## 画像最適化の型
- `src/utils/imageUrl.js` の `optimizeImageUrl(src,width)`：Supabase=render/image・Unsplash=w縮小・その他外部=`images.weserv.nl`経由（fail時は元URLにfallback）

## スクレイピングのパターン集
- 各CMS（images_staff / photos / wcms / caskan / Cloudflare Images 等）の取得パターンは **CLAUDE.md「スクレイピングパターン集」** を参照。
