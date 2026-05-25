/**
 * 愛知県 カスタム処理
 * auto_process_all_remaining.mjs --area=aichi で処理できなかった店舗を担当
 *
 * 対象:
 *  - 一宮 (images_staff pattern)
 *  - M Spa (images_staff + strip【】)
 *  - Galaxy-NAGOYA (WordPress wp-content)
 *  - Spur Luxury (3days S3, div.item.clearfix.fadein)
 *  - VENIRE (3days S3, div.item.clearfix.fadein)
 *  - GOLDEN ROSE (fdata/0/staff/ pattern)
 *  - CAMPBELL (lazy-load data-src + name from alt)
 *  - Cucue (WordPress lazy)
 *
 * 実行: node scripts/insert/process_aichi.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const ua = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchHtml(url) {
  const res = await fetch(url, { headers: ua, signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

// 名前のクリーニング
function cleanName(raw) {
  return (raw || '')
    .replace(/【[^】]*】/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/[（(][^)）]*[)）]/g, '')
    .replace(/🔰.*/, '')
    .replace(/💖/g, '')
    .replace(/❤️/g, '')
    .replace(/\d+\/\d+.*/,'')  // 3/11入店 など
    .trim();
}

function isValidName(name) {
  if (!name || name.length < 1 || name.length > 10) return false;
  if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return false;
  if (/エステ|セラピ|メンズ|スタッフ|ノーイメージ|イメージ|写真|今日|出勤|スケジュール|バナー|予約|ロゴ|営業|求人|今週|ランキング|TODAY|SCHEDULE|SYSTEM|ACCESS|体験入店|体入|もってる|ルーム|アカウント|公式|サイト|ページ|ニュース/.test(name)) return false;
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
    if (error) return imageUrl; // Storage失敗時は直接URL
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
    therapists.slice(0, 3).forEach(t => console.log(`    ${t.name} 📷${t.imgSrc ? '' : '（画像なし）'}`));
    if (therapists.length > 3) console.log(`    ...他${therapists.length - 3}名`);
    return;
  }

  // 既存削除
  const { count } = await supabase.from('therapists').select('id', { count: 'exact', head: true }).eq('shop_id', shopId);
  if (count > 0) {
    await supabase.from('therapists').delete().eq('shop_id', shopId);
    console.log(`  既存${count}名削除`);
  }

  // 挿入
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

  // shop画像
  if (shopImgUrl) {
    const stored = await uploadShopLogo(shopImgUrl, shopId);
    const { error } = await supabase.from('shops').update({ image_url: stored || shopImgUrl }).eq('id', shopId);
    console.log(error ? '  ❌ shop画像更新失敗' : `  ✅ shop画像: ${(stored || shopImgUrl).slice(0, 60)}`);
  }
}

// ============================================================
// 1. メンズエステ一宮 (images_staff)
// ============================================================
console.log('\n=== 1. メンズエステ一宮 ===');
{
  const SHOP_ID = 'aichi_ichinomiya_mens_esthe_ichinomiya';
  const BASE = 'https://esthe-ichinomiya.com';
  const html = await fetchHtml(`${BASE}/cast/`).catch(e => { console.log(`  ❌ ${e.message}`); return ''; });
  if (html) {
    const $ = cheerio.load(html);
    const therapists = [];
    const seen = new Set();
    $('img[src*="images_staff"]').each((_, el) => {
      const alt = $(el).attr('alt') || '';
      const src = $(el).attr('src') || '';
      const name = cleanName(alt);
      if (!isValidName(name) || seen.has(name)) return;
      seen.add(name);
      const fullSrc = src.startsWith('http') ? src : new URL(src, `${BASE}/cast/`).href;
      therapists.push({ name, imgSrc: fullSrc });
    });
    console.log(`  取得: ${therapists.length}名`);

    // OGP画像
    const topHtml = await fetchHtml(BASE).catch(() => '');
    const ogImg = cheerio.load(topHtml)('meta[property="og:image"]').attr('content') || '';
    const shopImg = ogImg.startsWith('http') ? ogImg : ogImg ? new URL(ogImg, BASE).href : '';
    console.log(`  shop画像: ${shopImg.slice(0, 60)}`);

    await processShop(SHOP_ID, therapists, shopImg);
  }
  await sleep(500);
}

