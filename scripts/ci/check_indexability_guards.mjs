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
requireMatch(popularPage, /const shopLink = r\.shop_id \? `\/shops\/\$\{r\.shop_id\}`/, '口コミ一覧の店舗リンクが正規店舗URLではありません');

requireMatch(threadWrapper, /renderSeo=\{false\}/, 'セラピストページのSEO出力がSSR側へ一本化されていません');
requireMatch(threadWrapper, /'@type': 'ProfilePage'/, 'セラピストをProfilePageとして構造化していません');
requireMatch(threadPage, /to=\{`\/shops\/\$\{shopId\}`\}/, 'セラピスト画面の店舗リンクが正規店舗URLではありません');
requireMatch(homeReview, /const shopLink = `\/shops\/\$\{r\.shopId\}`/, 'ホーム口コミの店舗リンクが正規店舗URLではありません');
requireMatch(brandResult, /to=\{`\/shops\/\$\{shop\.id\}`\}/, 'ブランド一覧の店舗リンクが正規店舗URLではありません');
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
  requireMatch(brandPage, /roster\.map\(/,
    'ブランドページが在籍セラピストを描画していません');
  // 🚩 人単位の重複除去は buildBrandRoster に一本化する。
  //    SSRと画面で別々に畳むと、片方だけ「咲さんが3ルームぶん3回出る」に戻る。
  requireMatch(brandWrapper, /buildBrandRoster\(/,
    'ブランドページSSRの在籍セラピストが buildBrandRoster を通っていません');
  requireMatch(brandPage, /buildBrandRoster\(/,
    'ブランドページの在籍セラピストが buildBrandRoster を通っていません');
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
  requireMatch(brandPage, /to=\{brandCanonicalPath\(b\)\}/,
    'ブランドページの他ブランドリンクが本命URL規則を通っていません（単独店の存在しない /brands/ へ送ります）');
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

// ── D-014 複数ルームのブランドへの集約（2026-09-14）──────────────────
// 301・サイトマップ・内部リンクは**同時に**動かないと壊れる。片方だけ直す事故を機械で止める。
{
  const shopWrapper = strip(read('pages/shops/[shopId]/index.jsx'));
  const sitemap = strip(read('api/sitemap.xml.js'));
  const monitor = strip(read('scripts/monitoring/check_http_status.mjs'));
  const brandPage2 = strip(read('src/pages/BrandPage.jsx'));
  const prefPage = strip(read('src/pages/PrefecturePage.jsx'));

  requireMatch(shopWrapper, /redirect: \{ destination: redirectTo, permanent: true \}/,
    '店舗ページからブランドページへの301が消えています（D-014）');
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
  requireMatch(prefPage, /to=\{brandCanonicalPath\(shop\)\}/,
    'エリア一覧のリンクが本命URL規則を通っていません');
}
requireMatch(postReviewPage, /data\.shopId \? `\/shops\/\$\{data\.shopId\}`/, '指名なし投稿後のリンクが正規店舗URLではありません');
for (const [name, source] of [['表彰台', podiumCard], ['ランキング一覧', rankingListItem]]) {
  requireMatch(source, /item\.therapistId\s*\|\|\s*item\.id/, `${name}が実データのtherapistIdを使っていません`);
  rejectMatch(source, /threads\/\$\{item\.id\}/, `${name}が存在しないitem.idを直接リンクに使っています`);
}

rejectMatch(sitemap, /const TODAY\b|<lastmod>\$\{TODAY\}/, 'sitemapが全URLを毎日更新扱いにしています');
requireMatch(sitemap, /select\('id, shop_id, therapist_id, created_at'\)/, 'sitemapが実際の口コミ更新日を取得していません');
rejectMatch(sitemap, /\.not\('therapist_id',\s*'is',\s*null\)/, '指名なし口コミの店舗がsitemapから漏れます');
requireMatch(sitemap, /lastmod:\s*shopLastmod\.get\(s\.id\)/, '店舗sitemapのlastmodが実口コミ更新日ではありません');
requireMatch(integrityMonitor, /根拠のないlastmodが付いている/, '本番監視がsitemapの偽lastmodを検出しません');
requireMatch(integrityMonitor, /口コミの実更新日が無い/, '本番監視が口コミURLのlastmod欠落を検出しません');

if (failures.length) {
  console.error('❌ インデックス導線の回帰を検出:');
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log('✅ 口コミページのSSR・正規内部リンク・sitemap更新日ガード OK');
