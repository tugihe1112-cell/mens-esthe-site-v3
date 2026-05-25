/**
 * 愛知県 shop画像が未設定の店舗に対してホームページからロゴ画像を探す
 * 実行: node scripts/maintenance/fix_aichi_missing_images.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchHtml(url) {
  const res = await fetch(url, { headers: ua, signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

async function uploadShopLogo(imageUrl, shopId) {
  try {
    const res = await fetch(imageUrl, { headers: ua, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const ext = (imageUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || 'jpg').toLowerCase();
    const safeExt = ext === 'jpeg' ? 'jpg' : ext;
    const { error } = await supabase.storage.from('shop-logos')
      .upload(`${shopId}.${safeExt}`, buf, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
    if (error) return imageUrl; // Storage失敗時は直接URL
    return supabase.storage.from('shop-logos').getPublicUrl(`${shopId}.${safeExt}`).data.publicUrl;
  } catch { return null; }
}

/**
 * ホームページからロゴ画像候補を探す（og:image以外）
 * 優先順:
 * 1. img[src*="logo"] or img[alt*="ロゴ"] or img[class*="logo"]
 * 2. header/nav 内の最初の画像
 * 3. ページ上部の最初の画像（200px以上想定、URLに logo/brand/head が含まれる）
 * 4. ページ最初の画像
 */
async function findLogoImage(baseUrl) {
  let html;
  try {
    html = await fetchHtml(baseUrl);
  } catch (e) {
    return null;
  }
  const $ = cheerio.load(html);

  const toAbs = (src) => {
    if (!src || src.startsWith('data:')) return null;
    if (src.startsWith('//')) return `https:${src}`;
    if (src.startsWith('http')) return src;
    try { return new URL(src, baseUrl).href; } catch { return null; }
  };

  // NG: base64、プレースホルダー、svgスプライト、*.gif（アニメ可能性）
  const isLikelyBad = (url) => !url || url.includes('*') || /\.(svg)$/.test(url.split('?')[0]);

  // 1. src/alt/class に logo を含む
  let found = null;
  $('img').each((_, el) => {
    if (found) return;
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt') || '';
    const cls = $(el).attr('class') || '';
    const id  = $(el).attr('id') || '';
    if (/logo|brand|title/i.test(src + alt + cls + id)) {
      const abs = toAbs(src);
      if (abs && !isLikelyBad(abs) && /\.(jpg|jpeg|png|webp|gif)/i.test(abs)) {
        found = abs;
      }
    }
  });
  if (found) return found;

  // 2. header/nav 内の最初の画像
  $('header, nav, #header, .header, #gnav, .gnav, .site-header').each((_, el) => {
    if (found) return;
    $(el).find('img').each((__, img) => {
      if (found) return;
      const src = $(img).attr('src') || '';
      const abs = toAbs(src);
      if (abs && !isLikelyBad(abs) && /\.(jpg|jpeg|png|webp|gif)/i.test(abs)) {
        found = abs;
      }
    });
  });
  if (found) return found;

  // 3. URLにlogo/head/topが含まれる画像
  $('img').each((_, el) => {
    if (found) return;
    const src = $(el).attr('src') || '';
    if (/logo|head|top|main|visual/i.test(src)) {
      const abs = toAbs(src);
      if (abs && !isLikelyBad(abs) && /\.(jpg|jpeg|png|webp)/i.test(abs)) {
        found = abs;
      }
    }
  });
  if (found) return found;

  // 4. ページ最初の実画像
  $('img').each((_, el) => {
    if (found) return;
    const src = $(el).attr('src') || '';
    const abs = toAbs(src);
    if (abs && !isLikelyBad(abs) && /\.(jpg|jpeg|png|webp)/i.test(abs)) {
      found = abs;
    }
  });
  return found;
}

// 対象: image_urlが未設定 or 壊れている(*/nagoyaassets)
const { data: shops } = await supabase.from('shops')
  .select('id,name,website_url,image_url')
  .filter('raw_data->>prefecture', 'eq', '愛知県')
  .not('website_url', 'is', null)
  .order('id');

const targets = (shops || []).filter(s =>
  !s.image_url || s.image_url.includes('*') || s.image_url.includes('nagoyaassets')
);

console.log(`画像修正対象: ${targets.length}件\n`);

for (const s of targets) {
  console.log(`[${s.name}]`);
  const imgUrl = await findLogoImage(s.website_url);

  if (!imgUrl) {
    console.log(`  ❌ 画像が見つかりません`);
    await sleep(500);
    continue;
  }

  console.log(`  候補: ${imgUrl.slice(0, 80)}`);

  if (DRY_RUN) {
    console.log(`  [DRY] → ${imgUrl.slice(0, 80)}`);
  } else {
    const stored = await uploadShopLogo(imgUrl, s.id);
    if (stored) {
      const { error } = await supabase.from('shops').update({ image_url: stored }).eq('id', s.id);
      if (error) {
        console.log(`  ❌ DB更新失敗: ${error.message}`);
      } else {
        console.log(`  ✅ 設定: ${stored.slice(0, 70)}`);
      }
    } else {
      console.log(`  ⚠️ 画像取得/アップロード失敗`);
    }
  }
  await sleep(500);
}

console.log('\n完了');