// ============================================================
// 2. M Spa (images_staff + strip【】)
// ============================================================
console.log('\n=== 2. M Spa ===');
{
  const SHOP_ID = 'aichi_sakae_m_spa';
  const BASE = 'https://m-spa.net';
  const html = await fetchHtml(`${BASE}/cast/`).catch(e => { console.log(`  ❌ ${e.message}`); return ''; });
  if (html) {
    const $ = cheerio.load(html);
    const therapists = [];
    const seen = new Set();
    $('img[src*="images_staff"]').each((_, el) => {
      const alt = $(el).attr('alt') || '';
      const src = $(el).attr('src') || '';
      const name = cleanName(alt); // 【人気.第1位】等を削除
      if (!isValidName(name) || seen.has(name)) return;
      seen.add(name);
      const fullSrc = src.startsWith('http') ? src : new URL(src, `${BASE}/cast/`).href;
      therapists.push({ name, imgSrc: fullSrc });
    });
    console.log(`  取得: ${therapists.length}名`);

    const ogImg = cheerio.load(await fetchHtml(BASE).catch(() => ''))('meta[property="og:image"]').attr('content') || `${BASE}/images_shop/logo.png`;
    const shopImg = ogImg.startsWith('http') ? ogImg : new URL(ogImg, BASE).href;

    await processShop(SHOP_ID, therapists, shopImg);
  }
  await sleep(500);
}

