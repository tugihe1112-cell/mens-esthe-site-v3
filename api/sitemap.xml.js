/**
 * Vercel サーバーレス関数 — 動的 sitemap.xml 生成
 * GET /sitemap.xml (vercel.json のリライト経由)
 *
 * - Service Role Key で RLS をバイパス
 * - is_public=true の口コミがあるセラピストページを自動収録
 * - 全店舗ページも収録
 * - 1時間キャッシュ
 */
import { createClient } from '@supabase/supabase-js';

const SITE = 'https://www.mens-esthe-map.jp';
const TODAY = new Date().toISOString().slice(0, 10);

// 🚩 2026-08-19 整理: **独自コンテンツを持つページだけ**を提出する。
//    以前は一覧・検索・ユーティリティも全部載せていたが、
//    GSC実測でインデックス成功率4.4%と判明したため、分母を増やす行為をやめる。
//  【外したもの】
//    /search        … クエリ次第で中身が変わる検索UI。独自コンテンツではない
//    /area-search   … エリアの選択UI。中身は /area/* にある
//    /shops         … 1,098件の一覧。その先の店舗ページを noindex にしたので提出価値なし
//    /ranking       … 口コミ3件以上の条件を満たす店が無く、現在は空状態を表示している
//    /new-therapists… 新着一覧。独自の文章が無い
//    /board         … ⚠️ D-006 で**UI導線を外している機能**。ユーザーが到達できない
//                     ページをGoogleに送っていた（本来これは載せてはいけない）
//    いずれも noindex にはしていない（内部リンクからは辿れる）。提出をやめただけ。
const STATIC_PAGES = [
  { path: '/',                priority: '1.0' },
  { path: '/stats',           priority: '0.9' }, // 唯一の一次データ
  { path: '/popular-reviews', priority: '0.8' }, // 実際の口コミを集約＝独自コンテンツ
  { path: '/contact',         priority: '0.3' },
  // ⚠️ このリストは src/data/areaLinks.js の AREA_LINKS と一致させること
  //    （＝PREF_SLUG_MAP から掲載数の少ない shiga を除いたもの）。
  //    ここは Vercel のサーバーレス関数で Next のバンドル対象外のため、
  //    src/ からの import はせず意図的にリテラルで持つ（import解決に失敗すると
  //    サイトマップごと落ちる＝今まさに直している事故と同じ形になるため）。
  //    県を増減したら areaLinks.js と両方直す。片方だけ直すと
  //    「サイトマップには載るがページが存在しない」soft404 が再発する。
  ...['tokyo','osaka','aichi','kanagawa','saitama','chiba',
      'hyogo','kyoto','fukuoka','miyagi','shizuoka',
      'hiroshima','hokkaido','ibaraki','tochigi','gunma'].map(slug => ({
    path: `/area/${slug}`, priority: '0.8',
  })),
];

// サイトマップに出してはいけないID（テスト/ダミーデータ）。
// 2026-08-08にGSCのサイトマップ実物を確認して `/shops/test_shop/threads/test_therapist` の混入が発覚。
// Googleに「中身のないテストページ」を送るのはインデックス品質の毀損なので必ず除外する。
// ⚠️ `manual_` は「リストにいない」セラピストを手入力した口コミ用の合成IDで、
//    therapists テーブルには存在しない。サイトマップに載せると
//    /shops/*/threads/manual_* が 404 になり、2026-08-10に潰したソフト404を
//    自分で作り直すことになる（今度は本物の404なのでより悪い）。必ず除外する。
const EXCLUDED_ID_PATTERNS = [/^test_/i, /^demo_/i, /^sample_/i, /_test$/i, /^manual_/i];
const isExcludedId = (id) => !id || EXCLUDED_ID_PATTERNS.some((re) => re.test(String(id)));

function xmlEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function encodeUrl(path) {
  // encodeURI はスラッシュ・コロンは保持し日本語等をエンコード
  return xmlEscape(encodeURI(SITE + path));
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).send('Method Not Allowed');
  }

  const databaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!databaseUrl || !serviceRoleKey) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Retry-After', '120');
    return res.status(503).send('Sitemap data source is unavailable');
  }
  const supabase = createClient(databaseUrl, serviceRoleKey);

  // 途中まで取得した不完全なXMLを200で長期キャッシュすると、正常URLが大量に
  // サイトマップから消えたように見える。依存DBの失敗は必ず503で再試行させる。
  const dataSourceUnavailable = () => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Retry-After', '120');
    return res.status(503).send('Sitemap data source is unavailable');
  };

  // 🚩 2026-08-19 方針転換: サイトマップに**全店舗を載せるのをやめる**。
  //
  //  【根拠】GSCのURL検査API実測（scripts/metrics/index_coverage_probe.mjs）
  //    ・27URL中インデックスされているのは**トップページ1枚だけ**
  //    ・/stats も口コミ投入済み3店舗も「Crawled - currently not indexed」
  //      ＝ Googleが08-05/08-06に見に来たうえで却下（口コミ投入は06-22なので、
  //         **口コミ入りの状態を見て却下している**）
  //    ・店舗サンプル20件のうち15件は**一度もクロールされていない**
  //    ・重複判定（別URLを正規と判断）は0件＝系列店の重複は問題ではなかった
  //
  //  【解釈】サイトマップ1,140URL提出に対しインデックス51件＝**成功率4.4%**。
  //    公式サイトから機械収集した薄いページを1,098枚ぶら下げていることが、
  //    サイト全体の品質シグナルを下げている。1枚良いページを足しても閾値を超えない。
  //
  //  【対処】独自コンテンツ（口コミ）を持つページだけを提出する。
  //    失うものは無い（これらのページの表示回数は現時点で0）。
  //    口コミが付いた店舗は下の shopIdsWithReviews に自動で入るので、
  //    **手動の戻し作業は不要**（運用に頼ると必ず忘れる）。
  //
  //  ⚠️ 元に戻す場合は、下の filter を外して全店舗を push すればよい。

  // ── 1. 全店舗 ID 取得（後段で口コミ有りだけに絞る） ──
  // ⚠️ `.limit(5000)` だけでは足りない。Supabase(PostgREST)はサーバー側の max-rows
  //    （既定1000）で頭打ちになるため、掲載1,098店のうち1,000店しかサイトマップに
  //    載っていなかった（2026-08-05に本番の /api/sitemap.xml を実測して発覚：
  //    <loc>合計1042 = 静的26 + 店舗1000 + セラピスト16）。
  //    range() で1000件ずつページングして全件取り切る。
  const PAGE = 1000;
  const shops = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('shops')
      .select('id')
      .order('id')
      .range(from, from + PAGE - 1);
    if (error) return dataSourceUnavailable();
    if (!data || data.length === 0) break;
    shops.push(...data);
    if (data.length < PAGE) break;
    if (shops.length >= 50000) break; // 暴走ガード
  }

  // ── 2. 口コミ公開セラピストページ取得 ──
  //    is_public=true または user_id='owner_manual' の口コミを持つセラピスト
  //    こちらも同じ max-rows(1000) に当たるため range() でページングする。
  const pubReviews = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('reviews')
      .select('shop_id, therapist_id')
      .or('is_public.eq.true,user_id.eq.owner_manual')
      .not('therapist_id', 'is', null)
      .order('shop_id')
      .range(from, from + PAGE - 1);
    if (error) return dataSourceUnavailable();
    if (!data || data.length === 0) break;
    pubReviews.push(...data);
    if (data.length < PAGE) break;
    if (pubReviews.length >= 100000) break; // 暴走ガード
  }

  // shop_id + therapist_id でユニーク化
  const therapistPages = [];
  if (pubReviews) {
    const seen = new Set();
    for (const r of pubReviews) {
      if (!r.therapist_id || !r.shop_id) continue;
      if (isExcludedId(r.shop_id) || isExcludedId(r.therapist_id)) continue; // テストデータ除外
      const key = `${r.shop_id}|${r.therapist_id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      therapistPages.push(r);
    }
  }

  // ── 2.5 口コミを持つ店舗だけに絞る ──
  //  ⚠️ therapist_id が無い口コミ（指名なし・手入力）も店舗ページの価値になるので、
  //     therapistPages ではなく pubReviews 全体から shop_id を拾うこと。
  //     ここを therapistPages 基準にすると、指名なし口コミしか無い店舗が漏れる。
  const shopIdsWithReviews = new Set(
    (pubReviews || []).map((r) => r.shop_id).filter((id) => id && !isExcludedId(id))
  );

  // ── 3. XML 組み立て ──
  const staticXml = STATIC_PAGES.map(p => `  <url>
    <loc>${encodeUrl(p.path)}</loc>
    <lastmod>${TODAY}</lastmod>
    <priority>${p.priority}</priority>
  </url>`).join('\n');

  // 🚩 口コミを持つ店舗だけを提出する（2026-08-19。理由は上部のコメント参照）。
  //    口コミが1件付けば shopIdsWithReviews に自動で入るので、戻し作業は不要。
  const indexableShops = (shops || []).filter(s => !isExcludedId(s.id) && shopIdsWithReviews.has(s.id));
  const shopXml = indexableShops.map(s => `  <url>
    <loc>${encodeUrl(`/shops/${s.id}`)}</loc>
    <lastmod>${TODAY}</lastmod>
    <priority>0.8</priority>
  </url>`).join('\n');

  const therapistXml = therapistPages.map(r => `  <url>
    <loc>${encodeUrl(`/shops/${r.shop_id}/threads/${r.therapist_id}`)}</loc>
    <lastmod>${TODAY}</lastmod>
    <priority>0.6</priority>
  </url>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticXml}
${shopXml}
${therapistXml}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  return res.status(200).send(xml);
}
