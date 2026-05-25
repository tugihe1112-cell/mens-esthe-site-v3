/**
 * 愛知県 shop画像 + schedule_url 一括修正
 * 実行: node scripts/maintenance/fix_aichi_logos_schedules.mjs [--dry-run]
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
  const res = await fetch(url, { headers: ua, signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return { html: await res.text(), status: res.status };
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

// schedule_url候補パス（優先順）
const SCHEDULE_PATHS = ['/schedule/', '/schedule.php', '/timetable/', '/attendance/', '/shift/'];

async function findScheduleUrl(baseUrl) {
  for (const path of SCHEDULE_PATHS) {
    try {
      const url = new URL(path, baseUrl).href;
      const res = await fetch(url, { headers: ua, method: 'HEAD', signal: AbortSignal.timeout(5000) });
      if (res.ok) return url;
    } catch {}
    await sleep(100);
  }
  // HEADで見つからない場合、トップページのリンクを検索
  try {
    const { html } = await fetchHtml(baseUrl);
    const $ = cheerio.load(html);
    let found = null;
    $('a[href]').each((_,el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text();
      if (!found && /schedule|timetable|出勤|シフト|スケジュール/i.test(href + text)) {
        try { found = new URL(href, baseUrl).href; } catch {}
      }
    });
    return found;
  } catch { return null; }
}

async function getOgImage(baseUrl) {
  try {
    const { html } = await fetchHtml(baseUrl);
    const $ = cheerio.load(html);
    const ogImg = $('meta[property="og:image"]').attr('content') || '';
    if (!ogImg) return null;
    // //domain/path 形式の修正
    if (ogImg.startsWith('//')) return `https:${ogImg}`;
    if (ogImg.startsWith('http')) return ogImg;
    return new URL(ogImg, baseUrl).href;
  } catch { return null; }
}

// 対象店舗
const { data: shops } = await supabase.from('shops')
  .select('id,name,website_url,schedule_url,image_url')
  .filter('raw_data->>prefecture', 'eq', '愛知県')
  .not('website_url', 'is', null)
  .order('id');

console.log(`処理対象: ${shops?.length}件\n`);

for (const s of (shops || [])) {
  const needsImg = !s.image_url || s.image_url.includes('*') || s.image_url.includes('nagoyaassets');
  const needsSched = !s.schedule_url;

  if (!needsImg && !needsSched) {
    console.log(`✅ ${s.name}: スキップ（両方OK）`);
    continue;
  }

  console.log(`\n[${s.name}]`);
  const updates = {};

  // === shop画像 ===
  if (needsImg) {
    const ogImg = await getOgImage(s.website_url);
    if (ogImg) {
      // 不正URLチェック (nagoyaassets等)
      let validUrl = ogImg;
      try { new URL(ogImg); } catch { validUrl = null; }

      if (validUrl) {
        if (DRY_RUN) {
          console.log(`  [DRY] shop画像: ${ogImg.slice(0, 70)}`);
        } else {
          const stored = await uploadShopLogo(ogImg, s.id);
          if (stored) {
            updates.image_url = stored;
            console.log(`  ✅ shop画像: ${stored.slice(0, 60)}`);
          } else {
            console.log(`  ⚠️ shop画像アップロード失敗`);
          }
        }
      } else {
        console.log(`  ⚠️ 不正OGP URL: ${ogImg}`);
      }
    } else {
      console.log(`  ⚠️ og:image なし`);
    }
    await sleep(200);
  }

  // === schedule_url ===
  if (needsSched) {
    const schedUrl = await findScheduleUrl(s.website_url);
    if (schedUrl) {
      if (DRY_RUN) {
        console.log(`  [DRY] schedule_url: ${schedUrl}`);
      } else {
        updates.schedule_url = schedUrl;
        console.log(`  ✅ schedule_url: ${schedUrl}`);
      }
    } else {
      console.log(`  ⚠️ schedule_url 見つからず`);
    }
    await sleep(300);
  }

  // DB更新
  if (!DRY_RUN && Object.keys(updates).length > 0) {
    const { error } = await supabase.from('shops').update(updates).eq('id', s.id);
    if (error) console.log(`  ❌ DB更新失敗: ${error.message}`);
  }

  await sleep(300);
}

console.log('\n完了');
