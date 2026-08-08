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

const STATIC_PAGES = [
  { path: '/',                priority: '1.0' },
  { path: '/search',          priority: '0.8' },
  { path: '/area-search',     priority: '0.8' },
  { path: '/shops',           priority: '0.9' },
  { path: '/stats',           priority: '0.8' },
  { path: '/ranking',         priority: '0.9' },
  { path: '/popular-reviews', priority: '0.7' },
  { path: '/new-therapists',  priority: '0.7' },
  { path: '/board',           priority: '0.6' },
  { path: '/contact',         priority: '0.5' },
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
const EXCLUDED_ID_PATTERNS = [/^test_/i, /^demo_/i, /^sample_/i, /_test$/i];
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

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // ── 1. 全店舗 ID 取得 ──
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
    if (error || !data || data.length === 0) break;
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
    if (error || !data || data.length === 0) break;
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

  // ── 3. XML 組み立て ──
  const staticXml = STATIC_PAGES.map(p => `  <url>
    <loc>${encodeUrl(p.path)}</loc>
    <lastmod>${TODAY}</lastmod>
    <priority>${p.priority}</priority>
  </url>`).join('\n');

  const shopXml = (shops || []).filter(s => !isExcludedId(s.id)).map(s => `  <url>
    <loc>${encodeUrl(`/shops/${s.id}`)}</loc>
    <lastmod>${TODAY}</lastmod>
    <priority>0.7</priority>
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
