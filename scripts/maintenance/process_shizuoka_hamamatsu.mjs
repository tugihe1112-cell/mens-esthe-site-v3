/**
 * 静岡市・浜松 shop + therapist 登録スクリプト
 *
 * 対象: 静岡市TOP8 + 浜松TOP10(JS不可除く)
 * 実行: node scripts/maintenance/process_shizuoka_hamamatsu.mjs [--dry-run]
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
// global fetch available in Node 18+

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY');
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY || ANON_KEY);

const DRY_RUN = process.argv.includes('--dry-run');
const TARGET = process.argv.find(a => a.startsWith('--shop='))?.split('=')?.[1];

// ─── Utility ─────────────────────────────────────────────────────────────────

async function getOgImage(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      redirect: 'follow',
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    return $('meta[property="og:image"]').attr('content')
      || $('meta[name="twitter:image"]').attr('content')
      || $('link[rel="apple-touch-icon"]').attr('href')
      || null;
  } catch { return null; }
}

async function uploadImage(imageUrl, storagePath, referer = null) {
  try {
    const headers = { 'User-Agent': 'Mozilla/5.0' };
    if (referer) headers['Referer'] = referer;
    const res = await fetch(imageUrl, { headers });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const { error } = await supabase.storage
      .from('therapist-images')
      .upload(storagePath, buf, { contentType, upsert: true });
    if (error) { console.error('  Upload error:', error.message); return null; }
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(storagePath);
    return data.publicUrl;
  } catch (e) {
    console.error('  Upload exception:', e.message);
    return null;
  }
}

function isNoise(name) {
  if (!name || name.length === 0) return true;
  if (name.length > 12) return true;
  if (/イベント|キャンペーン|割引|求人|banner|logo|icon|LINE|Twitter|Instagram|noimage|ノーイメージ|お店|スタッフ一覧|新人$|エグゼ|VIP|MB可|SNS|公式|予約|料金|アクセス|フォロー|スケジュール/i.test(name)) return true;
  if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return true;
  return false;
}

// ─── Shop definitions ─────────────────────────────────────────────────────────

const SHOPS = [
  // ── 静岡市エリア ──────────────────────────────
  {
    id: 'shizuoka_shizuoka_eden',
    name: 'Eden (エデン)',
    website_url: 'http://www.ms-eden.com/',
    schedule_url: 'http://www.ms-eden.com/schedule/',
    area: '静岡市',
    prefecture: '静岡県',
    pattern: 'ml_11_1',
    staffUrl: 'http://www.ms-eden.com/staff/',
    baseUrl: 'http://www.ms-eden.com',
  },
  {
    id: 'shizuoka_shizuoka_fruit_in_the_room',
    name: 'Fruit in the room (フルーツインザルーム)',
    website_url: 'https://www.fruitszok.com/',
    schedule_url: 'https://www.fruitszok.com/schedule/',
    area: '静岡市',
    prefecture: '静岡県',
    pattern: 'prof',
    staffUrl: 'https://www.fruitszok.com/staff/',
    baseUrl: 'https://www.fruitszok.com',
  },
  {
    id: 'shizuoka_shizuoka_bloom',
    name: 'bloom (ブルーム)',
    website_url: 'https://bloom-shizuoka.com/',
    schedule_url: 'https://bloom-shizuoka.com/schedule',
    area: '静岡市',
    prefecture: '静岡県',
    pattern: 'photos_timestamp',
    staffUrl: 'https://bloom-shizuoka.com/girl',
    baseUrl: 'https://bloom-shizuoka.com',
  },
  {
    id: 'shizuoka_shizuoka_pompom_blue',
    name: 'POMPOM blue (ポムポムブルー) 静岡ルーム',
    website_url: 'https://shizuoka-esthe-pompom.com/',
    schedule_url: 'https://shizuoka-esthe-pompom.com/schedule.html',
    area: '静岡市',
    prefecture: '静岡県',
    pattern: 'templates_c',
    staffUrl: 'https://shizuoka-esthe-pompom.com/therapist.html',
    baseUrl: 'https://shizuoka-esthe-pompom.com',
  },
  {
    id: 'shizuoka_shizuoka_zettairyoiki',
    name: '絶対領域',
    website_url: 'https://zettairyoiki.net/',
    schedule_url: 'https://zettairyoiki.net/schedule',
    area: '静岡市',
    prefecture: '静岡県',
    pattern: 'photos_timestamp',
    staffUrl: 'https://zettairyoiki.net/girl',
    baseUrl: 'https://zettairyoiki.net',
  },
  {
    id: 'shizuoka_shizuoka_terrace',
    name: 'Terrace (テラス)',
    website_url: 'http://www.ms-terrace.com/',
    schedule_url: 'http://www.ms-terrace.com/schedule/',
    area: '静岡市',
    prefecture: '静岡県',
    pattern: 'ml_11_1',
    staffUrl: 'http://www.ms-terrace.com/staff/',
    baseUrl: 'http://www.ms-terrace.com',
  },
  {
    id: 'shizuoka_shizuoka_zeno',
    name: 'ZENO (ゼノ)',
    website_url: 'https://esthe-zeno.com/',
    schedule_url: 'https://esthe-zeno.com/schedule',
    area: '静岡市',
    prefecture: '静岡県',
    pattern: 'photos_timestamp',
    staffUrl: 'https://esthe-zeno.com/girl',
    baseUrl: 'https://esthe-zeno.com',
  },
  {
    id: 'shizuoka_shizuoka_sweet_crea',
    name: 'Sweet crea (スウィートクレア)',
    website_url: 'https://sweet-crea.com/',
    schedule_url: 'https://sweet-crea.com/schedule.php',
    area: '静岡市',
    prefecture: '静岡県',
    pattern: 'images_staff',
    staffUrl: 'https://sweet-crea.com/staff.php',
    baseUrl: 'https://sweet-crea.com',
    namePrefix: "静岡メンズエステ『Sweet〜crea〜』",
  },

  // ── 浜松エリア ──────────────────────────────
  {
    id: 'shizuoka_hamamatsu_choe_espa',
    name: '超E-SPA',
    website_url: 'https://espa-official.com/',
    schedule_url: 'https://espa-official.com/schedule',
    area: '浜松',
    prefecture: '静岡県',
    pattern: 'photos_raw',
    staffUrl: 'https://espa-official.com/girl',
    baseUrl: 'https://espa-official.com',
  },
  {
    id: 'shizuoka_hamamatsu_mens_clinic',
    name: '浜松メンズクリニック',
    website_url: 'https://hamamatsu-mensclinic.com/',
    schedule_url: 'https://hamamatsu-mensclinic.com/schedule',
    area: '浜松',
    prefecture: '静岡県',
    pattern: 'photos_raw',
    staffUrl: 'https://hamamatsu-mensclinic.com/girl',
    baseUrl: 'https://hamamatsu-mensclinic.com',
  },
  {
    id: 'shizuoka_hamamatsu_viaura',
    name: 'ミセス美オーラ 浜松店',
    website_url: 'https://viaura-hamamatsu.com/',
    schedule_url: 'https://viaura-hamamatsu.com/schedule.html',
    area: '浜松',
    prefecture: '静岡県',
    pattern: 'gallery',
    staffUrl: 'https://viaura-hamamatsu.com/model.html',
    baseUrl: 'https://viaura-hamamatsu.com',
  },
  {
    id: 'shizuoka_hamamatsu_sol_levante',
    name: 'Sol Levante (ソルレヴァンテ)',
    website_url: 'https://sollevante.info/',
    schedule_url: 'https://sollevante.info/schedule',
    area: '浜松',
    prefecture: '静岡県',
    pattern: 'caskan',
    staffUrl: 'https://sollevante.info/therapist',
    baseUrl: 'https://sollevante.info',
  },
  {
    id: 'shizuoka_hamamatsu_yurikago',
    name: 'ゆりかご 浜松店',
    website_url: 'https://www.yurikago-hamamatsu.com/',
    schedule_url: 'https://www.yurikago-hamamatsu.com/schedule/',
    area: '浜松',
    prefecture: '静岡県',
    pattern: 'galImage',
    staffUrl: 'https://www.yurikago-hamamatsu.com/therapist/',
    baseUrl: 'https://www.yurikago-hamamatsu.com',
  },
  {
    id: 'shizuoka_hamamatsu_sweet',
    name: 'Sweet (スウィート)',
    website_url: 'https://sweetesthe.net/',
    schedule_url: 'https://sweetesthe.net/schedule.php',
    area: '浜松',
    prefecture: '静岡県',
    pattern: 'images_staff',
    staffUrl: 'https://sweetesthe.net/staff.php',
    baseUrl: 'https://sweetesthe.net',
    namePrefix: "浜松メンズエステ『Sweet〜スウィート』",
  },
  {
    id: 'shizuoka_hamamatsu_emias',
    name: 'エミアス Third Stage',
    website_url: 'https://emias-thirdstage.com/',
    schedule_url: 'https://emias-thirdstage.com/schedule',
    area: '浜松',
    prefecture: '静岡県',
    pattern: 'photos_raw',
    staffUrl: 'https://emias-thirdstage.com/girl',
    baseUrl: 'https://emias-thirdstage.com',
  },
  {
    id: 'shizuoka_hamamatsu_chiisana_esthe',
    name: 'ちいさなエステ',
    website_url: 'https://relaxationesthe.com/',
    schedule_url: 'https://relaxationesthe.com/',
    area: '浜松',
    prefecture: '静岡県',
    pattern: 'shoponly', // JS-rendered, shop登録のみ
    staffUrl: 'https://relaxationesthe.com/',
    baseUrl: 'https://relaxationesthe.com',
  },
  {
    id: 'shizuoka_hamamatsu_siesta',
    name: 'SIESTA (シエスタ)',
    website_url: 'https://siesta-hamamatsu.com/',
    schedule_url: 'https://siesta-hamamatsu.com/schedule.php',
    area: '浜松',
    prefecture: '静岡県',
    pattern: 'images_staff_alt',
    staffUrl: 'https://siesta-hamamatsu.com/staff.php',
    baseUrl: 'https://siesta-hamamatsu.com',
    namePrefix: "メンズエステSIESTA〜シエスタのセラピスト「",
    nameSuffix: "」",
  },
  {
    id: 'shizuoka_hamamatsu_reposer',
    name: 'Reposer (ルポゼ)',
    website_url: 'https://h-reposer.com/',
    schedule_url: 'https://h-reposer.com/schedule.php',
    area: '浜松',
    prefecture: '静岡県',
    pattern: 'images_staff',
    staffUrl: 'https://h-reposer.com/staff.php',
    baseUrl: 'https://h-reposer.com',
  },
];

// ─── Therapist scrapers by pattern ────────────────────────────────────────────

async function scrapeTherapists(shop) {
  if (shop.pattern === 'shoponly') return [];
  const res = await fetch(shop.staffUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    redirect: 'follow',
  });
  if (!res.ok) {
    console.log(`  ⚠️  ${shop.name}: HTTP ${res.status}`);
    return [];
  }
  const html = await res.text();
  const $ = cheerio.load(html);
  const therapists = [];

  if (shop.pattern === 'ml_11_1') {
    // Spacer + background-image pattern (Eden, Terrace)
    $('img[alt*="さんの写真"]').each((_, el) => {
      const imgEl = $(el);
      let bgUrl = null;
      let parent = imgEl;
      for (let i = 0; i < 5; i++) {
        const style = parent.attr('style') || '';
        const m = style.match(/url\(['"]?([^'")\s]+)['"]?\)/);
        if (m) {
          bgUrl = m[1].startsWith('http') ? m[1] : shop.baseUrl + m[1];
          break;
        }
        parent = parent.parent();
        if (!parent.length) break;
      }
      const rawName = imgEl.attr('alt')
        .replace(/さんの写真$/, '')
        .replace(/【.*?】/g, '')
        .trim();
      // Extract numeric ID from ml_11_1_{id}.jpg for unique storage filename
      const imgId = bgUrl?.match(/ml_11_1_(\d+)\./)?.[1];
      if (!isNoise(rawName)) {
        therapists.push({ name: rawName, imageUrl: bgUrl, id: imgId });
      }
    });
  } else if (shop.pattern === 'prof') {
    // /prof/{id}/top.jpg pattern (Fruit in the room)
    $('img[src*="/prof/"]').each((_, el) => {
      const src = $(el).attr('src')?.replace(/\?.*$/, '');
      const alt = $(el).attr('alt') || '';
      const id = src?.match(/\/prof\/(\d+)\//)?.[1];
      if (!id) return;
      let name = alt;
      if (!name || isNoise(name)) {
        let parent = $(el).parent();
        for (let i = 0; i < 4; i++) {
          const t = parent.find('.name,h3,h4').first().text().trim();
          if (t && !isNoise(t)) { name = t; break; }
          parent = parent.parent();
        }
      }
      const fullUrl = src?.startsWith('http') ? src : shop.baseUrl + src;
      if (!isNoise(name)) {
        therapists.push({ name, imageUrl: fullUrl, id });
      }
    });
  } else if (shop.pattern === 'photos_timestamp') {
    // /photos/{lid}/{timestamp}.jpg pattern (bloom, 絶対領域, ZENO)
    $('img[src*="/photos/"]').each((_, el) => {
      const src = $(el).attr('src') || '';
      const alt = $(el).attr('alt') || '';
      const lid = src.match(/\/photos\/(\d+)\//)?.[1];
      if (!lid) return;
      const isNP = src.includes('now-printing');
      const name = alt.replace(/♥.*$|♡.*$/, '').replace(/[♥♡❤]/g, '').trim();
      if (!isNoise(name)) {
        therapists.push({ name, imageUrl: isNP ? null : (src.startsWith('http') ? src : shop.baseUrl + src), lid });
      }
    });
  } else if (shop.pattern === 'templates_c') {
    // templates_c/{hash}.jpg pattern (POMPOM blue)
    $('img[src*="templates_c"]').each((_, el) => {
      const src = $(el).attr('src') || '';
      const alt = $(el).attr('alt') || '';
      if (!alt || isNoise(alt)) return;
      // Use hash prefix (first 12 chars) as unique file key
      const hash = src.match(/templates_c\/([a-f0-9]+)\./i)?.[1]?.slice(0, 12);
      therapists.push({ name: alt.trim(), imageUrl: src.startsWith('http') ? src : shop.baseUrl + src, id: hash });
    });
  } else if (shop.pattern === 'images_staff') {
    // /images_staff/{id}/{filename} pattern (Sweet crea, Sweet浜松, Reposer)
    $('img[src*="images_staff"]').each((_, el) => {
      const src = $(el).attr('src') || '';
      const alt = $(el).attr('alt') || '';
      const id = src.match(/images_staff\/(\d+)\//)?.[1];
      if (!id) return;
      let name = alt;
      if (shop.namePrefix) name = name.replace(shop.namePrefix, '').trim();
      name = name.replace(/【.*?】/g, '').replace(/新人/g, '').trim();
      if (!isNoise(name)) {
        therapists.push({ name, imageUrl: src.startsWith('http') ? src : shop.baseUrl + src, id });
      }
    });
  } else if (shop.pattern === 'images_staff_alt') {
    // SIESTA pattern — alt has prefix "...セラピスト「name」"
    $('img[alt*="セラピスト"]').each((_, el) => {
      const src = $(el).attr('src') || '';
      const alt = $(el).attr('alt') || '';
      const nameMatch = alt.match(/「([^」]+)」/);
      if (!nameMatch) return;
      const name = nameMatch[1].trim();
      const id = src.match(/images_staff\/(\d+)\//)?.[1];
      const hasImage = src.includes('images_staff') && !src.includes('no_image') && !src.includes('img_dammy');
      if (!isNoise(name)) {
        therapists.push({ name, imageUrl: hasImage ? (src.startsWith('http') ? src : shop.baseUrl + src) : null, id });
      }
    });
  } else if (shop.pattern === 'photos_raw') {
    // /photos/{lid}/raw_{lid}.jpg or /photos/{lid}/moto_{lid}.jpg pattern (超E-SPA, 浜松クリニック, エミアス)
    $('img[src*="/photos/"]').each((_, el) => {
      const src = $(el).attr('src')?.split('?')[0] || '';
      const alt = $(el).attr('alt') || '';
      const lid = src.match(/\/photos\/(\d+)\//)?.[1];
      if (!lid) return;
      const name = alt.replace(/♥.*$|♡.*$/, '').replace(/[♥♡❤]/g, '').replace(/（[^）]*）/g, '').replace(/\([^)]*\)/g, '').trim();
      if (!isNoise(name)) {
        therapists.push({ name, imageUrl: src.startsWith('http') ? src : shop.baseUrl + src, lid });
      }
    });
  } else if (shop.pattern === 'gallery') {
    // /img/gallery/{id}/girls_img_1.jpg pattern (ミセス美オーラ)
    const seen = new Set();
    $('img[src*="/img/gallery/"]').each((_, el) => {
      const src = $(el).attr('src')?.split('?')[0] || '';
      const id = src.match(/\/gallery\/(\d+)\//)?.[1];
      if (!id || seen.has(id)) return;
      seen.add(id);
      let name = $(el).attr('alt') || '';
      // Remove reading hint after ★
      name = name.split('★')[0].trim();
      if (!isNoise(name)) {
        therapists.push({ name, imageUrl: src.startsWith('http') ? src : shop.baseUrl + src, id });
      }
    });
  } else if (shop.pattern === 'caskan') {
    // caskan.com CDN pattern (Sol Levante)
    $('img[src*="caskan"]').each((_, el) => {
      const src = $(el).attr('src') || '';
      if (!src.includes('cast_tmb') && !src.includes('cast_img')) return;
      const castId = src.match(/cast_tmb\/\d+_(\d+)\./)?.[1] || src.match(/cast_img\/\d+_(\d+)\./)?.[1];
      if (!castId) return;
      let name = $(el).attr('alt') || '';
      if (!name || isNoise(name)) {
        // Try parent elements for name
        let parent = $(el).parent();
        for (let i = 0; i < 5; i++) {
          const t = parent.find('.name,.cast-name,h3,h4').first().text().trim();
          if (t && /[ぁ-んァ-ヾ一-龯]/.test(t)) { name = t; break; }
          parent = parent.parent();
        }
      }
      name = name.replace(/^[◎●○]/, '').replace(/♡.*|♥.*/, '').replace(/\s*(姓|名|苗字)/g,'').trim();
      if (!isNoise(name)) {
        therapists.push({ name, imageUrl: src, castId });
      }
    });
  } else if (shop.pattern === 'galImage') {
    // /userImgShop/galImage/{id}/w160.jpg pattern (ゆりかご浜松)
    $('img[src*="/userImgShop/galImage/"]').each((_, el) => {
      const src = $(el).attr('src')?.split('?')[0] || '';
      const id = src.match(/galImage\/(\d+)\//)?.[1];
      let name = $(el).attr('alt') || '';
      name = name.replace(/\(\d+\)/, '').trim();
      if (!id || isNoise(name)) return;
      therapists.push({ name, imageUrl: src.startsWith('http') ? src : shop.baseUrl + src, id });
    });
  }

  return therapists;
}

