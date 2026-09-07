# 不具合修正の実装指示

優先度P1＝利用者の完了・信頼に影響する修正、P2＝操作や表現の改善。証拠は「本番再現」と「コード上の発生経路」を区別する。行番号は2026-09-06時点の目印であり、現行コードを必ず照合する。

## F01／P1：登録後に元の口コミ・投稿へ戻れない

根拠：本番の読了後登録リンクは`/register`のみ。コードでは登録画面にredirectの受け取りがなく、ログイン→登録も戻り先を捨て、確認メールのリダイレクト先はホーム固定。実メールによる完了経路は未実行。

対象：

- [RegisterPage.jsx](/Users/okabayashi/Downloads/mens-esthe-site/src/pages/RegisterPage.jsx:31)：API payload、ログインリンク、送信完了。
- [LoginPage.jsx](/Users/okabayashi/Downloads/mens-esthe-site/src/pages/LoginPage.jsx:14)：既存redirect判定と新規登録リンク。
- [signup.js](/Users/okabayashi/Downloads/mens-esthe-site/api/auth/signup.js:103)：`generateLink`の`redirectTo`。
- [AuthConfirmPage.jsx](/Users/okabayashi/Downloads/mens-esthe-site/src/pages/AuthConfirmPage.jsx:8)：`safeNextPath`。
- [ReviewListWithRestriction.jsx](/Users/okabayashi/Downloads/mens-esthe-site/src/components/ReviewListWithRestriction.jsx:41)、[LikeButton.jsx](/Users/okabayashi/Downloads/mens-esthe-site/src/components/LikeButton.jsx:19)：固定URL。

### パラメータ契約

新しい用語を増やさず、ログイン・登録URLは既存の`redirect`を統一して使う。認証確認URL内部だけ既存の`next`を使う。JS内の変数名は`returnTo`。

```text
人物ページ /shops/A/threads/B#review-R
  → /register?redirect=<上の相対URLをencodeURIComponent>&source=review_end
  → POST /api/auth/signup { display_name, email, password, return_to }
  → Supabaseの確認リンク
  → /auth/complete?next=<検証済みreturnTo>&intent=signup
  → 確認済みセッションを確認
  → /shops/A/threads/B#review-R
```

`/auth/complete`は今回追加する確認後ページ案。`pages/auth/complete.jsx`と必要に応じた画面コンポーネントを作る。既存の`/auth/confirm`はtoken_hashを検証するページであり、用途を混ぜない。通常登録APIが発行する`action_link`とAuthメールHook経路を区別して維持する。

### 修正手順

