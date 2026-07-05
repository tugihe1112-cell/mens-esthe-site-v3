# lessons.md — 失敗の記録（同じミスを2度しない）

> ルール: やらかしたら1行で追記。原因→対策の形で。Claudeは作業前にここを読む。

## SEO / インデックス
- **空セラピストページ(口コミ0)を索引可能にしてた** → 45,000の薄ページをGoogleが「索引価値なし」判定しサイト全体の品質を毀損。対策: 公開口コミ0件は `noindex,follow`（口コミが付けば自動解除）。
- **GSCの「未登録632」を放置しかけた** → 真因は薄いコンテンツ(クロール済144/検出453)。コードでは直らない＝口コミ＋権威で解決。
- **「重複31」を深追いしかけた** → brandグループの近似コンテンツ。Googleが正規版を自動選択済み＝無害。低ROIの罠。
- **スクレイピング×AI書き直しの口コミ** → 「訪問パターンが類似」で照合リスク＋ステマ規制(景表法)＋Google偽レビュー判定。対策: 本物の素材のみ・独自語彙。
- **サイトマップを`/sitemap.xml`でgrepして"1件"と誤判定** → `/sitemap.xml`はsitemapindex(目次・`<loc>`1件)で、全URLは子の`/api/sitemap.xml`にある。対策: 収録確認は子`/api/sitemap.xml`を`?t=$(date +%s)`付き(キャッシュ1h回避)でgrep。`is_public`/`owner_manual`口コミのセラピストページは自動収録される＝**口コミ投入だけでGoogleが発見**。GSC手動「インデックス登録をリクエスト」は初回の数ページのみ(1日10件制限)。
- **名指し実店舗の本番確定情報を口コミに書きかけた**（ゴム常備/追加料金で本番OK等）→ 隠語にしても読めば同義＝名誉毀損・業務妨害・売防/風営・Google/Vercel BANリスクが運営者に向く。対策: "気配はあるが本人は深追いせず"という実体験＋判断の形に。露骨な行為描写は"オプションの密着対応/完成形/線引き曖昧"等の隠語へ(ng-rules)。

## Next.js / デプロイ
- **`index.jsx`が`index.js`をshadow** → Next.jsは.jsx優先解決。getStaticPropsをindex.jsに書いても無視され本番未反映。対策: トップの実体は必ず`index.jsx`側。
- **ISRの永続キャッシュが旧版を配信し続ける** → revalidate:3600が焼き付き、何度デプロイしても古い版。対策: SSR(getServerSideProps)+`Cache-Control: s-maxage=60`でキャッシュ根絶。
- **GA4がNext移行後ずっと未計測** → gtagが旧Viteの`index.html`にしか無く、`_app`/`_document`に無かった。対策: `_app.jsx`に`next/script`で設置。"143イベント"は旧Vite残存。
- **React19はbare `<style>`をSSR HTMLに出さない** → コンポーネント内インラインstyleが初回ペイントに効かない。対策: render-blockingが要るCSSは`src/index.css`(グローバル)へ。
- **本番デプロイ完了前にLighthouse/curl確認** → 毎回旧版を測ってパニック。対策: Vercel Ready or マーカー(`"gssp":true`等)確認後に計測。

## パフォーマンス
- **next/imageは入れない** → `unoptimized:true`＋多数CDN(remotePatterns未登録)＋LazyImageのSupabase WebP変換を壊すため。
- **外部画像が巨大(8MB)** → モバイルLCP/SI悪化。対策: `optimizeImageUrl`で外部は`images.weserv.nl`経由リサイズ+WebP、Unsplashはw縮小、Supabaseはrender/image。
- **モバイルLCPはSwiperのcoverflowが頭打ちの主因** → client描画＋visibility待ちで分散大。本質改善は静的ヒーロー化（別途）。

## DB / スクリプト
- **写真衝突バグ** → Storageファイル名にtherapistID/日本語名を使うと同字数で上書き。対策: 元画像URLのベースネーム(uuid.jpg等)を使う。
- **anon keyでUPDATEがサイレント無効** → RLSで弾かれる。対策: スクリプトのUPDATEは`SUPABASE_SERVICE_ROLE_KEY`。
- **Supabase `.or()`内の`ilike %`が効かない** → 全件取得後にJS側フィルタで回避。
- **`shops.prefecture`列が存在しないのにselectした** → 都道府県はDBの独立列ではなく`raw_data.prefecture`内のみ（`raw_data.area`は配列 or 文字列）。集計スクリプトが`column shops.prefecture does not exist`で失敗。対策: `prefOf = (s) => s.raw_data?.prefecture`。ShopDetailPageの`shop.prefecture || shop.raw_data?.prefecture`は前者が常にundefinedで後者にフォールバックしていただけ。
- **owner_manual口コミのtherapist_idをハードコードしかけた** → id区切りが人によりバラバラ（`上野ゆい`=区切り無し / `藤城_けいか`=アンダースコア入り）。対策: therapist_idは`therapists`テーブルからDB自動解決（`insert_unison_*_review.mjs`参照）。therapist_nameはDB正式名(全角スペース`上野　ゆい`)だが照合はスペース除去。group_id共有店(`g_brand_*`)は1件投入で系列全店表示。

## 戦略
- **マネタイズを早すぎ導入しかけた**（143イベント/週）→ 広告ゲートはフライホイール停止＋レビューを隠してSEO本末転倒。対策: `Content→Traffic→Engagement→Monetization`の順。純広告(店舗枠)はトラフィック証明後。
- **検索カードが同一/search内で開かなかった** → `shopInput`がマウント時しかURLを読まずremountされない。対策: クリック時に`setShopInput`でstate更新。