// ─── Insert to DB ─────────────────────────────────────────────────────────────

async function processShop(shop) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🏪 ${shop.name} [${shop.id}]`);

  // Check if shop already exists
  const { data: existing } = await supabase.from('shops').select('id').eq('id', shop.id).single();
  if (!existing) {
    const ogImage = await getOgImage(shop.website_url);
    console.log(`  og:image = ${ogImage}`);
    const shopData = {
      id: shop.id,
      name: shop.name,
      website_url: shop.website_url,
      schedule_url: shop.schedule_url,
      image_url: ogImage,
      raw_data: {
        area: shop.area,
        prefecture: shop.prefecture,
      },
    };
    if (DRY_RUN) {
      console.log(`  [DRY] shop insert: ${JSON.stringify(shopData)}`);
    } else {
      const { error } = await supabase.from('shops').insert(shopData);
      if (error) console.error(`  ❌ shop insert error: ${error.message}`);
      else console.log(`  ✅ shop inserted`);
    }
  } else {
    console.log(`  ⏭️  shop already exists`);
  }

  // Scrape therapists
  console.log(`  🔍 scraping therapists from ${shop.staffUrl}...`);
  let therapists = [];
  try {
    therapists = await scrapeTherapists(shop);
  } catch (e) {
    console.error(`  ❌ scrape error: ${e.message}`);
    return;
  }
  console.log(`  📋 ${therapists.length}名取得`);

  if (DRY_RUN) {
    console.log(`  [DRY] sample: ${therapists.slice(0,5).map(t=>t.name).join(', ')}...`);
    return;
  }

  // Get existing therapists for this shop
  const { data: existingTherapists } = await supabase
    .from('therapists')
    .select('id, name, image_url')
    .eq('shop_id', shop.id);
  const existingMap = new Map((existingTherapists || []).map(t => [t.name, t]));

  let inserted = 0, skipped = 0, updated = 0;

  for (const t of therapists) {
    const cleanName = t.name.replace(/\s+/g, ' ').trim();
    const therapistId = `${shop.id}_${cleanName}`;

    const existing = existingMap.get(cleanName);
    if (existing) {
      // Update image if needed
      if (!existing.image_url && t.imageUrl) {
        const storagePath = `${shop.id}/${cleanName.replace(/[^a-zA-Z0-9ぁ-んァ-ヾ一-龯]/g, '_')}_${Date.now()}.jpg`;
        const storageUrl = await uploadAndGetUrl(t, shop, storagePath);
        if (storageUrl) {
          await supabase.from('therapists').update({ image_url: storageUrl }).eq('id', existing.id);
          updated++;
        }
      } else {
        skipped++;
      }
      continue;
    }

    // New therapist
    let imageUrl = null;
    if (t.imageUrl) {
      const rawExt = t.imageUrl.split('?')[0].split('.').pop().toLowerCase();
      const ext = (rawExt === 'jpeg' || rawExt === 'webp') ? 'jpg' : (rawExt || 'jpg');
      const fileKey = t.lid || t.id || t.castId || `t${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
      const storagePath = `${shop.id}/${fileKey}.${ext}`;
      imageUrl = await uploadAndGetUrl(t, shop, storagePath);
    }

    const { error } = await supabase.from('therapists').insert({
      id: therapistId,
      shop_id: shop.id,
      name: cleanName,
      image_url: imageUrl,
    });
    if (error) {
      if (error.code === '23505') {
        skipped++;
      } else {
        console.error(`  ❌ ${cleanName}: ${error.message}`);
      }
    } else {
      inserted++;
    }
  }

  console.log(`  ✅ inserted: ${inserted}, updated: ${updated}, skipped: ${skipped}`);
}

async function uploadAndGetUrl(t, shop, storagePath) {
  if (!t.imageUrl) return null;
  return await uploadImage(t.imageUrl, storagePath, shop.website_url);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🚀 静岡・浜松 shop+therapist 登録 ${DRY_RUN ? '[DRY RUN]' : ''}`);

  const targets = TARGET
    ? SHOPS.filter(s => s.id.includes(TARGET) || s.name.includes(TARGET))
    : SHOPS;

  console.log(`対象: ${targets.length}店舗`);

  for (const shop of targets) {
    await processShop(shop);
    await new Promise(r => setTimeout(r, 1000)); // 1秒待機
  }

  console.log('\n🎉 完了!');
}

main().catch(console.error);
