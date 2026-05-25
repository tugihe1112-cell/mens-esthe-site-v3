/**
 * 愛知県 追加処理
 * - ENCORE: /staff.php, images_staff, alt="種類❤︎名前"
 * - Tororich: /staff/, .item.clearfix, 名前はカードテキスト先頭
 * - RICH AROMA: /therapist/, 3days .item.clearfix, "北川(きたがわ)（26歳）"形式
 *
 * 実行: node scripts/insert/process_aichi_extra.mjs [--dry-run]
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

function isValidName(name) {
  if (!name || name.length < 1 || name.length > 10) return false;
  if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return false;
  if (/休業|定休|エラー|エステ|セラピ|メンズ|ノーイメージ|スタッフ|アカウント|バナー|求人|スケジュール|ランキング/.test(name)) return false;
  return true;
}

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
    if (error) return imageUrl;
    return supabase.storage.from('shop-logos').getPublicUrl(`${shopId}.${safeExt}`).data.publicUrl;
  } catch { return null; }
}

async function processShop(shopId, therapists, shopImgUrl) {
  if (DRY_RUN) {
    console.log(`  [DRY] ${therapists.length}名 / shop画像: ${shopImgUrl ? '✅' : '❌'}`);
    therapists.slice(0, 3).forEach(t => console.log(`    ${t.name} ${t.imgSrc ? '📷' : '（画像なし）'}`));
    if (therapists.length > 3) console.log(`    ...他${therapists.length - 3}名`);
    return;
  }
  const { count } = await supabase.from('therapists').select('id', { count: 'exact', head: true }).eq('shop_id', shopId);
  if (count > 0) {
    await supabase.from('therapists').delete().eq('shop_id', shopId);
    console.log(`  既存${count}名削除`);
  }
  let inserted = 0;
  process.stdout.write('  挿入中: ');
  for (const t of therapists) {
    const tid = `${shopId}_${t.name}`;
    const imgUrl = t.imgSrc ? await uploadImage(t.imgSrc, tid) : null;
    const { error } = await supabase.from('therapists').upsert({
      id: tid, shop_id: shopId, name: t.name,
      age: t.age || null, height: t.height || null, cup: t.cup || null,
      image_url: imgUrl,
    });
    if (!error) { inserted++; process.stdout.write('.'); }
    else process.stdout.write('x');
    await sleep(80);
  }
  console.log(`\n  ✅ ${inserted}/${therapists.length}名挿入`);
  if (shopImgUrl) {
    const stored = await uploadShopLogo(shopImgUrl, shopId);
    const { error } = await supabase.from('shops').update({ image_url: stored || shopImgUrl }).eq('id', shopId);
    console.log(error ? '  ❌ shop画像失敗' : `  ✅ shop画像: ${(stored || shopImgUrl).slice(0, 60)}`);
  }
}

// ============================================================
// 1. ENCORE (/staff.php, images_staff, alt="種類❤︎名前")
// ============================================================
console.log('=== 1. ENCORE ===');
{
  const SHOP_ID = 'aichi_takaoka_encore';
  const BASE = 'https://encore-nagoya.com';
  const html = await fetchHtml(`${BASE}/staff.php`).catch(e => { console.log(`  ❌ ${e.message}`); return ''; });
  if (html) {
    const $ = cheerio.load(html);
    const therapists = [];
    const seen = new Set();

    $('img[src*="images_staff"]').each((_, el) => {
      const alt = $(el).attr('alt') || '';
      const src = $(el).attr('src') || '';
      // "新人❤︎なのは" → "なのは" (❤︎ の後ろ)
      const nameMatch = alt.match(/[❤︎❤♡★☆◆●■▲❣]+([ぁ-んァ-ヾ一-龯々\s　]+)$/) ||
                        alt.match(/([ぁ-んァ-ヾ一-龯々]+)$/);
      if (!nameMatch) return;
      const name = nameMatch[1].trim().replace(/\s+/g, '');
      if (!isValidName(name) || seen.has(name)) return;
      seen.add(name);
      const fullSrc = src.startsWith('http') ? src : new URL(src, BASE).href;
      therapists.push({ name, imgSrc: fullSrc });
    });
    console.log(`  取得: ${therapists.length}名`);

    // shop画像: OGP
    const ogImg = $('meta[property="og:image"]').attr('content') || '';
    const shopImg = ogImg.startsWith('http') ? ogImg : ogImg ? new URL(ogImg, BASE).href : `${BASE}/images/logo2.png`;

    // schedule_url
    if (!DRY_RUN) {
      await supabase.from('shops').update({
        website_url: BASE,
        schedule_url: `${BASE}/schedule.php`,
      }).eq('id', SHOP_ID);
    }

    await processShop(SHOP_ID, therapists, shopImg);
  }
  await sleep(500);
}

// ============================================================
// 2. Tororich (/staff/, .item.clearfix, 名前=カードテキスト先頭)
// ============================================================
console.log('\n=== 2. Tororich ===');
{
  const SHOP_ID = 'aichi_osu_tororich';
  const BASE = 'https://www.tororich.net';
  const html = await fetchHtml(`${BASE}/staff/`).catch(e => { console.log(`  ❌ ${e.message}`); return ''; });
  if (html) {
    const $ = cheerio.load(html);
    const therapists = [];
    const seen = new Set();

    $('.item.clearfix').each((_, el) => {
      const $el = $(el);
      const text = $el.text().trim().replace(/\s+/g, ' ');
      // "田村 出勤 11:00-17:00" → "田村"
      const nameMatch = text.match(/^([ぁ-んァ-ヾ一-龯々]{1,8})[\s　]/);
      if (!nameMatch) return;
      const name = nameMatch[1].trim();
      if (!isValidName(name) || seen.has(name)) return;
      seen.add(name);

      // 画像: src=/images/mt_10_1_xxx.jpg
      const imgEl = $el.find('img').first();
      const imgSrc = imgEl.attr('src') || '';
      const fullSrc = imgSrc ? (imgSrc.startsWith('http') ? imgSrc : new URL(imgSrc, BASE).href) : '';

      therapists.push({ name, imgSrc: fullSrc });
    });
    console.log(`  取得: ${therapists.length}名`);

    const ogImg = $('meta[property="og:image"]').attr('content') || '';
    const shopImg = ogImg.startsWith('http') ? ogImg : ogImg ? new URL(ogImg, BASE).href : '';

    await processShop(SHOP_ID, therapists, shopImg);
  }
  await sleep(500);
}

// ============================================================
// 3. RICH AROMA (/therapist/, 3days, "北川(きたがわ)（26歳）")
// ============================================================
console.log('\n=== 3. RICH AROMA ===');
{
  const SHOP_ID = 'aichi_sakae_rich_aroma';
  const BASE = 'https://www.richaroma.nagoya';
  const html = await fetchHtml(`${BASE}/therapist/`).catch(e => { console.log(`  ❌ ${e.message}`); return ''; });
  if (html) {
    const $ = cheerio.load(html);
    const therapists = [];
    const seen = new Set();

    $('.item.clearfix').each((_, el) => {
      const $el = $(el);
      const text = $el.text().trim().replace(/\s+/g, ' ');

      // "北川(きたがわ)（26歳）" → name = "北川"
      const nameMatch = text.match(/^([ぁ-んァ-ヾ一-龯々]{1,8})[（(（]/);
      if (!nameMatch) return;
      const name = nameMatch[1].trim();
      if (!isValidName(name) || seen.has(name)) return;
      seen.add(name);

      // 年齢
      const ageMatch = text.match(/[）)]\s*[（(](\d{2,3})歳?[）)]/);

      // 画像: wakaba.png はプレースホルダー → スキップ、S3またはlazyのみ使用
      const imgEl = $el.find('img').first();
      let imgSrc = imgEl.attr('src') || '';
      if (/wakaba\.png/.test(imgSrc)) imgSrc = ''; // プレースホルダー除外
      const fullSrc = imgSrc ? (imgSrc.startsWith('http') ? imgSrc : new URL(imgSrc, BASE).href) : '';

      therapists.push({ name, imgSrc: fullSrc, age: ageMatch ? parseInt(ageMatch[1]) : null });
    });
    console.log(`  取得: ${therapists.length}名 (画像あり: ${therapists.filter(t=>t.imgSrc).length}名)`);

    const ogImg = $('meta[property="og:image"]').attr('content') || '';
    const shopImg = ogImg ? (ogImg.startsWith('http') ? ogImg : `https:${ogImg}`) : '';

    await processShop(SHOP_ID, therapists, shopImg);
  }
}

console.log('\n完了');