1. 新規の純粋関数ファイル`src/utils/authRedirect.mjs`へ`normalizeReturnTo(value, fallback)`を置く。クライアント・APIで共有でき、windowや秘密鍵へ依存しない。
2. 戻り先は`/`1文字で始まる相対URLのみ許可。`//`、バックスラッシュ、制御文字、外部origin、javascriptスキームを拒否。`new URL(value, SITE_URL)`後のoriginも再確認。エンコード済みの先頭スラッシュ/バックスラッシュによる抜けを境界テストで拒否する。
3. 正常な日本語・`_`・検索query・口コミhashは保存する。URLSearchParamsで組み立て、二重encode/decodeをしない。認証ページ自身へのループ先はfallbackへ。初期登録は`/popular-reviews`、ログイン直開きは既存`/mypage`、recoveryは`/reset-password`を既定とする。
4. Header/読了/お気に入りのリンクで現在ページを渡す。ログイン⇄登録、メール送信後のログインでも保持する。投稿フローは既存の下書き保存を保ち、登録後に同じ確認画面まで復帰する。
5. APIで`return_to`を再検証。`generateLink`のredirectToを自社の固定`/auth/complete`へし、nextに検証済み相対URLを格納。クライアントから絶対のリダイレクト先を自由指定させない。
6. 新ページはAuth SDKによるセッション取込完了を待ち、確認済みuserを確認してから`replace(returnTo)`。タイムアウト時は「確認後のログインを完了できませんでした」＋戻り先付きログイン。トークンがない通常アクセスで完了イベントを発火しない。
7. Hookの`/auth/confirm`経路でsignup確認が成功した場合も、同じ完了ページへ渡す。recoveryは従来どおり再設定へ送る。OTPの処理はF02。
8. 本番の許可Redirect URL設定と、現在のSDKのimplicit/PKCE処理を実装時に照合する。公開設定が必要なら必要なURLを具体的に示す。全originワイルドカードで動かす指示にしない。[Supabase公式仕様](https://supabase.com/docs/guides/auth/redirect-urls)
9. 投稿内容やパスワードをURLに入れない。お気に入りは登録後に元ページへ戻り、必要なら「ハートで保存できます」と案内する。クロスデバイス同期や自動保存は今回約束しない（現状はユーザー別localStorage）。

受入：日本語ID/underscore/hash/queryを含む元URLへ、メールを別タブで開いても復帰。管理画面の既存`/login?redirect=/admin?review=...`を壊さない。外部URL・`//evil.example`・バックスラッシュ・二重エンコードは外へ遷移しない。登録途中の入力と投稿下書きが消えない。

## F02／P1：確認メールの成功後に再検証する／無効リンクから回復できない

根拠：コード上の発生経路。`AuthConfirmPage`のeffectはnavigate依存。[router.js](/Users/okabayashi/Downloads/mens-esthe-site/src/compat/router.js:17)の`useNavigate`は毎render新しい関数を返す。OTP成功→setStatus→再render→cleanupで遷移timer解除→同じOTP再実行となり得る。通常signup APIのaction_link自体の障害と断定しない。

対象：[AuthConfirmPage.jsx](/Users/okabayashi/Downloads/mens-esthe-site/src/pages/AuthConfirmPage.jsx:30)、[router.js](/Users/okabayashi/Downloads/mens-esthe-site/src/compat/router.js:17)。

1. `useNavigate`の戻り関数を安定させる。最新routerをrefで保持し、useCallbackは同一参照を返す。数値戻る・replace・通常pushの既存挙動を保持する。
2. OTP検証と成功後の遷移を別effectに分離。トークン＋typeごとの進行中promiseをrefで保持し、同じ検証を状態更新のたびに開始しない。
3. StrictModeのsetup→cleanup→setupでも、2回目のsetupが進行中promiseの結果を受け取れるようにする。「一度呼んだref=trueで即return」だけでは、最初のcleanup後に結果を誰も受け取らなくなるので不可。
4. 非同期rejectもcatchし、無限の「確認中」にしない。成功表示からerrorへ戻らない。timerは遷移effectが管理し、アンマウント時に解除する。
5. 無効・使用済みリンクの主操作は「ログインする」＋returnToを保持。既に有効な確認済みセッションがある場合は続行可能にする。期限切れのrecoveryは「パスワード再設定をやり直す」へ。
6. 「もう一度登録する」を唯一の操作にしない。同じメールで再登録すると409になる。再送機能は未実装なので見かけのボタンを足さない。

受入：モックで成功・reject・期限切れを検証。成功時のverifyOtpは同一トークンで1回、status更新後も維持、指定先へ1回遷移。StrictModeと別トークンの再訪も確認。トークンをconsoleやGAへ出さない。

## F03／P1：投稿の文字数メーターと次へ判定・特典が食い違う

根拠：採点コメントを含む画面/保存処理と、storyのみの判定が併存。例：入店90字＋総評90字＋ルックスコメント30字は現行の合成ラベル込みで218字だが、次へ判定は180字。実投稿は行わずコードと純粋関数で確認。

対象：[PostReviewPage.jsx](/Users/okabayashi/Downloads/mens-esthe-site/src/pages/PostReviewPage.jsx:799)の`validateStep`、`onSubmit`、`grantedDays`。正準関数：[reviewStory.mjs](/Users/okabayashi/Downloads/mens-esthe-site/src/features/reviews/reviewStory.mjs:58)、[reviewSchema.js](/Users/okabayashi/Downloads/mens-esthe-site/src/features/reviews/schema/reviewSchema.js:47)、[useReviewForm.js](/Users/okabayashi/Downloads/mens-esthe-site/src/features/reviews/hooks/useReviewForm.js:62)。

1. 全箇所で`countReviewStoryChars(withRatingsNote(story, ratings, ratingNotes))`を使う。実際のフォームの一言コメントのフィールド名を確認して渡す。
2. `Object.values(story).join('').length`等の別カウントを、Step3判定・送信イベント・成功画面の特典計算から取り除く。
3. 現在は4つの体験欄＋採点コメントの5区分。採点コメントの文字数算入・現在のラベル合成・前後trim・区分間空行を数えない仕様を保つ。今回、DBの文字数ルールを独自に再定義しない。
4. 付与日数は保存処理が返せるなら実結果を使う。画面側で計算する場合も同じ正準文字数から200〜699字=3日、700字以上=7日とする。

受入：体験欄180＋コメント30で次へ進める。体験欄680＋コメント30は7日表示。199/200/699/700、コメントなし、前後空白ありを正準関数と照合。入口/総評10字など既存の別制約は維持。

## F04／P1：同名の別人を集計・表示しない

根拠：コード上の確定した照合欠陥。実データの誤結合全件の特定は未実施。同名だから同一人物とする処理がある。

| ファイル | 箇所 |
|---|---|
| [SearchPage.jsx](/Users/okabayashi/Downloads/mens-esthe-site/src/pages/SearchPage.jsx:416) | 416〜451の名前別口コミ集計、513〜533の名前別カード統合 |
| [ShopDetailPage.jsx](/Users/okabayashi/Downloads/mens-esthe-site/src/pages/ShopDetailPage.jsx:143) | 系列口コミを名前だけで人物へ割当 |
| [ThreadDetailPage.jsx](/Users/okabayashi/Downloads/mens-esthe-site/src/pages/ThreadDetailPage.jsx:105) | 系列全店から名前一致、194以降Context fallback |
| [人物SSR](/Users/okabayashi/Downloads/mens-esthe-site/pages/shops/[shopId]/threads/[threadId].jsx:101) | legacyReviewsで異なるIDを除外していない。121以降ORで名前一致を再許可 |

### 照合契約

- レコードの基本キーは`therapist_id`。別IDを名前だけで統合しない。
- 口コミにIDがある：対象IDと完全一致した場合だけ人物の口コミへ付ける。異なるIDが入っていれば名前が同じでも除外。
- 口コミにIDがない：同一`shop_id`＋既存の正規化名が一致し、その店舗の同名候補が1人の場合だけfallbackを許可。複数なら未結合とする。
- 系列店共有のうち、同じ人物IDに対する既存の関連付けは維持する。異なるIDの同一人物を共有したい場合は、明示された対応データが必要。今回、名前・写真類似・系列所属から対応表を捏造しない。
- 検索で同名カードを潰さない。異なる人物IDは別カードとして店舗名・地域で区別する。

新しい純粋関数`src/utils/reviewIdentity.mjs`等へ契約を一本化し、SSR・CSR・平均・件数・タグ・ソートで共用する。旧口コミを一括削除したり、IDを推測で書き換えたりする修正ではない。

受入データ：別店舗同名2名、系列店同名で異なるID2名、同一店舗同名2名、IDなし旧口コミ、退店済みのID一致口コミ。写真・本文・評価・件数・タグが混ざらず、SSR初期表示と読込後が同じ。退店プロフィール200保持も確認する。

## F05／P1：通信失敗・追加読込・検索の状態を正しく扱う

対象：[SearchPage.jsx](/Users/okabayashi/Downloads/mens-esthe-site/src/pages/SearchPage.jsx:354)、[PopularReviewsPage.jsx](/Users/okabayashi/Downloads/mens-esthe-site/src/pages/PopularReviewsPage.jsx:113)、[ShopDetailPage.jsx](/Users/okabayashi/Downloads/mens-esthe-site/src/pages/ShopDetailPage.jsx:87)、[ThreadDetailPage.jsx](/Users/okabayashi/Downloads/mens-esthe-site/src/pages/ThreadDetailPage.jsx:84)、[ShopListPage.jsx](/Users/okabayashi/Downloads/mens-esthe-site/src/pages/ShopListPage.jsx:84)。

### 取得状態

初回loading、初回error、成功empty、成功rows、追加loading、追加errorを分ける。Supabaseの`error`を検査し、fetchは`res.ok`とJSONの型を確認。異常を空配列へ変換しない。

初回失敗は「読み込めませんでした」＋「再読み込み」。正常な空配列だけ「この条件では見つかりませんでした」。追加失敗は既存カードを残して一覧末尾に「追加分を読み込めませんでした」＋「もう一度読み込む」。SSRで取得済みの本文をCSR再取得失敗で消さず、「最新情報の取得に失敗しました」を補助表示する。

### 口コミ一覧のoffset

現在の`loadMore`は成功前にoffsetを20進めるため、失敗後に次の20件を飛ばす。offsetは正常結果の適用後にだけ更新。リトライは同じoffset。操作中の二重追加を防ぎ、口コミIDで重複排除する。

ソート変更時に世代番号を進め、古い取得の結果は反映しない。AbortControllerだけに依存せず、完了時に世代を照合する。新着／評価を連打しても最後の選択を表示する。

### 検索の0件と投稿先

`SearchPage`で店舗が見つかっていても人物0件なら説明を出す。「セラピスト名を解除」「タグを解除」「すべて解除」を現在の有効条件に応じて表示する。

複数店舗に一致した地域検索から「リストにいないセラピストを投稿」へ進む時に、先頭店舗を勝手にプリセットしない。明示されたshopIdがある場合だけ対象指定し、それ以外は店舗選択へ。

### 店舗一覧のURL同期：要再現項目

現行はURL→state effectがqueryにも依存し、state→URL effectと逆向きに更新する。本番で「新」→「新宿」は保持されたため、必ず入力消失するバグとは扱わない。

まずIME・削除・戻る/進む・query付き直リンクを検証。修正する場合は入力イベント→state→300msデバウンス後URLとし、URLからの反映は外部のURL変更時のみ。IME変換中は確定までURLを変えない。pref等の無関係な既存queryを削除しない。現在URLと同じならreplaceしない。

受入：503、通信断、不正JSON、追加20件の失敗をモック。条件・既存結果を保ち、復旧後1回の再試行で戻る。検索結果0件と通信エラーを混同しない。

## F06／P2：順位・新着・近隣・ヘッダーの表示根拠を直す

### A. 口コミ人気No.の誤表示とインジケーター

[TopHeroSlider.jsx](/Users/okabayashi/Downloads/mens-esthe-site/src/components/TopHeroSlider.jsx:149)の「口コミ人気 No.{index+1}」を「掲載店舗ピックアップ」へ置換する。固定5店舗を選んでいるため、実順位ではない。本番画面でも表示確認。

同ファイル186行のドット選択は現在スライドではなくautoplayの残り時間から算出している。`onSlideChange`の`realIndex`を別stateに保存し、dotのactive条件に使う。時間のprogressとslide indexを混ぜない。

ドットはクリック可能なbutton、aria-label「○枚目の店舗を表示」、現在地aria-current。指標自体は小さくてもタップ領域44px。既存coverflow・loop・画像・サイズは維持する。

自動送りは「一時停止／再生」ボタンを追加し、focus中は停止、`prefers-reduced-motion`では初期停止。スライダーを静的な別部品に置換しない。動きを止める操作の根拠：[W3C](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)。

### B. 全店舗がNew

[ShopListPage.jsx](/Users/okabayashi/Downloads/mens-esthe-site/src/pages/ShopListPage.jsx:241)の固定「★ New」を削除。日時を使った新着バッジは今回新設しない。

### C. 「近く」と表示しながら同県全体

[店舗SSR](/Users/okabayashi/Downloads/mens-esthe-site/pages/shops/[shopId]/index.jsx:130)は同エリアが3件未満だと同県へfallbackするが、[ShopDetailPage.jsx](/Users/okabayashi/Downloads/mens-esthe-site/src/pages/ShopDetailPage.jsx:667)の見出しは元の地域名のまま。本番の虎ノ門ページで荻窪等を確認。

SSR propsに`nearbyScope: 'area' | 'prefecture'`を追加。実際に同エリア集合を使った時だけarea。areaなら「虎ノ門の他の店舗」、prefectureなら「東京都の他の店舗」。補助文はどちらも「他の店舗も比較する」とし、距離を測っていないのに「近く」と言わない。URLは維持。

### D. ヘッダーが全ページ透過判定

[Header.jsx](/Users/okabayashi/Downloads/mens-esthe-site/src/components/Header.jsx:47)の配列に`/`があり、全pathnameが`startsWith('/')`を満たす。

ホームと固定ページは完全一致、店舗詳細/ブランド詳細だけ指定prefix一致に分離。`/search`・`/popular-reviews`・店舗一覧では不透明の背景になる。スクロールとメニュー開放時の挙動は維持する。

受入：1枚目でドットが時間とともに別番号にならない。スライド送りで正しい番号へ動く。口コミ順位に見える文言がない。別地域を近隣と表示しない。ヘッダーがページごとに正しく判定される。

## F07／P1：出勤スケジュールがエラー表示になる

本番店舗詳細で外部出勤表のiframeが灰色のエラー表示になった。[ShopDetailPage.jsx](/Users/okabayashi/Downloads/mens-esthe-site/src/pages/ShopDetailPage.jsx:936)は外部`https://www.tiger-gate.net/schedule/`を埋め込む。一方、[vercel.json](/Users/okabayashi/Downloads/mens-esthe-site/vercel.json:28)と本番HTTPヘッダーは`default-src 'self'`でframe-src未指定。外部iframeが許可されない構成。公式出勤URL自体のHEADは200だった。

### 採用する修正

1. 常時75vhの外部iframeを、店舗名と「最新の出勤は公式サイトで確認できます」のコンパクトな案内カードへ変更。
2. 主ボタン「公式サイトで出勤を確認」から、既存の検証済みschedule_urlを新しいタブで開く。`rel=noopener noreferrer`。外部へ移動することを文言で知らせる。
3. このセクションの`id=sec-schedule`と上部アンカーを残す。リンク先が無い店舗ではボタンと空セクションを出さない。
4. CSP全体を緩めたり`frame-src https:`を追加したりしない。外部埋め込みの再実装は別の要件として扱う。

受入：スマホ・PCで灰色iframeや大きな空白がなく、公式出勤を1操作で開ける。CSPの他の保護は維持。外部サイトの停止まで自サイトで正常と装わない。

## F08／P1：登録ボーナスの失敗を登録成功にしない

根拠：[signup.js](/Users/okabayashi/Downloads/mens-esthe-site/api/auth/signup.js:87)はuser_credits INSERT失敗をログに残すだけでメール送信へ進む。現時点で実利用者に発生したかは未確認。

起算はAPIでアカウントを作る時点から72時間。メール確認時点からに変更するのは商品仕様変更なので、今回行わない。

修正：今回新規作成したuserIdについて、ボーナス行が3日・正しい期限・投稿数0で作成されたことを確認してから確認メールを送る。INSERT結果が通信上不明なら同じuserIdを読み戻して成否を判断する。既に正しい行があれば再INSERTで延長しない。

付与を確認できない場合は成功レスポンス・確認メール送信へ進まず、既存の作成失敗時の後始末経路へ渡す。後始末は「このリクエストが新しく作ったuserId」に限定し、既存会員を削除しない。後始末自体が失敗した場合は回復が必要な状態としてサーバーログへ記録する。

受入：ボーナス失敗を注入した時にsuccessが返らない。書込成功・応答だけ失敗した時に二重付与しない。既存会員の期限を上書きしない。正常時は従来の3日で、total_reviews_postedを増やさない。

## F09／P2：所在地・画像の内容矛盾を対象限定で照合する

本番の店舗一覧で`/shops/60026` Mirajourに「大阪府 大阪市」と「東京都渋谷区」が併記された。またTIGER GATEの店舗ヒーローに、店舗ロゴというより他媒体のバナーに見える画像が表示された。画像は正常配信されており、HTTP200だけで店舗に適切な画像とは判定できない。

これは見た目のCSSだけで正解を決められない項目。まず対象2店舗だけについて、公式website_url、shopsの正規フィールド、raw_data、shapeShopRowで画面に渡る値を読み取りで照合し、矛盾のある列・画像URL・公式根拠を表にする。

Mirajourの正しい所在地を店名から推測しない。raw_dataを全店舗一括で上書きしない。TIGER GATEの画像も、公式が実際にそのバナーを使っている可能性を含めて確認する。

確定できた場合だけ、別のデータ修正指示に対象shop_id・変更前後・公式根拠を記載。誤画像が確定して代替がなければ、その店舗の写真を店名プレースホルダーへする案を採用する。今回のデザイン実装と無関係な全画像再収集は行わない。

受入：修正対象の所在地表示が公式根拠と一致し、画面内で矛盾しない。画像は配信健全性と店舗一致の双方を確認。未確定のものは未確定と報告し、架空の修正値を作らない。
