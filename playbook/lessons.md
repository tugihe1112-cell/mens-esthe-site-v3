# lessons.md — 失敗の記録（同じミスを2度しない）

> ルール: やらかしたら1行で追記。原因→対策の形で。Claudeは作業前にここを読む。

## SEO / インデックス
- **空セラピストページ(口コミ0)を索引可能にしてた** → 45,000の薄ページをGoogleが「索引価値なし」判定しサイト全体の品質を毀損。対策: 公開口コミ0件は `noindex,follow`（口コミが付けば自動解除）。
- **GSCの「未登録632」を放置しかけた** → 真因は薄いコンテンツ(クロール済144/検出453)。コードでは直らない＝口コミ＋権威で解決。
- **「重複31」を深追いしかけた** → brandグループの近似コンテンツ。Googleが正規版を自動選択済み＝無害。低ROIの罠。
- **スクレイピング×AI書き直しの口コミ** → 「訪問パターンが類似」で照合リスク＋ステマ規制(景表法)＋Google偽レビュー判定。対策: 本物の素材のみ・独自語彙。
- **Supabaseの`.limit(5000)`を信じてサイトマップが1,000店で打ち切られていた** → PostgRESTは**サーバー側の`max-rows`(既定1000)**が優先するため、クライアントの`.limit()`をいくら大きくしても1000件で頭打ち。掲載1,098店のうち**約98店がサイトマップから欠落**していた（2026-08-05に本番`/api/sitemap.xml`の`<loc>`を数えて発覚＝1,042 = 静的26+店舗1,000+セラピスト16）。**エラーも警告も出ないサイレント欠落**なのが厄介。対策: 全件取得は必ず`range(from, from+999)`のページングで書く。件数が「ちょうど1000/2000」なら上限を疑う。
- **サイトマップを`/sitemap.xml`でgrepして"1件"と誤判定** → `/sitemap.xml`はsitemapindex(目次・`<loc>`1件)で、全URLは子の`/api/sitemap.xml`にある。対策: 収録確認は子`/api/sitemap.xml`を`?t=$(date +%s)`付き(キャッシュ1h回避)でgrep。`is_public`/`owner_manual`口コミのセラピストページは自動収録される＝**口コミ投入だけでGoogleが発見**。GSC手動「インデックス登録をリクエスト」は初回の数ページのみ(1日10件制限)。
- **名指し実店舗の本番確定情報を口コミに書きかけた**（ゴム常備/追加料金で本番OK等）→ 隠語にしても読めば同義＝名誉毀損・業務妨害・売防/風営・Google/Vercel BANリスクが運営者に向く。対策: "気配はあるが本人は深追いせず"という実体験＋判断の形に。露骨な行為描写は"オプションの密着対応/完成形/線引き曖昧"等の隠語へ(ng-rules)。

## Next.js / デプロイ
- **SSR HTMLに長い`stale-while-revalidate`(1日等)を付けたら個別ページが真っ黒に** → Next.jsはデプロイ毎にJSのビルドIDが変わり旧チャンクは消える。CDNが古いHTMLを配信すると、消えた旧JS(`_ssgManifest.js`/`[threadId]-xxxx.js`)を指して404→Reactが起動せず真っ黒(コンソールに`Refused to execute script MIME text/plain`)。対策: **SSRのCache-ControlのSWRは短く(数分)**。`s-maxage=60, stale-while-revalidate=120`程度。HTMLとJSはビルドID一致が必須なので、HTMLを長時間staleにしてはいけない。
- **`index.jsx`が`index.js`をshadow** → Next.jsは.jsx優先解決。getStaticPropsをindex.jsに書いても無視され本番未反映。対策: トップの実体は必ず`index.jsx`側。
- **ISRの永続キャッシュが旧版を配信し続ける** → revalidate:3600が焼き付き、何度デプロイしても古い版。対策: SSR(getServerSideProps)+`Cache-Control: s-maxage=60`でキャッシュ根絶。
- **GA4がNext移行後ずっと未計測** → gtagが旧Viteの`index.html`にしか無く、`_app`/`_document`に無かった。対策: `_app.jsx`に`next/script`で設置。"143イベント"は旧Vite残存。
- **React19はbare `<style>`をSSR HTMLに出さない** → コンポーネント内インラインstyleが初回ペイントに効かない。対策: render-blockingが要るCSSは`src/index.css`(グローバル)へ。
- **本番デプロイ完了前にLighthouse/curl確認** → 毎回旧版を測ってパニック。対策: Vercel Ready or マーカー(`"gssp":true`等)確認後に計測。

## パフォーマンス
- **next/imageは入れない** → `unoptimized:true`＋多数CDN(remotePatterns未登録)＋LazyImageのSupabase WebP変換を壊すため。
- **外部画像が巨大(8MB)** → モバイルLCP/SI悪化。対策: `optimizeImageUrl`で外部は`images.weserv.nl`経由リサイズ+WebP、Unsplashはw縮小、Supabaseはrender/image。
- **モバイルLCPはSwiperのcoverflowが頭打ちの主因** → client描画＋visibility待ちで分散大。本質改善は静的ヒーロー化（別途）。

