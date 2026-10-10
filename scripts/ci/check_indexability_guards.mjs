/**
 * 口コミあり店舗・セラピストの索引導線を守る静的ガード。
 *
 * 2026-09-05時点で、店舗のSSRは「口コミN件」と言いながら本文が空、
 * /popular-reviews は初期HTMLが骨組みだけ、主要リンクは検索画面経由、
 * sitemapは全URLを毎日更新扱いにしていた。いずれかが戻ればビルドを止める。
 */
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
/** ⚠️ コメントを剥がしてから検査する。
 *  剥がさないと「この表示はやめた」と**説明したコメント自体**にガードが反応する
 *  （2026-09-14、自分で書いた注記に引っかかって実際に誤検知した）。
 *
 *  🚩 **行コメントを先に剥がすこと。順序を逆にすると検査が骨抜きになる。**
 *  店舗SSRに `// 正しくは404…。/area/* で08-06に直したのと同じ型。` という行があり、
 *  この `/*` がブロックコメントの開始と解釈されて **200行以上先の `*/` まで丸ごと消えていた**。
 *  消えた範囲にある実装は何を壊してもガードが通る＝**落ちないガード**になる。
 *  （2026-09-14、D-014のガードを足したら一度も一致せず、そこで発覚した。）
 *  行コメントの正規表現は行頭の `//` だけを見るので、'https://…' のような文字列は壊さない。 */
const strip = (src) => src.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
const failures = [];

// 🚩 strip() 自身の自己診断。
//    ここが壊れると**全てのガードが静かに骨抜きになる**（何を消しても通る）ので、
//    検査本体より先に、コメントの剥がし方そのものを確かめる。
{
  const sample = [
    "// 正しくは404を返す。/area/* で直したのと同じ型。",
    "const MARKER = 'keep-me';",
    "/* ふつうのブロックコメント */",
    "const AFTER = 'keep-me-too';",
  ].join('\n');
  const out = strip(sample);
  if (!out.includes('keep-me') || !out.includes('keep-me-too')) {
    failures.push(
      '[strip自己診断] コメント除去が実装本体まで消している。' +
      '行コメント内の `/*` をブロックコメントの開始と誤読していないか確認すること。' +
      'これを放置すると全ガードが「何を壊しても通る」状態になる。'
    );
  }
  if (out.includes('ふつうのブロックコメント') || out.includes('/area/')) {
    failures.push('[strip自己診断] コメントが剥がせていない（説明文にガードが誤反応する）。');
  }
}
const requireMatch = (source, pattern, message) => {
  if (!pattern.test(source)) failures.push(message);
};
const rejectMatch = (source, pattern, message) => {
  if (pattern.test(source)) failures.push(message);
};

const shopWrapper = read('pages/shops/[shopId]/index.jsx');
const shopPage = read('src/pages/ShopDetailPage.jsx');
const popularWrapper = read('pages/popular-reviews.jsx');
const popularPage = read('src/pages/PopularReviewsPage.jsx');
const threadWrapper = read('pages/shops/[shopId]/threads/[threadId].jsx');
const threadPage = read('src/pages/ThreadDetailPage.jsx');
const homeReview = read('src/components/HomeReviewCard.jsx');
const brandResult = read('src/components/BrandResultCard.jsx');
const searchPage = read('src/pages/SearchPage.jsx');
const postReviewPage = read('src/pages/PostReviewPage.jsx');
const podiumCard = read('src/features/ranking/components/PodiumCard.jsx');
const rankingListItem = read('src/features/ranking/components/RankingListItem.jsx');
const sitemap = read('api/sitemap.xml.js');
const integrityMonitor = read('scripts/monitoring/check_site_integrity.mjs');