// ============================================================
// 3. Galaxy-NAGOYA (WordPress /cast/)
// ============================================================
console.log('\n=== 3. Galaxy-NAGOYA ===');
{
  const SHOP_ID = 'aichi_meieki_galaxy_nagoya';
  const BASE = 'https://galaxy-nagoya.com';
  const html = await fetchHtml(`${BASE}/cast/`).catch(e => { console.log(`  ❌ ${e.message}`); return ''; });
  if (html) {
    const $ = cheerio.load(html);
    const therapists = [];
    const seen = new Set();
    $('img[src*="wp-content/uploads"]').each((_, el) => {
      const alt = $(el).attr('alt') || '';
      const src = $(el).attr('src') || '';
      const name = cleanName(alt);
      if (!isValidName(name) || seen.has(name)) return;
      seen.add(name);
      const fullSrc = src.startsWith('http') ? src : new URL(src, BASE).href;
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
// 4. Spur Luxury (3days: div.item.clearfix.fadein)
// ============================================================
console.log('\n=== 4. Spur Luxury ===');
{
  const SHOP_ID = 'aichi_sakae_spur_luxury';
  const BASE = 'https://spurluxury.com';
  const html = await fetchHtml(`${BASE}/therapist/`).catch(e => { console.log(`  ❌ ${e.message}`); return ''; });
  if (html) {
    const $ = cheerio.load(html);
    const therapists = [];
    const seen = new Set();
    $('.item.clearfix').each((_, el) => {
      const $el = $(el);
      const imgSrc = $el.find('img[src*="s3"]').first().attr('src') || '';
      const text = $el.text().trim().replace(/\s+/g, ' ');
      // "麗奈 REINA (25歳) T.163cm" → 日本語部分
      const nameMatch = text.match(/^([ぁ-んァ-ヾ一-龯々]{1,10})/);
      if (!nameMatch) return;
      const name = nameMatch[1].trim();
      if (!isValidName(name) || seen.has(name)) return;
      seen.add(name);
      const ageMatch = text.match(/[（(](\d{2,3})[)）]/);
      const heightMatch = text.match(/T[．.:]?\s*(\d{3})/);
      therapists.push({
        name,
        imgSrc: imgSrc.startsWith('http') ? imgSrc : imgSrc ? new URL(imgSrc, BASE).href : '',
        age: ageMatch ? parseInt(ageMatch[1]) : null,
        height: heightMatch ? parseInt(heightMatch[1]) : null,
      });
    });
    console.log(`  取得: ${therapists.length}名`);

    const ogImg = $('meta[property="og:image"]').attr('content') || '';
    const shopImg = ogImg.startsWith('http') ? ogImg : ogImg ? new URL(ogImg, BASE).href : '';

    await processShop(SHOP_ID, therapists, shopImg);
  }
  await sleep(500);
}

// ============================================================
// 5. VENIRE (3days: div.item.clearfix.fadein)
// ============================================================
console.log('\n=== 5. VENIRE ===');
{
  const SHOP_ID = 'aichi_shinsakae_venire';
  const BASE = 'https://venire-aroma.com';
  const html = await fetchHtml(`${BASE}/therapist/`).catch(e => { console.log(`  ❌ ${e.message}`); return ''; });
  if (html) {
    const $ = cheerio.load(html);
    const therapists = [];
    const seen = new Set();
    $('.item.clearfix').each((_, el) => {
      const $el = $(el);
      const imgSrc = $el.find('img[src*="s3"]').first().attr('src') || '';
      const fullText = $el.text().trim().replace(/\s+/g, ' ');

      // VENIRE形式: "ももか (22歳)" → (22歳) に「歳」が含まれる
      // パターン: 日本語名 + スペース + (数字歳)
      let name = '';
      const nameMatch = fullText.match(/([ぁ-んァ-ヾ一-龯々]{1,10})\s*[（(](\d{2,3})歳?[)）]/);
      if (nameMatch) name = nameMatch[1];

      // スパンから名前+歳を探すフォールバック
      if (!name) {
        $el.find('span').each((__, pe) => {
          const t = $(pe).text().trim();
          const m = t.match(/^([ぁ-んァ-ヾ一-龯々]{1,10})\s*[（(]\d{2,3}歳?[)）]/);
          if (m && !name) name = m[1];
        });
      }

      if (!name || !isValidName(name) || seen.has(name)) return;
      seen.add(name);
      const text = fullText;
      const ageMatch = text.match(/[（(](\d{2,3})歳?[)）]/);
      const heightMatch = text.match(/(\d{3})\s*cm/i) || text.match(/T[．.:]?\s*(\d{3})/);
      const cupMatch = text.match(/([A-J])カップ/i);
      therapists.push({
        name,
        imgSrc: imgSrc.startsWith('http') ? imgSrc : imgSrc ? new URL(imgSrc, BASE).href : '',
        age: ageMatch ? parseInt(ageMatch[1]) : null,
        height: heightMatch ? parseInt(heightMatch[1]) : null,
        cup: cupMatch ? cupMatch[1].toUpperCase() : null,
      });
    });
    console.log(`  取得: ${therapists.length}名`);

    const ogImg = $('meta[property="og:image"]').attr('content') || '';
    const shopImg = ogImg.startsWith('http') ? ogImg : ogImg ? new URL(ogImg, BASE).href : '';

    await processShop(SHOP_ID, therapists, shopImg);
  }
  await sleep(500);
}

// ============================================================
// 6. GOLDEN ROSE (fdata/0/staff/ pattern)
// ============================================================
console.log('\n=== 6. GOLDEN ROSE ===');
{
  const SHOP_ID = 'aichi_takaoka_golden_rose';
  const BASE = 'https://golden-rose.jp';
  const html = await fetchHtml(`${BASE}/staff/`).catch(e => { console.log(`  ❌ ${e.message}`); return ''; });
  if (html) {
    const $ = cheerio.load(html);
    const therapists = [];
    const seen = new Set();
    // fdata パターン: ./fdata/0/staff/{id}/goldro_0_{id}_{n}_{ts}.jpg
    $('img[src*="fdata"]').each((_, el) => {
      const alt = $(el).attr('alt') || '';
      const src = $(el).attr('src') || '';
      const name = cleanName(alt);
      if (!isValidName(name) || seen.has(name)) return;
      // 重複（同名の複数画像）→最初の1枚のみ
      seen.add(name);
      const fullSrc = src.startsWith('http') ? src : new URL(src, `${BASE}/staff/`).href;
      therapists.push({ name, imgSrc: fullSrc });
    });
    console.log(`  取得: ${therapists.length}名`);

    // トップページからog:image取得
    const topHtml = await fetchHtml(BASE).catch(() => '');
    const $top = cheerio.load(topHtml);
    const ogImg = $top('meta[property="og:image"]').attr('content') || '';
    // フォールバック: ロゴっぽい画像
    let shopImg = ogImg ? (ogImg.startsWith('http') ? ogImg : new URL(ogImg, BASE).href) : '';
    if (!shopImg) {
      $top('img').each((_,el) => {
        const src = $top(el).attr('src') || '';
        const alt = $top(el).attr('alt') || '';
        if (!shopImg && /logo|Logo|brand/i.test(src + alt) && /\.(jpg|jpeg|png|webp)/i.test(src)) {
          shopImg = src.startsWith('http') ? src : new URL(src, BASE).href;
        }
      });
    }
    console.log(`  shop画像: ${shopImg.slice(0,60) || 'なし'}`);

    await processShop(SHOP_ID, therapists, shopImg);
  }
  await sleep(500);
}

// ============================================================
// 7. CAMPBELL (lazy-load: data-src + name from alt)
// ============================================================
console.log('\n=== 7. CAMPBELL ===');
{
  const SHOP_ID = 'aichi_sakae_campbell';
  const BASE = 'https://vip-campbell.nagoya';
  const html = await fetchHtml(`${BASE}/staff/`).catch(e => { console.log(`  ❌ ${e.message}`); return ''; });
  if (html) {
    const $ = cheerio.load(html);
    const therapists = [];
    const seen = new Set();
    $('img[alt]').each((_, el) => {
      const rawAlt = $(el).attr('alt') || '';
      const dataSrc = $(el).attr('data-src') || $(el).attr('data-lazy-src') || $(el).attr('data-original') || '';
      const src = $(el).attr('src') || '';
      const name = cleanName(rawAlt);
      if (!isValidName(name) || seen.has(name)) return;
      // 体験入店のみ → 名前なし
      if (/体験入店|体入|見習/.test(rawAlt)) return;
      seen.add(name);
      // 実URLを取得（data-src優先）
      const imgSrc = dataSrc && !dataSrc.startsWith('data:') ? dataSrc :
                     src && !src.startsWith('data:') ? src : '';
      const fullSrc = imgSrc ? (imgSrc.startsWith('http') ? imgSrc : new URL(imgSrc, BASE).href) : '';
      therapists.push({ name, imgSrc: fullSrc });
    });
    console.log(`  取得: ${therapists.length}名 (画像URL率: ${therapists.filter(t=>t.imgSrc).length}名)`);

    // OGP = Cloudflare Images
    const ogImg = $('meta[property="og:image"]').attr('content') || '';
    const shopImg = ogImg.startsWith('http') ? ogImg : '';
    console.log(`  shop画像: ${shopImg.slice(0,60)}`);

    await processShop(SHOP_ID, therapists, shopImg);
  }
  await sleep(500);
}

// ============================================================
// 8. Cucue (WordPress lazy, data-src)
// ============================================================
console.log('\n=== 8. Cucue ===');
{
  const SHOP_ID = 'aichi_sakae_cucue';
  const BASE = 'https://cucue.jp';
  const html = await fetchHtml(`${BASE}/therapist/`).catch(e => { console.log(`  ❌ ${e.message}`); return ''; });
  if (html) {
    const $ = cheerio.load(html);
    const therapists = [];
    const seen = new Set();
    $('img').each((_, el) => {
      const rawAlt = $(el).attr('alt') || '';
      const dataSrc = $(el).attr('data-src') || $(el).attr('data-lazy-src') || $(el).attr('data-original') || '';
      const src = $(el).attr('src') || '';
      const imgSrc = dataSrc && !dataSrc.startsWith('data:') ? dataSrc :
                     src && !src.startsWith('data:') ? src : '';
      if (!imgSrc || !/wp-content\/uploads/.test(imgSrc)) return;
      if (/logo|recruit|banner|icon|page_top/.test(imgSrc)) return;
      const name = cleanName(rawAlt);
      if (!isValidName(name) || seen.has(name)) return;
      seen.add(name);
      const fullSrc = imgSrc.startsWith('http') ? imgSrc : new URL(imgSrc, BASE).href;
      therapists.push({ name, imgSrc: fullSrc });
    });
    console.log(`  取得: ${therapists.length}名`);
    if (therapists.length === 0) console.log('  ⚠️ 画像lazy-loadのため取得できず（スキップ）');
    else await processShop(SHOP_ID, therapists, '');
  }
  await sleep(500);
}

// ============================================================
// shop画像のみ（セラピストなし）
// ============================================================
console.log('\n=== 9. shop画像のみ設定 ===');
const shopOnlyImages = [
  { id: 'aichi_meieki_milk_repos', url: 'https://milkrepos.com', ogPath: '' },
  { id: 'aichi_shinsakae_madame_seiko', url: 'https://madame-seiko.com', ogPath: '' },
  { id: 'aichi_kanayama_number9', url: 'https://nagoya-number9.com', ogPath: '' },
];
for (const s of shopOnlyImages) {
  try {
    const html = await fetchHtml(s.url);
    const $ = cheerio.load(html);
    const ogImg = $('meta[property="og:image"]').attr('content') || '';
    if (!ogImg) { console.log(`  ⚠️ ${s.id}: og:image なし`); continue; }
    const fullImg = ogImg.startsWith('http') ? ogImg : new URL(ogImg, s.url).href;
    if (DRY_RUN) { console.log(`  [DRY] ${s.id}: ${fullImg.slice(0,60)}`); continue; }
    const stored = await uploadShopLogo(fullImg, s.id);
    const { error } = await supabase.from('shops').update({ image_url: stored || fullImg }).eq('id', s.id);
    console.log(error ? `  ❌ ${s.id}` : `  ✅ ${s.id}: ${(stored || fullImg).slice(0,60)}`);
  } catch(e) { console.log(`  ❌ ${s.id}: ${e.message}`); }
  await sleep(400);
}

console.log('\n完了');