## 定期実行 / 監視
- **launchdの「実行されなかった日」を全部スリープのせいにしかけた** → cron.logを実測すると原因は別物だった。**7/22は未発火**（ログ行が無い＋翌7/23に2回動いた痕跡＝遅延catch-up。しかしスクリプトは常に「今日」の行を書くので7/22は永久に欠けた）。**8/4は発火して失敗**（`invalid_grant: Invalid JWT ... iat and exp`＝スリープ復帰直後でクロック未同期。7/6の`ENOTFOUND oauth2.googleapis.com`も同型でDNS未確立）。対策: ①`StartCalendarInterval`を配列にして1日複数回（スクリプトを冪等にしておけば重複しない）②復帰直後の一過性エラー（ENOTFOUND/EAI_AGAIN/invalid_grant/5xx）は指数バックオフでリトライ③**「ログが無い＝未発火」と「❌行がある＝発火して失敗」は別の障害**として切り分ける。
- **障害の検知を人間の目に頼っていた** → 真っ黒事故は6日間気づかれず、その間にGooglebotも踏んでインデックスが230→53に崩落した。対策: `scripts/monitoring/check_chunk_integrity.mjs`＋`.github/workflows/monitor.yml`で15分おきに「本番HTMLが指す`/_next/static/`のJSが200かつJS MIMEか」を機械が見る。**404時にCDNが`text/plain`を返す**のが事故のシグネチャなのでMIMEまで見ること。

## DB / スクリプト
- **写真衝突バグ** → Storageファイル名にtherapistID/日本語名を使うと同字数で上書き。対策: 元画像URLのベースネーム(uuid.jpg等)を使う。
- **anon keyでUPDATEがサイレント無効** → RLSで弾かれる。対策: スクリプトのUPDATEは`SUPABASE_SERVICE_ROLE_KEY`。
- **Supabase `.or()`内の`ilike %`が効かない** → 全件取得後にJS側フィルタで回避。
- **`shops.prefecture`列が存在しないのにselectした** → 都道府県はDBの独立列ではなく`raw_data.prefecture`内のみ（`raw_data.area`は配列 or 文字列）。集計スクリプトが`column shops.prefecture does not exist`で失敗。対策: `prefOf = (s) => s.raw_data?.prefecture`。ShopDetailPageの`shop.prefecture || shop.raw_data?.prefecture`は前者が常にundefinedで後者にフォールバックしていただけ。
- **owner_manual口コミのtherapist_idをハードコードしかけた** → id区切りが人によりバラバラ（`上野ゆい`=区切り無し / `藤城_けいか`=アンダースコア入り）。対策: therapist_idは`therapists`テーブルからDB自動解決（`insert_unison_*_review.mjs`参照）。therapist_nameはDB正式名(全角スペース`上野　ゆい`)だが照合はスペース除去。group_id共有店(`g_brand_*`)は1件投入で系列全店表示。

## 戦略
- **マネタイズを早すぎ導入しかけた**（143イベント/週）→ 広告ゲートはフライホイール停止＋レビューを隠してSEO本末転倒。対策: `Content→Traffic→Engagement→Monetization`の順。純広告(店舗枠)はトラフィック証明後。
- **検索カードが同一/search内で開かなかった** → `shopInput`がマウント時しかURLを読まずremountされない。対策: クリック時に`setShopInput`でstate更新。

## コンサル/計画立案
- **価格・数値目標を「結論先出し・分析後付け」で出した**（¥980を感覚で置き、突っ込まれてから競合実査／プラン段数設計を後追い。2回連続の指摘）→ 対策: 計画文書で価格・目標・配分を書く前に必ず①競合の一次情報実査②単位経済の積み上げ算③段階設計と移行トリガー、の3点を先に埋める。結論はその後。「導出できない数字は仮説とラベルし検証タスクを併記」。
- **6日間の真っ黒ページ(SWR=1日事故)が索引を230→53に崩落させた** → 障害はユーザーだけでなくGooglebotも踏む＝SEO資産の直接破壊。表示-92%の真因はこれ（GSCアーティファクト説で3週間を浪費）。対策: ①外形監視(UptimeRobot)を必ず設定②障害復旧後はGSCカバレッジを即確認③主要ページはインデックス登録リクエストで再クロール前倒し。
- **GSCの所有権トークンはGoogleアカウント単位** → 5/30の初期設定が別アカウントで行われており、現アカウントでUIに1ヶ月入れなかった（APIのservice accountだけ生きて誤魔化されていた）。対策: 検証metaタグは複数アカウント分並記できる。どのアカウントで設定したかをCLAUDE.mdの外部サービス表に必ず記録。

## 画像（何度も再発している領域）
- **一括処理でimage_urlをnull化してバックアップを残さなかった** → 2026-07-06の外部URL→R2移行でshops 82件が消え、**発覚まで1ヶ月**（2026-08-06にユーザー指摘で判明）。移行前は外部URLをwsrv経由で表示できていた＝復元可能な情報を自ら捨てた。対策: **一括更新スクリプトは旧値を必ず退避してから書き換える**（例 `raw_data.image_url_backup`）。null化は「情報を捨てる」操作だと自覚する。
- **画像の破損は誰も気づかないまま数週間放置される**（衝突上書き・429・lazy/onLoad・一括null化…原因は毎回違うが「気づけない」構図は同じ）→ 対策: `scripts/monitoring/check_image_health.mjs` を毎日CI実行（null率・配信の生死サンプル・**前回比の急増**を検知）。閾値超えでActionsが失敗＝メール通知。
- **共有uploadImageのUA不足で取得が落ちる** → `User-Agent: 'Mozilla/5.0'` だけだと多くのCDNが弾き、候補83件中29件が失敗した。対策: 画像取得はフルのブラウザUA＋Referer有無の2段リトライ＋Content-Type検証（`refill_null_shop_images.mjs` の `fetchImageBuffer` 参照）。
