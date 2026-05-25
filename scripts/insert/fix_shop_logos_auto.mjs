/**
 * 店舗画像（image_url）自動設定
 * OGP画像 / サイトロゴを取得してshopsテーブルのimage_urlに保存
 * 実行: node scripts/insert/fix_shop_logos_auto.mjs [--area=osaka] [--dry-run]
 */
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const AREA_FILTER = args.find(a => a.startsWith('--area='))?.split('=')[1] || null;

const ua = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ja,en-US;q=0.7',
};

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
const supabase = createClient(supabaseUrl, supabaseKey);
const h = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` };

async function fetchHtml(url, timeout = 12000) {
  const res = await fetch(url, { headers: ua, signal: AbortSignal.timeout(timeout) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

// サイトから画像URLを検出（優先順位順）
function findLogoUrl(html, siteUrl) {
  const $ = cheerio.load(html);

  // 1. OGP画像（最優先）
  const ogImage = $('meta[property="og:image"]').attr('content');
  if (ogImage) {
    try {
      return ogImage.startsWith('http') ? ogImage : new URL(ogImage, siteUrl).href;
    } catch {}
  }

  // 2. Twitter Card画像
  const twitterImage = $('meta[name="twitter:image"]').attr('content');
  if (twitterImage) {
    try {
      return twitterImage.startsWith('http') ? twitterImage : new URL(twitterImage, siteUrl).href;
    } catch {}
  }

  // 3. caskan ロゴ
  const caskanLogoMatch = html.match(/cdn2-caskan\.com\/caskan\/img\/shop_logo\/([^"'\s]+)/);
  if (caskanLogoMatch) return `https://cdn2-caskan.com/caskan/img/shop_logo/${caskanLogoMatch[1]}`;

  // 4. ヘッダーのロゴ画像
  const headerLogo = $('header img, .header img, #header img, .logo img, #logo img').first();
  const headerSrc = headerLogo.attr('src') || headerLogo.attr('data-src') || '';
  if (headerSrc && !/favicon/i.test(headerSrc)) {
    try {
      return headerSrc.startsWith('http') ? headerSrc : new URL(headerSrc, siteUrl).href;
    } catch {}
  }

  return null;
}

async function uploadLogo(imageUrl, shopId) {
  try {
    const res = await fetch(imageUrl, { headers: { 'User-Agent': ua['User-Agent'] }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const ext = imageUrl.split('.').pop()?.split('?')[0]?.toLowerCase().replace(/[^a-z]/g, '') || 'jpg';
    const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
    const fileName = `${shopId}.${safeExt}`;
    const { error } = await supabase.storage.from('shop-logos')
      .upload(fileName, buffer, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('shop-logos').getPublicUrl(fileName);
    return publicUrl;
  } catch { return null; }
}

// 対象店舗取得（image_urlが未設定でwebsite_urlがある店舗）
let query = `${supabaseUrl}/rest/v1/shops?website_url=not.is.null&select=id,name,website_url,image_url,schedule_url&order=id`;
if (AREA_FILTER) query += `&id=like.${AREA_FILTER}_*`;

const r = await fetch(query, { headers: h });
const allShops = await r.json();

if (!Array.isArray(allShops)) {
  console.error('取得エラー:', JSON.stringify(allShops));
  // image_urlカラムがない可能性があるためimage_urlで再試行
  const r2 = await fetch(query.replace('image_url,', '').replace(',image_url', ''), { headers: h });
  const fallback = await r2.json();
  console.log('レスポンス確認:', JSON.stringify(fallback[0]));
  process.exit(1);
}
const shops = allShops.filter(s => !s.image_url);
console.log(`image_url未設定: ${shops.length}/${allShops.length}件`);

// セラピスト登録済みの店舗のみ対象（ページネーション対応）
const therapists = [];
let offset = 0;
while (true) {
  const trRes = await fetch(`${supabaseUrl}/rest/v1/therapists?select=shop_id&limit=1000&offset=${offset}`, { headers: h });
  const page = await trRes.json();
  if (!Array.isArray(page) || page.length === 0) break;
  therapists.push(...page);
  if (page.length < 1000) break;
  offset += 1000;
}
const hasData = new Set(therapists.map(t => t.shop_id));

// URLでグループ化
const urlGroups = new Map();
for (const shop of shops) {
  if (!hasData.has(shop.id)) continue;
  const url = shop.website_url.replace(/\/$/, '').toLowerCase();
  if (!urlGroups.has(url)) urlGroups.set(url, []);
  urlGroups.get(url).push(shop);
}

console.log(`対象: ${[...urlGroups.values()].flat().length}件 (ユニークURL: ${urlGroups.size}件)`);
if (DRY_RUN) console.log('[DRY RUN MODE]');

let updated = 0, skipped = 0, failed = 0;

for (const [url, shopList] of urlGroups) {
  const siteUrl = shopList[0].website_url;
  try {
    const html = await fetchHtml(siteUrl);
    const logoUrl = findLogoUrl(html, siteUrl);

    if (!logoUrl) {
      console.log(`⚠️ ${siteUrl} → 画像未検出`);
      skipped++;
      continue;
    }

    console.log(`✅ ${siteUrl}`);
    console.log(`   → ${logoUrl.slice(0, 80)}`);

    if (!DRY_RUN) {
      // Supabase Storageにアップロード
      for (const shop of shopList) {
        const storedUrl = await uploadLogo(logoUrl, shop.id);
        const finalUrl = storedUrl || logoUrl;
        const { error } = await supabase.from('shops')
          .update({ image_url: finalUrl })
          .eq('id', shop.id);
        if (!error) {
          updated++;
          console.log(`   [${shop.id}] ${storedUrl ? '✅アップロード済' : '⚠️元URL使用'}`);
        } else {
          console.log(`   [${shop.id}] エラー: ${error.message}`);
        }
      }
    } else {
      shopList.forEach(s => { console.log(`   [DRY RUN] ${s.id}`); updated++; });
    }
  } catch (e) {
    console.log(`❌ ${siteUrl}: ${e.message}`);
    failed++;
  }

  await new Promise(r => setTimeout(r, 400));
}

console.log('\n' + '='.repeat(50));
console.log(`完了: ${updated}件設定, ${skipped}件画像未検出, ${failed}件エラー`);
