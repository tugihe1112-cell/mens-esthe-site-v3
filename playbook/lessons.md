# lessons.md — 失敗の記録（同じミスを2度しない）

> ルール: やらかしたら1行で追記。原因→対策の形で。Claudeは作業前にここを読む。

## SEO / インデックス
- **空セラピストページ(口コミ0)を索引可能にしてた** → 45,000の薄ページをGoogleが「索引価値なし」判定しサイト全体の品質を毀損。対策: 公開口コミ0件は `noindex,follow`（口コミが付けば自動解除）。
- **GSCの「未登録632」を放置しかけた** → 真因は薄いコンテンツ(クロール済144/検出453)。コードでは直らない＝口コミ＋権威で解決。
- **「重複31」を深追いしかけた** → brandグループの近似コンテンツ。Googleが正規版を自動選択済み＝無害。低ROIの罠。
- **スクレイピング×AI書き直しの口コミ** → 「訪問パターンが類似」で照合リスク＋ステマ規制(景表法)＋Google偽レビュー判定。対策: 本物の素材のみ・独自語彙。

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

## 戦略
- **マネタイズを早すぎ導入しかけた**（143イベント/週）→ 広告ゲートはフライホイール停止＋レビューを隠してSEO本末転倒。対策: `Content→Traffic→Engagement→Monetization`の順。純広告(店舗枠)はトラフィック証明後。
- **検索カードが同一/search内で開かなかった** → `shopInput`がマウント時しかURLを読まずremountされない。対策: クリック時に`setShopInput`でstate更新。
