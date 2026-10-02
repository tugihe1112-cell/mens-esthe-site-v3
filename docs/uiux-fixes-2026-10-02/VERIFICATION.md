# 2026-10-02 追加監査 A01〜A10：実装・検証記録

対象は `docs/uiux-audit-2026-10-02/IMPLEMENTATION_HANDOFF.md` の追加9件と表示説明1件。10月1日の9件・ホームの口コミ復旧は保持した。

| ID | 変更 | 主な対象 |
|---|---|---|
| A01 | URLと下書きの初期化を一元化。異なる投稿先は選択待ちにし、選択前の保存・次へ操作も禁止。店舗・人物ID・名前・本文を一括初期化。DBの親子・名前を送信前に再確認し、取得失敗や不一致は本文を保持して停止。 | PostReviewPage、useReviewForm、reviewTarget |
| A02 | 読取・書込・削除の例外と読み戻し不一致を失敗として返す。state updater内の保存を除去。履歴は端末保存失敗でも表示を継続、お気に入りは保存失敗通知と選択状態の維持。旧データ移行は店舗・人物共通の所有者を先に記録。 | useRecentlyViewed、AppContext、localStorage |
| A03 | 最後に保存できた内容との差を共通離脱処理で判定。ロゴ・リンク・キャンセル・履歴移動で同期保存を試し、失敗は残る／コピー／保存せず移動のdialog。beforeunload、コピー拒否時の全文選択も保持。 | PostReviewPage、useReviewNavigation、reviewNavigation |
| A04 | 閲覧権は共通hookへ移行しexpiresAtを公開。確認中・失敗＋再試行・期限切れ・有効を分離。投稿件数は独立取得し、未取得・失敗を0件にしない。 | MyPage、useViewingCredits、usePostedReviewCount、postedReviewCount |
| A05 | 必須口コミ取得失敗をinitialLoadErrorでSSRから引き継ぎ、503/no-store/Retry-Afterと再試行を維持。店舗・写真だけの失敗では口コミを残す。真の0件だけ空案内。 | pages/popular-reviews、PopularReviewsPage |
| A06 | 並び替え世代・リクエスト識別子で古い成功・失敗・finallyを排除。表示中と選択中の並びを説明し、既存カードがあっても再試行を表示。成功後offset・同offset再試行・重複排除を保持。 | PopularReviewsPage |
| A07 | 保存ID件数をタブへ表示。初回読込失敗では未確認を「—」とし、再読込失敗では最後に確認できた件数を保持。保存読込・店舗索引・人物取得の状態を分離して再試行。失敗時は既存表示を保持し、正常取得で見つからない項目も保存数を残して説明。ユーザー切替直後と古い応答を遮断。 | FavoritesPage、favoriteProfiles、DataContext、AppContext |
| A08 | 店舗・ブランドのシートを共通hookへ。1024px境界で閉じて元のbody overflowを復元。Escape・Tabの囲い込み・フォーカス復帰・経路変更/アンマウント清掃、PC inset/bottom解除。店舗のSSR参照effect依存も明示。 | ShopDetailPage、BrandPage、TagFilterSidebar、useResponsiveFilterSheet |
| A09 | 店舗候補をtype=buttonのonClickで選択。Enter・Spaceの標準操作、label、候補と選択状態の関連付け。入力blurで候補を先に消す処理を除去。 | PostReviewPage Step1 |
| A10 | タグの数字は「そのタグが付いたセラピストの人数」と明示。計算方法・PCの左タグ/右名簿・0件のタグ表示を維持。 | TagFilterSidebar |

## ローカル実ブラウザで確認

Webpack開発サーバーlocalhost:3012、匿名状態。実際の投稿ボタンは送信していない。

- URL人物A＝星咲えり、公開待ち下書きB＝観月せなの組み合わせで選択画面になり、選択前に本文・投稿先・保存ボタンが変化しない。B再開で確認画面4/4、TIGER GATE・観月せな・本文B。Aへ新規を選ぶと本文を引き継がず2/4へ進む。
- ローカル限定の保存容量不足を模擬。追記後のロゴ、キャンセル、ブラウザ戻るで移動を止めてdialog。画面に残ると本文保持、コピー結果は追記を含み、保存せず移動を選んだ場合だけ離れる。
- 店舗候補RELAXをEnter、色気あるワイフをSpaceで選択し、選択済み表示と人物候補が現れる。
- 店舗ページ768→1024→768とEscape、ブランド768→1024および390→1440でシートが閉じ、body overflowは開く前の値に復帰。Escapeで開くボタンへフォーカス、PC幅ではタグ列へフォーカス。
- 口コミ一覧で評価順→新着順を素早く切替後、新着順のカードを確認。もっと見るで20件→公開全34件、実行時errorなし。
- 一時QAコントロールと_appの一時importは削除し、_appの差分は0。

画面記録：`draft-leave-failure.png`、`shop-width-1024.png`、`brand-width-1440.png`、`popular-reviews-normal.png`。

## ソースを実行した模擬検証

新規5ガードをprebuild/CIの唯一の一覧へ追加した。実ソースを読み、外部通信・保存領域・React hooksの実行環境を置き換えて検査する。本番への障害注入ではない。

