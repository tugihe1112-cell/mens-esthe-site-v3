/**
 * 口コミあり店舗・セラピストの索引導線を守る静的ガード。
 *
 * 2026-09-05時点で、店舗のSSRは「口コミN件」と言いながら本文が空、
 * /popular-reviews は初期HTMLが骨組みだけ、主要リンクは検索画面経由、
 * sitemapは全URLを毎日更新扱いにしていた。いずれかが戻ればビルドを止める。
 */
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const failures = [];
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
requireMatch(searchPage, /const shopDetailUrl = `\/shops\/\$\{shop\.id\}`/, '検索結果の店舗リンクが正規店舗URLではありません');
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