requireMatch(shopWrapper, /ssrReviews:\s*reviews\s*\|\|\s*\[\]/, '店舗SSRが公開口コミ本文をpropsへ渡していません');
requireMatch(shopPage, /useState\(ssrReviews\s*\|\|\s*\[\]\)/, '店舗画面がSSR口コミを初期表示に使っていません');
requireMatch(shopWrapper, /renderSeo=\{false\}/, '店舗ページのSEO出力がSSR側へ一本化されていません');
requireMatch(shopPage, /\{renderSeo\s*&&\s*\([\s\S]*?<SeoHead/, '店舗画面の重複SEO出力防止がありません');

requireMatch(popularWrapper, /export async function getServerSideProps/, '/popular-reviews がSSRではありません');
requireMatch(popularWrapper, /initialReviews:\s*reviews\s*\|\|\s*\[\]/, '/popular-reviews がSSR口コミを渡していません');
requireMatch(popularPage, /useState\(\(\)\s*=>\s*initialReviews\s*\|\|\s*\[\]\)/, '/popular-reviews がSSR口コミを初期表示に使っていません');
// 🚩 2026-09-19: 綴りの固定をやめ、**飛ばされないURL**を要求する形にした（今週7件目の同じ型）。
//    元の意図は「検索クエリではなく実体のあるURLを指すこと」。それは reject 側で保つ。
//    ⚠️ shopHref は group_id が引けないと店舗URLに倒れる。店舗の索引から引くこと。
requireMatch(popularPage, /shopLink = r\.shop_id[\s\S]{0,200}?shopHref\(/, '口コミ一覧の店舗リンクが shopHref を通っていません（複数ルームのブランドで301します）');
requireMatch(popularPage, /shopById\?\.\[r\.shop_id\]\?\.group_id/, '口コミ一覧が店舗の group_id を引いていません（shopHref が店舗URLに倒れて直書きと同じになります）');
rejectMatch(popularPage, /shopLink = [^;]*`\/search\?shop=/, '口コミ一覧の店舗リンクが検索クエリに戻っています');

requireMatch(threadWrapper, /renderSeo=\{false\}/, 'セラピストページのSEO出力がSSR側へ一本化されていません');
requireMatch(threadWrapper, /'@type': 'ProfilePage'/, 'セラピストをProfilePageとして構造化していません');
// 🚩 2026-09-19: 綴り `/shops/${shopId}` の固定をやめ、**飛ばされないURL**を要求する形にした。
//    元の意図は「検索クエリ(/search?shop=名前)ではなく実体のあるURLを指すこと」。それは保つ。
//    ただし複数ルームのブランドでは店舗URL自体が301でブランドページへ飛ぶ（D-014）ので、
//    綴りを固定すると「押した瞬間に飛ぶリンク」を強制することになる。
//    shopHref は shopRedirectPath と同じ判定を通すので、301先が分かっているときは最初からそこを指す。
requireMatch(threadPage, /to=\{shopHref\(/, 'セラピスト画面の店舗リンクが shopHref を通っていません（複数ルームのブランドで301するURLになります）');
rejectMatch(threadPage, /to=\{`\/search\?shop=/, 'セラピスト画面の店舗リンクが検索クエリに戻っています（実体のあるURLを指すこと）');
// 2026-10-05: ホーム口コミも shopHref に（複数ルームのブランドで押した瞬間に301で飛ばさない・D-014）。意図は上と同じ。
requireMatch(homeReview, /const shopLink = shopHref\(\{ id: r\.shopId, group_id: r\.groupId \}, roomCounts\)/, 'ホーム口コミの店舗リンクが shopHref を通っていません（正規の店舗／ブランドURLを指すこと）');
rejectMatch(homeReview, /\/search\?shop=/, 'ホーム口コミの店舗リンクが検索クエリに戻っています（実体のあるURLを指すこと）');
// 🚩 2026-09-16: 規則が変わった。**このガード自身が直書きを要求していた。**
//    D-014以降、複数ルームのブランドの店舗URLは301でブランドページへ飛ぶ。
//    BrandResultCard の展開リストは**ブランドのルーム一覧**なので、
//    直書きすると全部が「押す → 301 → さっきと同じページ」の往復になる。
//    ⇒ 正規URLの判断は shopHref（＝shopRedirectPath）に一本化する。
// 🚩 2026-09-20: 規則がまた変わった。今度は**リンクの数**。
//    ルームを1つずつリンクにすると、多ルームのブランドでは
//    **3つ選べるように見えて行き先は全部同じブランドページ**になる（301の先が1枚だから）。
//    「大森」を押した人は大森のページに行くつもりで押している。
//    ⇒ 入口は1つ。ルームは「どこにあるか」の表示だけにする。
//    ⚠️ **リンクを全部外してもいけない。** このカードは他にリンクを持たないので、
//       外すと検索結果から一歩も進めない行き止まりになる（実際その作りだった）。
//       だから「1つだけ在ること」を**両側から**見る。
const brandResultCode = strip(brandResult);
requireMatch(brandResultCode, /const brandHref = [\s\S]{0,160}?shopHref\(/,
  'ブランドカードの行き先が shopHref を通っていません（301の判断を二重に書かないこと）');
requireMatch(brandResultCode, /to=\{brandHref\}/,
  'ブランドカードにブランドページへの入口がありません（検索結果から進めない行き止まりになります）');
// ⚠️ 2026-09-20: ここは `shops.map(` と綴りを固定していた。**同じ日に `rooms.map(` へ変えた瞬間、
//    このガードは何も見なくなった**（14本は緑のまま）。今週何度も踏んでいる型なので、
//    どちらの綴りでも見るようにする。守りたいのは「ルーム1件ずつをリンクにしない」こと。
rejectMatch(brandResultCode, /(shops|rooms)\.map\([\s\S]{0,400}?<Link/,
  'ブランドカードがルームを1つずつリンクにしています（多ルームでは全部同じページへ飛びます）');
// 🚩 並べる対象は**全ルーム**。一覧用の `shops` は重複排除済みでブランド1行しか残らない。
requireMatch(brandResultCode, /summary\?\.rooms/,
  'ブランドカードが summary.rooms を使っていません（重複排除済みの一覧を並べると1枚しか出ません）');
// ⚠️ 受け取るだけでなく、**それを並べているか**まで見る（受け取って使わない書き方があり得る）。
requireMatch(brandResultCode, /\{rooms\.map\(/,
  'ブランドカードが rooms を並べていません（shops を並べると1枚しか出ません）');
// 🚩 ルーム欄の存在理由は「どこにあるか」。県と市区だけだと同じブランドのルームが
//    全部「東京都 大田区」になって見分けがつかない（店名を揃えたので名前でも区別できない）。
requireMatch(brandResultCode, /parts=\{\[[^\]]*shop\.area/,
  'ブランドカードのルームが地名（area）を出していません（ルームを見分けられなくなります）');
// 🚩 数えられない人数を出さない（D-010）。店舗行はセラピストを持たないので足すと必ず0になる。
requireMatch(brandResultCode, /Number\(summary\.therapistCount\)\s*>\s*0/,
  'ブランドカードが在籍人数を条件なしで出しています（「総勢0名」が出ます）');
rejectMatch(brandResultCode, /to=\{`\/shops\/\$\{shop\.id\}`\}/,
  'ブランド一覧が店舗URLを直書きしています（複数ルームのブランドでは押した瞬間に301します）');
// 🚩 ブランドの見出しは buildBrands に作らせる＝ブランドページと同じ名前にする。
//    2026-09-20 まで `representativeShop.brandId` をそのまま出しており、
//    取り込み時の内部キー `gokujou` が**見出しと <title> に出ていた**。
{
  const searchLogic = strip(read('src/utils/searchLogic.js'));
  requireMatch(searchLogic, /buildBrands\(/,
    '検索のブランド要約が buildBrands を通っていません（画面ごとに違う名前が出ます）');
  rejectMatch(searchLogic, /brandName:[^,\n]*\.brandId/,
    '検索のブランド名に内部キー（brandId）を使っています（`gokujou` のような取り込み用の値が見出しに出ます）');
  rejectMatch(searchLogic, /therapistCount:\s*totalTherapists/,
    '検索のブランド要約が在籍人数を足しています（店舗行は人を持たないので必ず0になります）');
}

// 一覧・カード面は全部 shopHref を通すこと。直書きは押した瞬間に301する。
for (const [path, label] of [
  ['src/pages/ShopListPage.jsx', '店舗一覧'],
  ['src/pages/Home.jsx', 'ホーム'],
  ['src/components/TopHeroSlider.jsx', 'トップのスライダー'],
  ['src/pages/FavoritesPage.jsx', 'お気に入り'],
]) {
  const src = strip(read(path));
  rejectMatch(src, /to=\{`\/shops\/\$\{shop\.id\}`\}/,
    `${label}が店舗URLを直書きしています（${path}）。shopHref(shop, roomCounts) を使うこと`);
}
// ⚠️ 2026-09-14: 検索結果をブランド単位にまとめたため、行の id は group_id になった。
//    そのままURLにすると `/shops/g_brand_xxx` で404するので primaryShopId を使う。
//    守りたいのは「中継ページを挟まず正規の店舗URLへ直接リンクすること」なので、
//    検査は外さず**実在する店舗idを使っているか**を見る形にする（START.md §5）。
// ── ブランドページ（2026-09-14）─────────────────────────────────────────
// セラピストは店舗ではなくブランドに属する。ブランドが本命ページなので、
// 店舗ページ(SSRあり)から301で送る前に、ここがSSRであることを保証する。
{
  const brandWrapper = strip(read('pages/brands/[brandId].jsx'));
  const brandPage = strip(read('src/pages/BrandPage.jsx'));
  requireMatch(brandWrapper, /export async function getServerSideProps/,
    'ブランドページがSSRになっていません（Googleに空ページとして見えます）');
  requireMatch(brandWrapper, /ssrReviews:\s*reviews/,
    'ブランドページのSSRが口コミ本文を渡していません');
  requireMatch(brandWrapper, /rel="canonical"/,
    'ブランドページがcanonicalを出していません');
  // 口コミ0件はサイトマップの方針に合わせて noindex,follow（follow は残す）
  requireMatch(brandWrapper, /\(ssrReviewCount === 0 \|\| isSoloBrand\) && <meta name="robots" content="noindex,follow"/,
    'ブランドページのrobots指定が消えています（口コミ0件、および単独店のブランドページ）');
  // 🚩 SSRで raw_data を丸ごと渡すとHTMLが3倍に膨れる（2026-08-09の実測）
  rejectMatch(brandWrapper, /ssrBrand:\s*brand\b(?![\s\S]{0,40}\{)/,
    'ブランドページのSSRがブランドをそのまま渡しています（raw_dataが焼き込まれます）');
  // 🚩 支店を主役にしない・根拠のない表示を戻さない
  rejectMatch(brandPage, /★ New/,
    'ブランドページに固定の「★ New」が戻っています（F06-Bで全画面から消した表示）');
  rejectMatch(brandPage, /Official Group|VIEW SHOP|Total \{/,
    'ブランドページに英語UIが戻っています');
  rejectMatch(brandPage, /\+ ' Group'/,
    'ブランド名を「◯◯ Group」と機械的に作っています（実際の店名を使うこと）');
  // ⚠️ 変数名の存在だけ見ると、代入を空にする壊し方が素通りする
  //    （2026-09-14 妨害テストで実際に素通りした。「参照ではなく効果を見る」の取り違えは通算6回目）。
  //    ブランドから取り出していること＋実際に描画へ渡していることの両方を見る。
  requireMatch(brandPage, /brand\.areaLabels/,
    'ブランドページが全ルームの地名を取り出していません（渋谷で検索した人が辿り着けなくなります）');
  requireMatch(brandPage, /parts=\{areaLabels\}/,
    'ブランドページが全ルームの地名を描画に渡していません');

  // ── 店舗ページと同等の中身（301で寄せる前提条件）───────────────────
  // ⚠️ 店舗ページが持っていてブランドページに無い要素があるまま301を入れると、
  //    348枚を**痩せたページへ寄せる**ことになる。ここで機械的に揃っているか見張る。
  // ⚠️ 「therapists を引いているか」では**在籍数カウントのクエリ**に当たって素通りする
  //    （2026-09-14 妨害テストで実際に素通りした。「参照ではなく効果」の取り違え通算7回目）。
  //    名簿に要る列（name と image_url）を取っていることまで見る。
  requireMatch(brandWrapper, /from\('therapists'\)\.select\('id, name, image_url/,
    'ブランドページが在籍セラピストを取得していません（店舗ページにある本体の中身が欠けます）');
  // ⚠️ 変数名を固定しない。守りたいのは「名簿を描いていること」であって綴りではない。
  //    2026-09-19、`roster.map` に固定していたため「もっと見る」導入で
  //    `visibleRoster.map` にしただけで落ちた（今週6件目の同じ型）。
  requireMatch(brandPage, /\b(visible)?[Rr]oster\.map\(/,
    'ブランドページが在籍セラピストを描画していません');
  // 🚩 名簿を打ち切ったままにしない。126名いて24名しか見られない状態に戻さない
  //    （D-014で店舗ページをここへ301したので、ここが唯一の閲覧口になっている）。
  requireMatch(brandPage, /もっと見る/,
    'ブランドページに「もっと見る」がありません（名簿が打ち切られたままになります）');
  rejectMatch(brandPage, /buildBrandRoster\([\s\S]{0,120}?\{\s*limit:\s*24\s*\}/,
    'ブランドページの名簿が24名で打ち切られています（店舗ページから301で来た人が全員を見られません）');
  // 🚩 名簿の残りを**このページ自身で取りに行く**こと。
  //    DataContext の therapists は最初から空で、loadTherapistsForShop を呼んだ店の分しか入らない。
  //    そこに頼ると「もっと見る」を置いてもSSRの24名のままになる（2026-09-19、本番で発覚）。
  const brandLoader = strip(read('src/utils/brandRosterLoading.js'));
  requireMatch(brandPage, /fetchBrandRows\(base, 'therapists', 'id,name,image_url,shop_id,is_active', shopIds, headers\)/,
    'ブランドページが在籍セラピストを自前で取得していません（24名から増えません）');
  requireMatch(brandPage, /import\s*\{\s*fetchBrandRows\s*\}\s*from\s*'\.\.\/utils\/brandRosterLoading\.js'/,
    'ブランドページが追加名簿の実loaderを読み込んでいません');
  requireMatch(brandLoader, /export async function fetchBrandRows\([\s\S]*?for \(let from = 0; ; from \+= 1000\)[\s\S]*?Range: `\$\{from\}-\$\{from \+ 999\}`/,
    'ブランドページの在籍取得がページ送りしていません（1,000名で頭打ちになります）');
  requireMatch(brandLoader, /if \(!response\.ok\) throw new Error\(/,
    'ブランド追加名簿が途中の取得失敗を完全取得として返しています');
  // 🚩 D-014で店舗ページをここへ301したので、店舗ページにあった絞り込みはここに要る。
  //    2026-09-19、タグ・口コミ順・名前絞り込み・並び替えが丸ごと無いまま4日間動いていた。
  // ⚠️ 2026-09-20: ここは文言「タグで絞り込む」を探していた。文言は共通部品へ移したので、
  //    **部品を描いているか**を見る形へ。文言そのものは下の D-001（check_design_decisions）が
  //    部品の中で見張る。綴りを追いかけると、移すたびにガードが死ぬ。
  requireMatch(brandPage, /<TagFilterSidebar/,
    'ブランドページがタグの列（TagFilterSidebar）を描いていません（301で来た人が店舗ページの絞り込みを失います）');
  requireMatch(brandPage, /buildTherapistReviewIndex\(/,
    'ブランドページが人物ごとの口コミ索引を作っていません（タグと口コミ順が動きません）');
  // ⚠️ キーは therapist_id。名前キーは系列店の**同名の別人**を1人に束ねる（F04）。
  requireMatch(brandPage, /fetchBrandRows\(base, 'reviews', 'therapist_id,shop_id,therapist_name,tags', shopIds, headers\)/,
    'ブランドページの口コミ集計が therapist_id を取っていません（同名の別人が混ざります）');
  // 🚩 店舗情報（営業時間・料金・公式・出勤）。D-014で301した先に無いと、利用者は見る手段を失う。
  requireMatch(brandPage, /brandCommonValue\(/,
    'ブランドページが店舗情報をルーム間で突き合わせていません（営業時間・料金が出ません）');
  // ⚠️ 割れているのに1つ選んで出さない（D-010）。「ルームにより異なります」と言うこと。
  requireMatch(brandPage, /ルームにより異なります/,
    'ブランドページが「ルームにより異なります」を出していません（割れている値を1つだけ出すと嘘になります）');
  // 🚩 住所はブランド共通にしない。実測で71%のブランドがルームごとに違う。
  rejectMatch(brandPage, /add\('住所'/,
    'ブランドページが住所をブランド共通として出そうとしています（71%のブランドでルームごとに違います）');
  // ⚠️ 同じ select が2か所ある（group_id で引く場合と id で引く場合）。
  //    「どこかに1つあればOK」にすると**片方だけ落ちた事故を見逃す**
  //    （2026-09-19、妨害テストで実際に素通りした）。**該当する全部**を見る。
  const brandWrapper2 = strip(read('pages/brands/[brandId].jsx'));
  {
    const selects = [...brandWrapper2.matchAll(/from\('shops'\)\.select\('([^']*)'\)/g)]
      .map((m) => m[1])
      .filter((cols) => cols.includes('group_id') && cols.includes('image_url'));
    if (!selects.length) {
      failures.push('ブランドSSRの店舗取得が見つかりません（店舗情報の列を検査できません）');
    }
    for (const cols of selects) {
      for (const need of ['schedule_url', 'business_hours', 'price_system']) {
        if (!cols.includes(need)) {
          failures.push(`ブランドSSRの店舗取得に ${need} がありません（店舗情報が静かに空になります）: select('${cols}')`);
        }
      }
    }
    // 🚩 列を選んでいても、**props に平らにする所で落ちれば画面には届かない。**
    //    2026-09-20、上の列の検査も下の描画の検査も通っていたのに、
    //    間のこの1行が4項目を落としていて店舗情報は本番で空だった＝**両端だけ見ても足りない。**
    //    役割分担: 「brandRoomProps が項目を保つか」は check_ssr_helpers が通しで測る。
    //    ここは「ブランドSSRがその関数を使っているか」だけを見る。
    requireMatch(brandWrapper2, /\.map\(brandRoomProps\)/,
      'ブランドSSRが rooms を brandRoomProps で平らにしていません（手書きすると項目が落ちて店舗情報が静かに空になります）');
    requireMatch(brandWrapper2, /import\s*\{[^}]*brandRoomProps[^}]*\}\s*from\s*'[^']*brandGroups\.js'/,
      'ブランドSSRが brandRoomProps を読み込んでいません');
  }
  // 🚩 宣言の順序。`const` は巻き上がらないので、使用より後ろに書くと**実行時に落ちる**。
  //    ⚠️ これは `npm run build` でも eslint(no-undef) でも**検出できない**
  //       （スコープ内には在るため）。2026-09-19、実際に使用より後ろに書いてしまった。
  //    ⚠️ 本当の検出手段はページを開くこと。この検査はあくまで再発の網。
  {
    const decl = brandPage.indexOf('const [cloudRosterResult');
    const scopedUse = brandPage.indexOf('const cloudRoster = currentResult?.rows');
    const use = brandPage.indexOf('cloudRoster && cloudRoster.length');
    if (decl < 0 || scopedUse < 0 || use < 0) {
      failures.push('ブランドページの cloudRoster の宣言か使用が見つかりません（順序を検査できません）');
    } else if (decl > scopedUse || scopedUse > use) {
      failures.push('ブランドページで cloudRoster を宣言より前に使っています（実行時に落ちます。buildもeslintも検出しません）');
    }
  }
  // 🚩 人単位の重複除去は buildBrandRoster に一本化する。
  //    SSRと画面で別々に畳むと、片方だけ「咲さんが3ルームぶん3回出る」に戻る。
  requireMatch(brandWrapper, /buildBrandRoster\(/,
    'ブランドページSSRの在籍セラピストが buildBrandRoster を通っていません');
  requireMatch(brandPage, /buildBrandRoster\(/,
    'ブランドページの在籍セラピストが buildBrandRoster を通っていません');
  // 🚩 名簿は写真の有無で絞っていない（2026-09-16に店舗ページと揃えた）。
  //    「写真を確認できるセラピストを表示しています」と書くと**画面が嘘をつく**。
  rejectMatch(brandPage, /写真を確認できるセラピストを表示/,
    'ブランドページが「写真を確認できるセラピストを表示しています」と書いています（名簿は写真で絞っていないので嘘になります）');
  requireMatch(strip(read('src/utils/brandGroups.js')), /normalizeTherapistName\(t\.name\)/,
    '在籍セラピストの人物同定が normalizeTherapistName を使っていません（表記ゆれが別人に戻ります）');
  // 🚩 在籍数は**行数ではなく実人数**。
  //    2026-09-14、相模原1室が「140人」なのにブランドが「420名」＝同じ140人を3回数えていた。
  requireMatch(brandWrapper, /ssrTherapistCount:\s*rosterTruncated \? null : personCount/,
    'ブランドページの在籍数が実人数ではありません（ルーム数ぶん水増しされます）');
  rejectMatch(brandWrapper, /from\('therapists'\)[^;]{0,80}count:\s*'exact'/,
    'ブランドページが在籍数を行数で数えています（同じ人をルーム数ぶん重複計上します）');
  // 🚩 口コミ投稿の導線。これが無いまま店舗ページを畳むと一次コンテンツの入口が消える。
  requireMatch(brandPage, /to=\{`\/shops\/\$\{reviewShopId\}\/review`\}/,
    'ブランドページに口コミ投稿の導線がありません（サイトの一次コンテンツの入口です）');
  requireMatch(brandPage, /const reviewShopId = brand\.primaryShopId/,
    '口コミ投稿の宛先がブランドIDになっています（投稿画面は実在の店舗IDを要ります）');
  // 🚩 回遊・クロール経路。送り先は店舗ではなくブランド（店舗へ送ると301と往復する）。
  // 🚩 2026-10-10: ルーム数は**全店で数えた表**（roomCounts）を渡す。b.roomCount はこの県の店だけで
  //    数えた数で、県をまたぐブランドが1ルームに見える＝店舗URL（押すと301）に倒れていた（本番で CREST など）。
  requireMatch(brandPage, /to=\{brandCanonicalPath\(b,\s*roomCounts\)\}/,
    'ブランドページの他ブランドリンクが、全店で数えたルーム数（roomCounts）で本命URLを決めていません（単独店の存在しない /brands/ へ送るか、複数ルームのブランドが店舗URL＝301になります）');
  requireMatch(brandPage, /const \{[^}]*\broomCounts\b[^}]*\} = useShopData\(\)/,
    'ブランドページが DataContext の roomCounts を取っていません（他ブランドのリンク先が決まりません）');
  requireMatch(brandWrapper, /pickNearbyBrands\(/,
    'ブランドページSSRが同エリア他ブランドを取得していません');
  // 🚩 店舗ページが持っている構造化データを揃える
  requireMatch(brandWrapper, /'@type': 'BreadcrumbList'/,
    'ブランドページにパンくず構造化データがありません（店舗ページは持っています）');
  requireMatch(brandWrapper, /reviewBody:/,
    'ブランドページの構造化データに口コミ本文がありません（店舗ページは持っています）');
}

requireMatch(searchPage, /const shopDetailUrl = brandCanonicalPath\(shop\)/,
  '検索結果のリンクが本命URL規則(brandCanonicalPath)を通っていません（301を1回余計に踏ませます）');

// ── DB障害のときに「200で空ページ」を配信しない（2026-09-15）────────────
// 🚩 店舗・ブランド・人物・エリアのSSRは 2026-06-30 の全API停止を受けて503にしてあったが、
//    **トップページだけ取得失敗時に空配列のまま200を返していた**。
//    GSCの実測では索引されている数少ないページの1つがトップ＝一番やられてはいけない場所。
// ⚠️ 一律503ではない。取得が2段あり後段だけ失敗した場合は部分的に出せるので、
//    「全部空」のときだけ503にする、という条件ごと見張る。
{
  const homeWrapper = strip(read('pages/index.jsx'));
  requireMatch(homeWrapper, /const gotNothing = initialHero\.length === 0 && reviewsByPref\.length === 0 && !liveCounts/,
    'トップページが「中身が全部空か」を判定していません（空ページを200で配信します）');
  requireMatch(homeWrapper, /if \(gotNothing\)[\s\S]{0,120}res\.statusCode = 503/,
    'トップページが中身ゼロのときに503を返していません（2026-06-30の空ページ配信と同じ型）');
  rejectMatch(homeWrapper, /notFound: true/,
    'トップページが404を返そうとしています（URLの消滅を宣言することになります）');
}

// ── D-014 複数ルームのブランドへの集約（2026-09-14）──────────────────
// 301・サイトマップ・内部リンクは**同時に**動かないと壊れる。片方だけ直す事故を機械で止める。
{
  const shopWrapper = strip(read('pages/shops/[shopId]/index.jsx'));
  const sitemap = strip(read('api/sitemap.xml.js'));
  const monitor = strip(read('scripts/monitoring/check_http_status.mjs'));
  const brandPage2 = strip(read('src/pages/BrandPage.jsx'));
  const prefPage = strip(read('src/pages/PrefecturePage.jsx'));

  requireMatch(shopWrapper, /redirect: \{ destination: redirectTo, statusCode: 301 \}/,
    '店舗ページからブランドページへの301が消えています（D-014）');
  // 🚩 301はブラウザに**永久に**残る。`s-maxage` は共有キャッシュにしか効かず、`max-age` が無いと
  //    ブラウザは301を無期限にキャッシュしてよい。まとめ方を後で直しても、一度301を受け取った人は
  //    二度とその店舗ページに辿り着けなくなる（2026-09-16、キャンディスパで実際に起きた）。
  requireMatch(shopWrapper, /if \(redirectTo\) \{[\s\S]{0,300}?setHeader\('Cache-Control',\s*'[^']*max-age=0[^']*'\)[\s\S]{0,300}?return \{ redirect:/,
    '301を返す前にブラウザ向けのキャッシュ指示(max-age=0)を出していません（一度301を受けた人が二度と店舗ページに戻れなくなります）');
  // 🚩 `permanent: true` は Next では **308** になる。外形監視は301を期待しているので、
  //    この書き方に戻すと15分ごとに「301が効いていない」で赤くなる。
  rejectMatch(shopWrapper, /redirect: \{[^}]*permanent:/,
    '301を permanent:true で書いています（Nextは308を返すため監視が赤くなります。statusCode:301 と書くこと）');
  requireMatch(shopWrapper, /shopRedirectPath\(shop, countRoomsByBrand\(/,
    '301の判定が共有関数を通っていません（サイトマップ・内部リンクと食い違います）');
  // 🚩 ここが抜けるとルーム数を数えられず **301が一度も発火しない**（壊れないので気づけない）。
  requireMatch(shopWrapper, /from\('shops'\)\.select\('id, group_id'\)\.eq\('group_id'/,
    '系列店の取得が group_id を選んでいません（ルーム数を数えられず301が発火しません）');
  requireMatch(sitemap, /shopRedirectPath\(s, roomCounts\)/,
    'サイトマップが301対象の店舗URLを出し続けています（Googleに出すURLが301になります）');
  // 🚩 監視の期待値。301するURLをMUST_200に残すと15分ごとに赤くなる（1日96通の事故と同じ型）。
  requireMatch(monitor, /const MUST_301 = \[/,
    '外形監視に301の確認がありません（301が外れても気づけません）');
  requireMatch(monitor, /\/\^\\\/\(shops\|brands\)\\\/\[\^\/\]\+\$\//,
    'サイトマップ採取がブランドURLを数えていません（集約が進むと0件判定で監視が永久に赤くなります）');
  // 🚩 ルームをリンクにすると「押す→301→同じページ」の往復になる。
  rejectMatch(brandPage2, /to=\{`\/shops\/\$\{r\.id\}`\}/,
    'ブランドページのルームが店舗ページへリンクしています（301でこのページへ戻る往復になります）');
  // 🚩 第2引数（全店で数えたルーム数）を必ず渡す。
  //    この画面は**その県の店だけ**でブランドを組むので、県をまたぐブランドでは
  //    brand.roomCount が実際より小さくなり、`/shops/...` を指してしまう。
  //    その店舗URLは全体のルーム数で301するので、**押した瞬間に飛ぶリンク**になる
  //    （2026-09-16、THE HALF に横浜ルームを足して実際に出た）。
  requireMatch(prefPage, /to=\{brandCanonicalPath\(shop,\s*allRoomCounts\)\}/,
    'エリア一覧のリンクが全店のルーム数を使っていません（押した瞬間に301で飛ぶリンクになります）');
  requireMatch(prefPage, /countRoomsByBrand\(shops\)/,
    'エリア一覧が全店からルーム数を数えていません（県で切った数だと301するリンクを作ります）');
  // 🚩 SSRで渡る initialShops は**ブランド要約**なので、そこから数えても全部1ルームになる。
  //    SSR側が全店で数えた表を渡すこと。
  // ⚠️ `initialRoomCounts` という**語**を探すと、この件を説明したコメントに当たって通ってしまう
  //    （2026-09-16、妨害テストで実際に素通りした）。**コメントを剥がした上で使い方を見る。**
  const prefPageCode = strip(prefPage);
  requireMatch(prefPageCode, /Object\.entries\(initialRoomCounts/,
    'エリア一覧がSSRのルーム数表を使っていません（初期HTMLのリンクが301するURLになります）');
  const areaWrapper = strip(read('pages/area/[pref].jsx'));
  requireMatch(areaWrapper, /countRoomsByBrand\(allRooms\)/,
    'エリアSSRが全店からルーム数を数えていません');
  requireMatch(areaWrapper, /group_id: b\.id/,
    'エリアSSRが渡す店舗一覧から group_id が落ちています（画面側で全部が単独店になります）');
  requireMatch(areaWrapper, /range\(from, from \+ 999\)/,
    'エリアSSRのルーム数集計がページ送りしていません（1,000件で頭打ちになります）');
  // 🚩 クロール経路のリンクを `/shops/${s.id}` と直書きしない。
  //    D-014以降、複数ルームのブランドの店舗URLは301でブランドページへ飛ぶ。
  //    孤立ページ解消のための経路が**リダイレクトを指す**ことになる（2026-09-16、実際にそうなっていた）。
  rejectMatch(areaWrapper, /href=\{`\/shops\/\$\{s\.id\}`\}/,
    'エリアSSRのクロール経路が店舗URLを直書きしています（複数ルームのブランドでは301するURLを出します）');
  requireMatch(areaWrapper, /href: brandCanonicalPath\(/,
    'エリアSSRがリンク先を brandCanonicalPath で決めていません');
}
requireMatch(postReviewPage, /data\.shopId \? `\/shops\/\$\{data\.shopId\}`/, '指名なし投稿後のリンクが正規店舗URLではありません');
for (const [name, source] of [['表彰台', podiumCard], ['ランキング一覧', rankingListItem]]) {
  requireMatch(source, /item\.therapistId\s*\|\|\s*item\.id/, `${name}が実データのtherapistIdを使っていません`);
  rejectMatch(source, /threads\/\$\{item\.id\}/, `${name}が存在しないitem.idを直接リンクに使っています`);
}

rejectMatch(sitemap, /const TODAY\b|<lastmod>\$\{TODAY\}/, 'sitemapが全URLを毎日更新扱いにしています');
// 🚩 書き方ではなく性質を見る（2026-10-10 に therapist_name を足したら、列の並びを固定していたこの検査が落ちた）。
requireMatch(sitemap, /\.from\('reviews'\)\s*\.select\('[^']*\bcreated_at\b[^']*'\)/, 'sitemapが実際の口コミ更新日（created_at）を取得していません');
requireMatch(sitemap, /lastmod:\s*p\.lastAt/, 'sitemapの人物ページの lastmod が、その人の最新の口コミ日になっていません');
rejectMatch(sitemap, /\.not\('therapist_id',\s*'is',\s*null\)/, '指名なし口コミの店舗がsitemapから漏れます');
requireMatch(sitemap, /lastmod:\s*shopLastmod\.get\(s\.id\)/, '店舗sitemapのlastmodが実口コミ更新日ではありません');
requireMatch(integrityMonitor, /根拠のないlastmodが付いている/, '本番監視がsitemapの偽lastmodを検出しません');
requireMatch(integrityMonitor, /口コミの実更新日が無い/, '本番監視が口コミURLのlastmod欠落を検出しません');

// ── エリア一覧の見出しは日本語の地名にする（2026-09-15）─────────────
// 画面で一番大きい文字が `SHINJUKU` などのローマ字で、実際の地名「新宿」は
// その下の小さい副題だった。利用者が探すのも機械が読むのも「新宿」のほう。
// 2026-09-09にホームで直した「一番大きい文字と見出しが食い違う」のと同じ型。
{
  const areaSearch = strip(read('src/pages/AreaSearchPage.jsx'));
  const heading = areaSearch.match(/<h2[\s\S]{0,400}?<\/h2>/);
  if (!heading) {
    failures.push('エリア一覧に見出し(h2)が見つかりません（見出しの検査が素通りします）');
  } else {
    requireMatch(heading[0], /\{area\.name\}/,
      'エリア一覧の見出しが日本語の地名ではありません（2026-09-15に直した「見出しがローマ字」に戻っています）');
    rejectMatch(heading[0], /\{area\.en\}/,
      'エリア一覧の見出しがローマ字(area.en)です（利用者も機械も「新宿」で探します）');
  }
  // ⚠️ ローマ字そのものは消さない約束。見出しから降ろして小さいラベルとして残す。
  requireMatch(areaSearch, /\{area\.en\}/,
    'エリア一覧からローマ字表記が消えています（見出しから降ろすだけで、削除はしない約束です）');
}

// ── 在籍数の定義（2026-09-22）／在籍一覧を SSR で出す（2026-10-09）─────────────
// 店舗ページの「在籍N人」とSEO説明文の人数が、一覧（在籍だけ）と違う母数で数えられていた。
// 在籍照合で退店マークを付けた直後、AromaCharm が「在籍 56 人」「全37人」を同時に出した。
// 🚩 2026-10-09: 在籍一覧はブラウザだけが取りに行っていたので、最初の HTML は
//    「全 0 人／在籍セラピスト情報はありません」だった（Google が読む HTML に在籍者が居ない）。
//    鎖は4段（一覧を取る → 同じ畳み方で数える → props に載せる → 画面が読む）。
//    どこが切れても黙って「全 0 人」に戻るので4段とも見る。人数と一覧は同じ関数から出す。
{
  const shopSsr = strip(read('pages/shops/[shopId]/index.jsx'));
  const rosterFn = (shopSsr.match(/async function fetchShopRosterRows[\s\S]*?\n\}/) || [''])[0];
  requireMatch(rosterFn, /\.from\('therapists'\)/,
    '店舗ページの在籍一覧の取得（fetchShopRosterRows）が見つかりません（書き方を変えたらこの検査も直すこと）');
  requireMatch(rosterFn, /\.or\('is_active\.is\.null,is_active\.eq\.true'\)/,
    '店舗ページの在籍一覧が退店マークの人まで取っています（一覧と同じ is_active の条件で取ること）');
  requireMatch(rosterFn, /\.range\(/,
    '店舗ページの在籍一覧がページ送りしていません（1000行で黙って欠けます）');
  requireMatch(rosterFn, /\.order\('id'/,
    '店舗ページの在籍一覧に並び順がありません（ブラウザが読み込み終わった瞬間にカードが並び替わります）');
  // ⚠️ 関数の定義行（async function fetchShopRosterRows(supabase, shopId)）にも一致するので、
  //    **呼び出し**（Promise.all の中の1行）だけを見る（2026-10-09、呼び出しを消す妨害で素通りして発覚）。
  requireMatch(shopSsr, /^\s*fetchShopRosterRows\(supabase,\s*shopId\),\s*$/m,
    '店舗SSRが在籍一覧を取っていません（最初の HTML が「全 0 人」に戻ります）');
  requireMatch(shopSsr, /buildShopRosterProps\(rosterRes\.data\)/,
    '店舗SSRの在籍数が一覧と同じ関数（buildShopRosterProps）で数えられていません（「在籍N人」と「全N人」が食い違います）');
  requireMatch(shopSsr, /^\s*ssrRoster,\s*$/m,
    '店舗SSRが在籍一覧を props（ssrRoster）に載せていません');
  requireMatch(shopSsr, /ssrRoster=\{ssrRoster\}/,
    '店舗SSRが在籍一覧を画面へ渡していません');
  const shopPageCode = strip(read('src/pages/ShopDetailPage.jsx'));
  requireMatch(shopPageCode, /:\s*ssrRosterUsable\s*\?\s*ssrRoster/,
    '店舗ページが SSR の在籍一覧を使っていません（最初の HTML が「全 0 人」に戻ります）');
  requireMatch(shopPageCode, /&order=id\.asc/,
    '店舗ページの在籍一覧の取得が SSR と同じ順（id 昇順）になっていません（読み込み後にカードが並び替わります）');
  requireMatch(shopPageCode, /全<span[^>]*>\{rosterTotal\}/,
    '店舗ページの「全N人」が SSR の先頭だけを数えています（先頭12人を「全12人」と出します）');
  rejectMatch(shopPageCode, /\bt\.tall\b/,
    '店舗ページの在籍カードが t.tall を読んでいます（DB の列は height。身長が一度も出ません）');
  requireMatch(shopPageCode, /therapistHeight\(t\)/,
    '店舗ページの在籍カードが therapistHeight を通していません（身長が出ない・おかしな値が出ます）');
  const rosterUtil = read('src/utils/shopRoster.js');
  requireMatch(rosterUtil, /normalizeTherapistName/,
    '在籍一覧の畳み方が normalizeTherapistName を使っていません（画面と人数が食い違います）');
  rejectMatch(rosterUtil.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''), /raw_data/,
    '在籍一覧の SSR に raw_data を載せています（1行で数KB・HTML が膨れます）');
}

// ── 店舗ページの料金・営業時間を SSR で出す（2026-10-09）───────────────────────
// 店舗SSRが shops から料金・営業時間を取っておらず、ssrShop にも載せていなかった。
// SSR の HTML では料金欄が「この店舗の料金は未掲載です」・営業時間なしになり、ブラウザが後から
// 読む値で埋めていた＝人には出るが Google が読む HTML には出ない（単独店すべて）。
// 🚩 鎖は3段（取る → ssrShop に載せる → 画面が読む）。どこが切れても黙って「未掲載」に戻るので3段とも見る。
{
  const shopSsr = strip(read('pages/shops/[shopId]/index.jsx'));
  const shopSelect = (shopSsr.match(/\.from\('shops'\)\s*\.select\('id, name, group_id[^']*'\)/) || [''])[0];
  requireMatch(shopSelect, /\.select\(/,
    '店舗SSRの shops 本体の取得が見つかりません（書き方を変えたらこの検査も直すこと）');
  requireMatch(shopSelect, /\bbusiness_hours\b/,
    '店舗SSRが営業時間（business_hours）を取っていません（HTMLの店舗情報から営業時間が消えます）');
  requireMatch(shopSelect, /\bprice_system\b/,
    '店舗SSRが料金（price_system）を取っていません（HTMLの料金欄が「未掲載」に戻ります）');
  const ssrShopBlock = (shopSsr.match(/const ssrShop = shop\s*\?\s*\{[\s\S]*?\}\s*:\s*null/) || [''])[0];
  requireMatch(ssrShopBlock, /const ssrShop/,
    '店舗SSRの ssrShop が見つかりません（書き方を変えたらこの検査も直すこと）');
  requireMatch(ssrShopBlock, /\bbusiness_hours:\s*shop\.business_hours/,
    '店舗SSRの ssrShop に営業時間（business_hours）を載せていません');
  requireMatch(ssrShopBlock, /\bprice_system:\s*shop\.price_system/,
    '店舗SSRの ssrShop に料金（price_system）を載せていません');
  rejectMatch(ssrShopBlock, /\braw_data\s*:/,
    '店舗SSRの ssrShop に raw_data を載せています（1店約12KBのブロブがHTMLに焼き込まれます）');
  const shopPage = strip(read('src/pages/ShopDetailPage.jsx'));
  requireMatch(shopPage, /shop\?\.price_system/,
    '店舗ページが shop.price_system を読んでいません（SSRで渡している名前と揃えること）');
  requireMatch(shopPage, /shop\.business_hours/,
    '店舗ページが shop.business_hours を読んでいません（SSRで渡している名前と揃えること）');
}

// ── トップの WebSite 構造化データ（2026-09-23）────────────────────────────
// Google は検索結果の「サイト名」を、トップの WebSite 構造化データから最優先で読む。
// 店舗・ブランド・エリアには構造化データがあったが、トップには1つも無かった。
{
  const index = strip(read('pages/index.jsx'));
  requireMatch(index, /'@type': 'WebSite'/,
    'トップ（pages/index.jsx）に WebSite の構造化データがありません（検索結果のサイト名の指定が消えます）');
  requireMatch(index, /name: 'メンエスマップ'/,
    'トップの WebSite 構造化データのサイト名が「メンエスマップ」ではありません（og:site_name と揃える）');
  requireMatch(index, /<Head>[\s\S]*?application\/ld\+json[\s\S]*?WEBSITE_LD[\s\S]*?<\/Head>/,
    'トップの WebSite 構造化データが <Head> の中で出力されていません（初期HTMLに入りません）');
  rejectMatch(index, /SearchAction/,
    'トップの構造化データに SearchAction があります（Googleはサイトリンク検索ボックスの表示をやめています。付けない）');
}

// 🚩 県のページの一覧（src/data/areaLinks.js）とサイトマップの県の一覧（api/sitemap.xml.js）が同じであること。
//    サイトマップは Vercel の関数なので src/ を import せずリテラルで持っている＝2か所を手で揃えるしかない。
//    2026-09-30、岐阜・三重を areaLinks.js に足したのにサイトマップに足し忘れ、ビルドは緑のまま載らなかった
//    （同じ日に、6月に登録した8県がどちらにも無く /area/<県> が404だったことも分かった）。
{
  const areaSrc = strip(read('src/data/areaLinks.js'));
  const mapBody = areaSrc.match(/PREF_SLUG_MAP\s*=\s*\{([\s\S]*?)\};/)?.[1] || '';
  const slugs = [...mapBody.matchAll(/^\s*([a-z]+)\s*:/gm)].map((m) => m[1]);
  const hidden = [...(areaSrc.match(/HIDDEN_FROM_LINKS\s*=\s*new Set\(\[([^\]]*)\]/)?.[1] || '').matchAll(/'([a-z]+)'/g)].map((m) => m[1]);
  const smList = strip(sitemap).match(/\.\.\.\[([^\]]*)\]\.map\(slug => \(\{\s*path: `\/area\//)?.[1];
  const inSitemap = [...(smList || '').matchAll(/'([a-z]+)'/g)].map((m) => m[1]);
  if (slugs.length < 10 || !smList) {
    failures.push('[県の一覧] areaLinks.js の PREF_SLUG_MAP かサイトマップの県の一覧を読み取れません（書き方が変わったならこの検査も直すこと）');
  } else {
    const want = slugs.filter((s) => !hidden.includes(s));
    const missing = want.filter((s) => !inSitemap.includes(s));
    const extra = inSitemap.filter((s) => !slugs.includes(s));
    if (missing.length) failures.push(`[県の一覧] 県のページがあるのにサイトマップに載っていません: ${missing.join(', ')}（api/sitemap.xml.js に足すこと）`);
    if (extra.length) failures.push(`[県の一覧] サイトマップに載っているのに県のページがありません（soft404/404）: ${extra.join(', ')}（src/data/areaLinks.js に足すか外すこと）`);
    const hiddenListed = inSitemap.filter((s) => hidden.includes(s));
    if (hiddenListed.length) failures.push(`[県の一覧] 掲載数が少なく出さないことにした県がサイトマップに載っています: ${hiddenListed.join(', ')}`);
  }
}

// ────────────────────────────────────────────────────────────
// 🚩 2026-10-10 記事「Claude Opus 5.5 で SEO」の基準で本番を点検して見つけた4つの穴。
//    どれも**壊れても画面は正常に見える**型なので、戻ったらビルドを止める。
// ────────────────────────────────────────────────────────────
{
  const threadCode = strip(threadWrapper);
  const sitemapCode = strip(sitemap);
  const areaCode = strip(read('pages/area/[pref].jsx'));
  const brandWrapperCode = strip(read('pages/brands/[brandId].jsx'));
  const brandPageCode = strip(read('src/pages/BrandPage.jsx'));
  const appCode = strip(read('pages/_app.jsx'));
  const dataCtxCode = strip(read('src/contexts/DataContext.jsx'));
  const homeWrapperCode = strip(read('pages/index.jsx'));
  const shopWrapperCode = strip(shopWrapper);
  const popularWrapperCode = strip(popularWrapper);
  const popularPageCode = strip(popularPage);

  // ① 同じ人のページは1つを正規URLにする（13人・28URLが同じ中身で Google に載せてよい状態だった）
  requireMatch(threadCode, /pickCanonicalPersonPage\(publicReviews\)/,
    '[正規URL] 人物ページが正規URLを口コミから決めていません（同じ人の別ルームのページが、どれも自分を正規と名乗ります）');
  requireMatch(threadCode, /ssrCanonicalPath:\s*canonicalPath/,
    '[正規URL] 人物ページのSSRが正規URL（ssrCanonicalPath）を画面に渡していません');
  requireMatch(threadCode, /const canonicalUrl = [^;]*ssrCanonicalPath/,
    '[正規URL] 人物ページの canonical が SSR の正規URLを使っていません（自分のURLを組み立て直すと重複が戻ります）');
  requireMatch(sitemapCode, /buildReviewedPeople\(/,
    '[正規URL] サイトマップが人物ページを人でまとめていません（同じ人のURLを2つ出すか、canonical と食い違います）');
  requireMatch(sitemapCode, /people\.map\(\(p\) => urlXml\(p\.canonicalPath/,
    '[正規URL] サイトマップの人物ページが正規URLを出していません');
  rejectMatch(sitemapCode, /urlXml\(`\/shops\/\$\{r\.shop_id\}\/threads\/\$\{r\.therapist_id\}`/,
    '[正規URL] サイトマップが口コミ1件ごとのURLを出しています（同じ人のURLが重複します）');
  for (const [where, code] of [['人物ページ', threadCode], ['ブランドページ', brandPageCode]]) {
    rejectMatch(code, /(?:href|to)=\{`\/shops\/\$\{t\.shopId\}\/threads\/\$\{t\.therapistId\}`\}/,
      `[正規URL] ${where}の人物リンクが正規URLを通っていません`);
  }
  rejectMatch(brandPageCode, /to=\{`\/shops\/\$\{(?:t\.shopId(?: \|\| reviewShopId)?|r\.shop_id)\}\/threads\/\$\{(?:t\.id|r\.therapist_id)\}`\}/,
    '[正規URL] ブランドページの人物リンクが正規URLを通っていません（口コミの書かれていないルームのページを指します）');
  requireMatch(brandWrapperCode, /ssrPersonCanonical=\{ssrPersonCanonical\}/,
    '[正規URL] ブランドページのSSRが正規URLの表（ssrPersonCanonical）を画面に渡していません');

  // ② 口コミページへの消えない本文リンク（74枚すべてが5本未満・平均1.8本だった）
  requireMatch(threadCode, /ringNeighbors\(orderPeopleForRing\(people\),\s*me\.key,\s*MORE_REVIEWED_COUNT\)/,
    '[内部リンク] 人物ページの「ほかの口コミ」が並び順の後ろの人を出していません（全員が同じ本数を受ける性質が崩れます）');
  requireMatch(threadCode, /ssrMoreReviewed\.map\(/,
    '[内部リンク] 人物ページが「ほかの口コミ」を描いていません');
  requireMatch(threadCode, /const MORE_REVIEWED_COUNT = ([4-9]|\d{2,});/,
    '[内部リンク] 「ほかの口コミ」の人数が4未満です（店のページ・県のページと合わせて5本以上にならない）');
  requireMatch(areaCode, /peopleInPrefecture\(people,\s*prefName\)/,
    '[内部リンク] 県のページが「口コミがある人」の全員を出していません');
  requireMatch(areaCode, /reviewedPeople\.map\(/,
    '[内部リンク] 県のページが「口コミがある人」を描いていません');
  rejectMatch(areaCode, /\.in\('shop_id',\s*shopIds\.slice\(/,
    '[内部リンク] 県のページの最新の口コミが代表ルームのidだけで引かれています（代表以外のルームの口コミが県ページに出ません）');
  requireMatch(areaCode, /url:\s*`\$\{SITE\}\$\{s\.href/,
    '[301] 県のページの ItemList が本命URL（s.href）を使っていません（複数ルームのブランドは301するURLになります）');

  // ③ 投稿フォームは Google に載せない（題名も noindex も無い183字のページが店の数だけあった）
  for (const f of ['pages/post-review.jsx', 'pages/shops/[shopId]/review.jsx', 'pages/shops/[shopId]/threads/[threadId]/review.jsx']) {
    const code = strip(read(f));
    requireMatch(code, /<SeoHead\b[^>]*\bnoindex\b[^>]*\/>/,
      `[noindex] ${f} が最初から noindex と題名を出していません（中身の同じフォームが Google に載せてよい状態に戻ります）`);
    rejectMatch(code, /^\s*export \{ default \} from/m,
      `[noindex] ${f} が中身を素通しする形に戻っています（フォームは投稿先を確かめるまで SeoHead を描きません）`);
  }

  // ④ 最初のHTMLのリンク先（21か所・118本が301する店舗URLを指していた）
  requireMatch(appCode, /<DataProvider seedRoomCounts=\{pageProps\.ssrRoomCounts\}>/,
    '[301] _app が SSR のルーム数（ssrRoomCounts）を DataProvider に渡していません（最初のHTMLの店舗リンクが301に倒れます）');
  requireMatch(dataCtxCode, /if \(shops\.length\) return countRoomsByBrand\(shops\);\s*return new Map\(Object\.entries\(seedRoomCounts/,
    '[301] DataContext が全店を読む前に SSR のルーム数を使っていません');
  for (const [where, code] of [
    ['トップ', homeWrapperCode], ['店舗ページ', shopWrapperCode], ['ブランドページ', brandWrapperCode], ['みんなの口コミ', popularWrapperCode],
  ]) {
    requireMatch(code, /loadMultiRoomCounts\(supabase\)/, `[301] ${where}のSSRがルーム数を取っていません`);
    requireMatch(code, /\bssrRoomCounts\b[,\s]/, `[301] ${where}のSSRが ssrRoomCounts を props に載せていません`);
  }
  requireMatch(threadCode, /ssrRoomCounts,\s*\n/, '[301] 人物ページのSSRが ssrRoomCounts を props に載せていません');
  requireMatch(areaCode, /ssrRoomCounts,?\s*\n\s*\},/, '[301] 県のページのSSRが ssrRoomCounts を props に載せていません');
  rejectMatch(threadCode, /`\$\{SITE\}\/shops\/\$\{ssrShop\.id\}`/,
    '[301] 人物ページの構造化データが店舗URLを直書きしています（複数ルームのブランドは301するURLになります）');
  requireMatch(popularPageCode, /group_id:\s*shopById\?\.\[r\.shop_id\]\?\.group_id \?\? shopMap\?\.\[r\.shop_id\]\?\.group_id/,
    '[301] みんなの口コミの店舗リンクが、SSR の店舗表（shopMap）の group_id を使っていません（最初のHTMLで店舗URL＝301になります）');
  requireMatch(popularWrapperCode, /group_id:\s*shop\.group_id/,
    '[301] みんなの口コミのSSRが店舗表に group_id を載せていません');
}

if (failures.length) {
  console.error('❌ インデックス導線の回帰を検出:');
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log('✅ 口コミページのSSR・正規内部リンク・sitemap更新日ガード OK');
