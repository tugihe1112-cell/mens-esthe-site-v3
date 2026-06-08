/**
 * 大阪 未登録店舗 自動登録スクリプト
 * mens-mg.comから全エリアランキングを取得し、DB未登録店舗を登録する
 * 実行: node scripts/maintenance/process_osaka_missing_shops.mjs [--dry-run]
 */
import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

const OSAKA_AREAS = [
  { name: '梅田',       id: '270010', pref: '大阪府' },
  { name: '日本橋・難波', id: '270020', pref: '大阪府' },
  { name: '堺筋本町',   id: '270030', pref: '大阪府' },
  { name: '心斎橋',     id: '270040', pref: '大阪府' },
  { name: '京橋',       id: '270050', pref: '大阪府' },
  { name: '谷町',       id: '270060', pref: '大阪府' },
  { name: '新大阪',     id: '270070', pref: '大阪府' },
  { name: '堺東',       id: '270080', pref: '大阪府' },
];

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000) });
  return res.text();
}

async function getOgImage(url) {
  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    return $('meta[property="og:image"]').attr('content')
      || $('meta[name="twitter:image"]').attr('content')
      || $('link[rel="apple-touch-icon"]').attr('href')
      || null;
  } catch { return null; }
}

function normDomain(url) {
  return (url || '').replace(/https?:\/\/(www\.)?/, '').split('/')[0].toLowerCase();
}

function makeShopId(area, name) {
  const areaMap = {
    '梅田': 'umeda', '日本橋・難波': 'nippombashi', '堺筋本町': 'sakaihonmachi',
    '心斎橋': 'shinsaibashi', '京橋': 'kyobashi', '谷町': 'tanimachi',
    '新大阪': 'shinsosaka', '堺東': 'sakaihigashi'
  };
  const areaKey = areaMap[area] || area;
  const nameKey = name.replace(/[～〜\s・「」（）()\-【】~＆&『』]/g, '').toLowerCase().slice(0, 15);
  return `osaka_${areaKey}_${nameKey}`;
}

// mens-mg.comから全エリアのshop情報を取得
async function fetchRankingShops() {
  const allShops = [];
  for (const area of OSAKA_AREAS) {
    console.log(`  ${area.name} ランキング取得中...`);
    try {
      const html = await fetchHtml(`https://mens-mg.com/ranking_area.php?area=${area.id}`);
      const $ = cheerio.load(html);
      const shopIds = [...new Set(
        $('a[href*="shop.php"]').map((_, el) => $(el).attr('href').match(/id=(\d+)/)?.[1]).get().filter(Boolean)
      )].slice(0, 20);

      for (const shopId of shopIds) {
        try {
          const shopHtml = await fetchHtml(`https://mens-mg.com/shop.php?id=${shopId}`);
          const $s = cheerio.load(shopHtml);
          const shopName = $s('h1').first().text().replace(/.*「(.+?)」.*/, '$1').trim();
          const extLinks = $s('a').map((_, el) => $s(el).attr('href')).get()
            .filter(h => h && !h.includes('mens-mg.com') && h.startsWith('http'));
          const websiteUrl = extLinks[0] || '';
          if (shopName && websiteUrl) {
            allShops.push({ name: shopName, website_url: websiteUrl, area: area.name });
          }
        } catch { /* skip */ }
        await new Promise(r => setTimeout(r, 300));
      }
    } catch(e) { console.error(`  ${area.name} ERROR: ${e.message}`); }
  }
  return allShops;
}

// DB から大阪の全shop取得
console.log('DBから大阪店舗を取得中...');
const { data: dbShops } = await supabase
  .from('shops')
  .select('id, name, website_url')
  .eq('raw_data->>prefecture', '大阪府');

const dbDomains = new Set((dbShops || []).map(s => normDomain(s.website_url)));
const dbIds = new Set((dbShops || []).map(s => s.id));
console.log(`DB大阪店舗数: ${dbShops?.length || 0}件\n`);

// mens-mg.comからランキング取得
console.log('mens-mg.comからランキング取得中...');
const rankingShops = await fetchRankingShops();
console.log(`ランキング店舗数（重複込み）: ${rankingShops.length}件`);

// 重複除去・未登録フィルタ
const seen = new Set();
const missingShops = rankingShops.filter(s => {
  const domain = normDomain(s.website_url);
  if (!domain || dbDomains.has(domain) || seen.has(domain)) return false;
  seen.add(domain);
  return true;
});

console.log(`\n未登録店舗: ${missingShops.length}件\n`);

// 登録処理
let inserted = 0, skipped = 0;
for (const shop of missingShops) {
  const id = makeShopId(shop.area, shop.name);
  if (dbIds.has(id)) { skipped++; continue; }

  const image_url = await getOgImage(shop.website_url);
  console.log(`  + [${shop.area}] ${shop.name} → image: ${image_url ? '✓' : 'null'}`);

  if (!DRY_RUN) {
    const { error } = await supabase.from('shops').insert({
      id,
      name: shop.name,
      website_url: shop.website_url,
      image_url,
      raw_data: { prefecture: '大阪府', area: shop.area },
    });
    if (error) { console.error(`    ERROR: ${error.message}`); continue; }
  }
  inserted++;
  await new Promise(r => setTimeout(r, 200));
}

console.log(`\n============================`);
console.log(`登録: ${inserted}件 / スキップ: ${skipped}件 (dry-run: ${DRY_RUN})`);