- `check_review_initialization.mjs`：通常/公開待ち・同一/別投稿先・店舗一覧先/後着・直接/内部URL更新・古い初期化応答、選択前操作禁止、正常payload、親子/ID/name不一致と途中編集の送信拒否、同期離脱保存・失敗・履歴復帰・beforeunload・コピー拒否。
- `check_local_storage_resilience.mjs`：容量不足・読取/削除拒否・破損JSON・読み戻し不一致、履歴10件・重複除外・初期読込・純粋更新、お気に入りユーザー分離と移行の部分失敗、通知を実際に表示するToasterとの接続。
- `check_popular_review_loading.mjs`：実SSRの必須503・補助取得失敗・真の0件、実ページの応答逆転・追加取得競合・古いfinally・再試行・同offset・重複排除・アンマウント。
- `check_member_data_loading.mjs`：実MyPage/hookの権利と件数503→個別再試行、期限到達、premium、ユーザー切替。実FavoritesPageの保存1件→取得失敗→復旧、既存表示保持・欠損項目・真0件・索引遅延/失敗・旧応答排除。実DataProviderのフォールバック失敗→再試行・既存索引保持・旧応答排除。
- `check_responsive_tag_filter.mjs`：実hook/部品の幅変更・Escape/Tab・フォーカス・経路変更/unmount、人物2人/口コミ3件でもタグ数字は2人。処理をメモリ内で意図的に壊すと8条件で失敗。

各新ガードは共有ソースを破壊せず、メモリ内または独立した一時コピーで妨害検証する。既存の認証・閲覧権・投稿本文・DB INSERT列・人物同定ガードも保持する。

## ビルド・静的検査

- Node 24.11で `npm run build` 成功。既存19＋新規5の全24ガード、Webpack最適化、29ページの生成が成功。
- 今回のコード・ガード28ファイルのESLintと `git diff --check` が成功。会員表示の追加検査後も該当ガード・ESLintを再確認。
- 新ガードの妨害検証は投稿13、保存14、口コミ一覧10、会員表示14、幅変更8の計59種類を検出。共有の実装ファイルを壊したまま残していない。
- 作業ディレクトリのビルドと、今回コミットしたファイルだけのビルドを区別する。本番へ送るのはGitコミットに含めた変更のみ。
- 修正コミット `bd6c162` をGit archiveで独立した一時ディレクトリへ取り出し、CIと同じNode22で全24ガードと29ページのWebpackビルドに成功。初回ビルドはsandboxのGoogle Fonts DNS制限で停止し、通信許可後に同じソースで成功した。書体設定は変更していない。

## 保持したデータと作業

本番の口コミ・店舗・人物・権利行を修正して画面の問題を回避していない。既存の公開口コミは削除していない。Claude等の `TopHeroSlider.jsx`、`src/index.css`、`playbook/metrics-log.md` と未追跡outputsは編集・今回のコミットへの追加をしない。

## 本番反映・実測

- 修正コミット `bd6c1621522a6479fac9059a89904230857fd465`。GitHub側の監視記録コミット `ca1370c` を保持して統合したリリースHEADは `ad8a2747dd9c36c1ba51cefb90a21eee591f3b09`。統合で加わったファイルは `scripts/monitoring/image_health_history.json` のみ。
- [CI #317 / run 36967435427](https://github.com/tugihe1112-cell/mens-esthe-site-v3/actions/runs/36967435427) は同じリリースHEADで全ステップ成功。2026-10-02 14:07:30 JST完了。npm ci、全24ガード、Next buildを含む。
- Vercel Production `dpl_2wgWDjvuWcb25WkmQV1hmETNH4LK` / `mens-esthe-site-6ipg02vg9-tugihe1112-3251s-projects.vercel.app` はReady。www/非wwwの本番aliasを確認。実本番buildIdは `uTIIawuznt0KBcNF23eXm`。
- 本番ホームは最新7件／地域5区分／公開総数34件／`reviewLoadFailed=false`。口コミ一覧のSSRは20件・`initialLoadError=false`、評価順→新着順で取得中の表示順説明が出て、完了後は新着先頭「星咲えり」。もっと見るで34件、全文リンクも口コミID付き34件。
- RELAX店舗の768→1024→768、Escape、TIGER GATEブランドの768→1024・390→1440でシートが閉じ、元のbody overflowへ復帰。PCのタグ説明は人物数、Escapeは開くボタンへフォーカス復帰。
- 本番投稿画面でRELAX候補をEnterとSpaceで選択でき、選択済みと人物選択が表示され、1/4のまま送信されないことを確認。本文は入力せず、確認で作った店舗選択だけの下書きは「新しく書く」で削除。
- 公開API・匿名拒否・メソッド制限・安全ヘッダーの契約検査成功。`/api/auth/signup` の空POSTは400 / application/json / 必須項目案内。実登録やメール送信は行っていない。主要5ページ・16固有JSチャンクも200 / JS MIME。
- 初回API契約検査だけ `shops-lite?view=counts` が503だった。原因は断定せず、再取得で200・1,147店舗／57,648人・ETagなしを確認し、契約検査の再実行は全成功。観測した一時失敗を成功記録から除外していない。
- 画面記録 `production-popular-reviews.png`。一時QAルート・コントロール・認証偽装は本番へ含めていない。本番で故意の通信・保存障害を起こしていない。

## 本番検証の残り

実投稿は未実施。ユーザーは「確認用アカウントと投稿内容を指定する、ログインは自分で行う」を選択済み。投稿先・正当な本文・評価の指定と本人のログイン完了を待ち、本番反映後に実送信・保存内容・権利反映を確認する。ビルド/模擬検証成功を実投稿成功と報告しない。
