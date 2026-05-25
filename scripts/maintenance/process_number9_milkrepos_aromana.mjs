/**
 * Number9 + milk repos + Aromana 処理
 * 実行: node scripts/maintenance/process_number9_milkrepos_aromana.mjs [--dry-run] [--shop number9|milkrepos|aromana]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const SHOP_FILTER = args.find(a => a.startsWith('--shop='))?.split('=')[1] || null;

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function uploadImage(imageUrl, therapistId) {
  try {
    const res = await fetch(imageUrl, { headers: ua, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const ext = (imageUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || 'jpg').toLowerCase();
    const safeExt = ext === 'jpeg' ? 'jpg' : ext;
    const fileName = `${therapistId.replace(/[^\w-]/g, '_')}.${safeExt}`;
    const { error } = await supabase.storage.from('therapist-images')
      .upload(fileName, buf, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
    if (error) return imageUrl;
    return supabase.storage.from('therapist-images').getPublicUrl(fileName).data.publicUrl;
  } catch { return null; }
}

async function insertTherapists(shopId, therapists) {
  const { count } = await supabase.from('therapists').select('id', { count: 'exact', head: true }).eq('shop_id', shopId);
  if (count > 0) {
    await supabase.from('therapists').delete().eq('shop_id', shopId);
    console.log(`既存${count}名削除`);
  }
  let inserted = 0;
  process.stdout.write('挿入中: ');
  for (const t of therapists) {
    const tid = `${shopId}_${t.name}`;
    const imgUrl = t.imgSrc ? await uploadImage(t.imgSrc, tid) : null;
    const { error } = await supabase.from('therapists').upsert({
      id: tid, shop_id: shopId, name: t.name, image_url: imgUrl,
    });
    if (!error) { inserted++; process.stdout.write('.'); }
    else process.stdout.write('x');
    await sleep(80);
  }
  console.log(`\n✅ ${inserted}/${therapists.length}名挿入`);
}

// ============================================================
// 1. Number9 (ナンバーナイン)
// ============================================================
if (!SHOP_FILTER || SHOP_FILTER === 'number9') {
  console.log('=== 1. Number9 (ナンバーナイン) ===');
  const BASE = 'https://nagoya-number9.com';

  const { data: shopData } = await supabase.from('shops')
    .select('id,name,image_url,schedule_url,website_url')
    .ilike('name', '%Number9%')
    .filter('raw_data->>prefecture', 'eq', '愛知県')
    .single();
  const SHOP_ID = shopData?.id;
  console.log(`shop_id: ${SHOP_ID}`);

  // website_url / schedule_url 設定
  const updates = {};
  if (!shopData?.website_url) updates.website_url = BASE;
  if (!shopData?.schedule_url) updates.schedule_url = `${BASE}/cast_schedule/`;

  // shop画像（og:image or 先頭ロゴ）
  if (!shopData?.image_url) {
    try {
      const topRes = await fetch(BASE, { headers: ua, signal: AbortSignal.timeout(10000) });
      const topHtml = await topRes.text();
      const $top = cheerio.load(topHtml);
      const ogImg = $top('meta[property="og:image"]').attr('content');
      const logo = $top('img[src*="logo"], img[src*="header"]').first().attr('src');
      const imgUrl = ogImg || (logo ? (logo.startsWith('http') ? logo : new URL(logo, BASE).href) : null);
      if (imgUrl) updates.image_url = imgUrl;
    } catch {}
  }

  if (Object.keys(updates).length > 0) {
    if (!DRY_RUN) {
      const { error } = await supabase.from('shops').update(updates).eq('id', SHOP_ID);
      if (!error) Object.entries(updates).forEach(([k, v]) => console.log(`✅ ${k}: ${v}`));
    } else {
      Object.entries(updates).forEach(([k, v]) => console.log(`[DRY] ${k}: ${v}`));
    }
  } else {
    console.log('✅ shop情報設定済み');
  }

  // セラピスト取得 /cast_list/
  const res = await fetch(`${BASE}/cast_list/`, { headers: ua, signal: AbortSignal.timeout(12000) });
  const html = await res.text();
  const $ = cheerio.load(html);

  const therapists = [];
  const seen = new Set();

  // alt="名古屋メンズエステ【ナンバーナイン】 彩" → "】 " 以降が名前
  $('img[alt*="ナンバーナイン】"]').each((_, el) => {
    const alt = $(el).attr('alt') || '';
    const src = $(el).attr('src') || '';
    const match = alt.match(/】\s*(.+)$/);
    if (!match) return;
    const name = match[1].trim();
    if (!name || seen.has(name)) return;
    if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return;
    seen.add(name);
    const fullSrc = src.startsWith('http') ? src : new URL(src, BASE).href;
    // サムネイルURL（-150x150などを除去して元画像を使用）
    const origSrc = fullSrc.replace(/-\d+x\d+(\.\w+)$/, '$1');
    therapists.push({ name, imgSrc: origSrc });
  });

  console.log(`取得: ${therapists.length}名`);
  therapists.slice(0, 5).forEach(t => console.log(`  ${t.name} | ${t.imgSrc.slice(0, 70)}`));
  if (therapists.length > 5) console.log(`  ...他${therapists.length - 5}名`);

  if (!DRY_RUN && therapists.length > 0) {
    await insertTherapists(SHOP_ID, therapists);
  }

  await sleep(500);
}

// ============================================================
// 2. milk repos (ミルクルポ)
// ============================================================
if (!SHOP_FILTER || SHOP_FILTER === 'milkrepos') {
  console.log('\n=== 2. milk repos (ミルクルポ) ===');
  const BASE = 'https://milkrepos.com';

  const { data: shopData } = await supabase.from('shops')
    .select('id,name,image_url,schedule_url,website_url')
    .ilike('name', '%milk%')
    .filter('raw_data->>prefecture', 'eq', '愛知県')
    .single();
  const SHOP_ID = shopData?.id;
  console.log(`shop_id: ${SHOP_ID}`);

  const updates = {};
  if (!shopData?.website_url) updates.website_url = BASE;
  if (!shopData?.schedule_url) updates.schedule_url = `${BASE}/schedule.php`;

  if (!shopData?.image_url) {
    try {
      const topRes = await fetch(BASE, { headers: ua, signal: AbortSignal.timeout(10000) });
      const topHtml = await topRes.text();
      const $top = cheerio.load(topHtml);
      const ogImg = $top('meta[property="og:image"]').attr('content');
      const logo = $top('img[src*="logo"]').first().attr('src');
      const imgUrl = ogImg || (logo ? (logo.startsWith('http') ? logo : new URL(logo, BASE).href) : null);
      if (imgUrl) updates.image_url = imgUrl;
    } catch {}
  }

  if (Object.keys(updates).length > 0) {
    if (!DRY_RUN) {
      const { error } = await supabase.from('shops').update(updates).eq('id', SHOP_ID);
      if (!error) Object.entries(updates).forEach(([k, v]) => console.log(`✅ ${k}: ${v}`));
    } else {
      Object.entries(updates).forEach(([k, v]) => console.log(`[DRY] ${k}: ${v}`));
    }
  } else {
    console.log('✅ shop情報設定済み');
  }

  // セラピスト取得 /staff.php
  const res = await fetch(`${BASE}/staff.php`, { headers: ua, signal: AbortSignal.timeout(12000) });
  const html = await res.text();
  const $ = cheerio.load(html);

  const therapists = [];
  const seen = new Set();

  // images_staff パターンの画像からalt取得
  $('img[src*="images_staff"]').each((_, el) => {
    const alt = $(el).attr('alt') || '';
    const src = $(el).attr('src') || '';

    // ロゴ・バナー系を除外
    if (/logo|banner|icon|求人|LINE|Twitter|recruit/i.test(alt + src)) return;

    let name = alt.trim();

    // "名前♡説明" パターン → ♡前を名前として使用
    if (name.includes('♡')) name = name.split('♡')[0].trim();
    // "名前★説明" パターン
    if (name.includes('★')) name = name.split('★')[0].trim();
    // "名前【説明】" パターン
    name = name.replace(/【.*?】/g, '').replace(/\(.*?\)/g, '').trim();

    if (!name || name.length < 1 || seen.has(name)) return;
    if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return;
    seen.add(name);

    const fullSrc = src.startsWith('http') ? src : new URL(src, BASE).href;
    therapists.push({ name, imgSrc: fullSrc });
  });

  console.log(`取得: ${therapists.length}名`);
  therapists.slice(0, 5).forEach(t => console.log(`  ${t.name} | ${t.imgSrc.slice(0, 70)}`));
  if (therapists.length > 5) console.log(`  ...他${therapists.length - 5}名`);

  if (therapists.length === 0) {
    console.log('⚠️  名前取得できず。altデバッグ確認:');
    $('img[src*="images_staff"]').slice(0, 5).each((i, el) => {
      console.log(`  [${i}] alt="${$(el).attr('alt')}" | ${$(el).attr('src')?.slice(0, 60)}`);
    });
  }

  if (!DRY_RUN && therapists.length > 0) {
    await insertTherapists(SHOP_ID, therapists);
  }

  await sleep(500);
}

// ============================================================
// 3. Aromana (アロマーナ)
// ============================================================
if (!SHOP_FILTER || SHOP_FILTER === 'aromana') {
  console.log('\n=== 3. Aromana (アロマーナ) ===');
  const BASE = 'https://aromana-sakae.com';

  const { data: shopData } = await supabase.from('shops')
    .select('id,name,image_url,schedule_url,website_url')
    .ilike('name', '%Aromana%')
    .filter('raw_data->>prefecture', 'eq', '愛知県')
    .single();
  const SHOP_ID = shopData?.id;
  console.log(`shop_id: ${SHOP_ID}`);

  const updates = {};
  if (!shopData?.website_url) updates.website_url = BASE;
  if (!shopData?.schedule_url) updates.schedule_url = `${BASE}/schedule.php`;

  if (!shopData?.image_url) {
    try {
      const topRes = await fetch(BASE, { headers: ua, signal: AbortSignal.timeout(10000) });
      const topHtml = await topRes.text();
      const $top = cheerio.load(topHtml);
      const ogImg = $top('meta[property="og:image"]').attr('content');
      const logo = $top('img[src*="logo"]').first().attr('src');
      const imgUrl = ogImg || (logo ? (logo.startsWith('http') ? logo : new URL(logo, BASE).href) : null);
      if (imgUrl) updates.image_url = imgUrl;
    } catch {}
  }

  if (Object.keys(updates).length > 0) {
    if (!DRY_RUN) {
      const { error } = await supabase.from('shops').update(updates).eq('id', SHOP_ID);
      if (!error) Object.entries(updates).forEach(([k, v]) => console.log(`✅ ${k}: ${v}`));
    } else {
      Object.entries(updates).forEach(([k, v]) => console.log(`[DRY] ${k}: ${v}`));
    }
  } else {
    console.log('✅ shop情報設定済み');
  }

  // セラピスト取得 /staff.php
  const res = await fetch(`${BASE}/staff.php`, { headers: ua, signal: AbortSignal.timeout(12000) });
  const html = await res.text();
  const $ = cheerio.load(html);

  const therapists = [];
  const seen = new Set();

  // alt="うい♡清楚美女" → ♡前を名前として使用
  $('img[src*="images_staff"]').each((_, el) => {
    const alt = $(el).attr('alt') || '';
    const src = $(el).attr('src') || '';

    if (/logo|banner|icon|求人|LINE|recruit/i.test(alt + src)) return;

    let name = alt.trim();
    if (name.includes('♡')) name = name.split('♡')[0].trim();
    if (name.includes('★')) name = name.split('★')[0].trim();
    name = name.replace(/【.*?】/g, '').replace(/\(.*?\)/g, '').trim();

    if (!name || name.length < 1 || seen.has(name)) return;
    if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return;
    seen.add(name);

    const fullSrc = src.startsWith('http') ? src : new URL(src, BASE).href;
    therapists.push({ name, imgSrc: fullSrc });
  });

  console.log(`取得: ${therapists.length}名`);
  therapists.slice(0, 5).forEach(t => console.log(`  ${t.name} | ${t.imgSrc.slice(0, 70)}`));
  if (therapists.length > 5) console.log(`  ...他${therapists.length - 5}名`);

  if (!DRY_RUN && therapists.length > 0) {
    await insertTherapists(SHOP_ID, therapists);
  }
}

console.log('\n完了');
