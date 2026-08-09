/**
 * check_http_status.mjs — 「存在しないページが200を返していないか」「実在ページを404にしていないか」を外形監視する
 *
 * 【なぜ必要か】
 * 2026-08-10、GSCから「重複しています。ユーザーにより、正規ページとして選択されていません（30件）」の
 * 通知が来た。調べると `/shops/brand_<hash>` 等の**存在しないURLがHTTP 200で「Shop not found」画面**を返し、
 * canonicalもnoindexも無い状態だった＝Googleから見ると「中身がほぼ同じ空ページが30枚」＝重複。
 * これは 2026-08-06 に `/area/ibaraki|tochigi|gunma` で直したソフト404と**まったく同じ型**で、
 * 場所を変えて再発していた。だから人間の記憶ではなく機械で見張る。
 *
 * 【この監視のキモ＝両方向を見ること】
 *  (a) 消えたページが 404 を返すか   … 放置するとインデックス品質が落ちる（今回の事故）
 *  (b) 実在ページが 200 を返すか     … こちらが**遥かに重大**。404化の実装ミスやDB障害で
 *                                      1,098ページを一斉に「消滅」とGoogleに宣言してしまう。
 *      そのため MUST_200 には必ず実在URLを入れておくこと。
 *
 * 実行: node scripts/monitoring/check_http_status.mjs
 *   BASE_URL 環境変数で対象を切り替え可（既定は本番）
 */

const BASE = process.env.BASE_URL || 'https://www.mens-esthe-map.jp';

// 実在しないURL（過去に削除された重複店・legacyのbrand_ハッシュ・明らかなダミー）
// → 404 が返るのが正しい
const MUST_404 = [
  '/shops/brand_59990861bb3800cabcb47ca6dd5d1b5f',
  '/shops/tokyo_shinjuku_nishishinjuku_cor_caroli',
  '/shops/__no_such_shop_monitor__',
  '/shops/kanagawa_sagamihara_unison_spa/threads/__no_such_therapist_monitor__',
];

// 実在するURL → 200 が返るのが正しい（404化やDB障害の巻き添えを検知する安全網）
const MUST_200 = [
  '/',
  '/shops/kanagawa_sagamihara_unison_spa',
  '/shops/hiroshima_hiroshima_hitozuma_san',
  '/area/tokyo',
  '/area/gunma',
];

// index されるべきなのに noindex が付いていないか（8/6に直したエリアページの再発検知）
const MUST_BE_INDEXABLE = ['/area/tokyo', '/area/gunma', '/area/hiroshima'];

const failures = [];

async function head(path) {
  const url = BASE + path;
  // 404判定にリダイレクトを混ぜたくないので manual
  const res = await fetch(url, { redirect: 'manual', headers: { 'User-Agent': 'mens-esthe-map-monitor/1.0' } });
  return res;
}

for (const path of MUST_404) {
  try {
    const res = await head(path);
    if (res.status !== 404) {
      failures.push(
        `[soft404] ${path} が ${res.status} を返した（404であるべき）。\n` +
        `          存在しないページを200で返すとGoogleが「重複・正規ページ未選択」と判定する。`
      );
    }
  } catch (e) {
    failures.push(`[soft404] ${path} の取得に失敗: ${e.message}`);
  }
}

for (const path of MUST_200) {
  try {
    const res = await head(path);
    if (res.status !== 200) {
      failures.push(
        `[🚨実在ページが落ちている] ${path} が ${res.status} を返した（200であるべき）。\n` +
        `          404化の実装ミスかDB障害の可能性。放置するとインデックスが崩落する。`
      );
    }
  } catch (e) {
    failures.push(`[🚨実在ページ] ${path} の取得に失敗: ${e.message}`);
  }
}

for (const path of MUST_BE_INDEXABLE) {
  try {
    const res = await fetch(BASE + path, { headers: { 'User-Agent': 'mens-esthe-map-monitor/1.0' } });
    const html = await res.text();
    const m = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i);
    if (m && /noindex/i.test(m[1])) {
      failures.push(`[noindex誤爆] ${path} に noindex が付いている（content="${m[1]}"）。`);
    }
  } catch (e) {
    failures.push(`[noindex確認] ${path} の取得に失敗: ${e.message}`);
  }
}

if (failures.length) {
  console.error('\n🚨 HTTPステータス外形監視で異常を検出:\n');
  failures.forEach((f) => console.error('  - ' + f + '\n'));
  process.exit(1);
}

console.log(`✅ HTTPステータス正常（404であるべき ${MUST_404.length}件 / 200であるべき ${MUST_200.length}件 / index可 ${MUST_BE_INDEXABLE.length}件）`);
