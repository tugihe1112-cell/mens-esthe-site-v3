/**
 * 東京都 静的HTML系 セラピスト登録
 * - Anjuaile (蒲田)              /images_staff/ + alt=名前
 * - AUTHORITY (池尻大橋)         spacer.png + alt="名前さんの写真" + background-image
 * - AROMA AMOUR (銀座)           spacer.png + div.info>a(名前) + background-image
 * 実行: node scripts/maintenance/process_tokyo_static.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

async function fetchHtml(url, referer) {
  const res = await fetch(url, {
    headers: { ...UA, Referer: referer || url },
    signal: AbortSignal.timeout(15000),
  });
  return res.text();
}

async function uploadImage(imageUrl, fileName, referer) {
  try {
    const res = await fetch(imageUrl, {
      headers: { ...UA, Referer: referer },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/') || ct.includes('svg')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const ext = (imageUrl.match(/\.(jpe?g|png|gif|webp)/i)?.[1] || 'jpg').toLowerCase();
    const safeExt = ext === 'jpeg' ? 'jpg' : ext;
    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
    if (error) return null;
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch { return null; }
}

async function processShop({ shopId, nameImagePairs, prefix, referer }) {
  console.log(`\n=== ${shopId} (${nameImagePairs.length}名) ===`);
  if (DRY_RUN) {
    nameImagePairs.slice(0, 8).forEach(([n, u]) => console.log(`  ${n} → ${u ? u.slice(-50) : '(写真なし)'}`));
    if (nameImagePairs.length > 8) console.log(`  ... 他${nameImagePairs.length - 8}名`);
    return;
  }
  let inserted = 0, skipped = 0, failed = 0;
  for (const [name, imageUrl] of nameImagePairs) {
    const id = `${shopId}_${name}`;
    const { data: existing } = await supabase.from('therapists').select('id').eq('id', id).single();
    if (existing) { process.stdout.write('='); skipped++; continue; }

    let storageUrl = null;
    if (imageUrl && !imageUrl.includes('no_image') && !imageUrl.includes('spacer')) {
      const base = imageUrl.split('/').pop().split('?')[0];
      const stem = base.replace(/\.[^.]+$/, '').replace(/[^\w-]/g, '_').slice(0, 40);
      const ext = (base.match(/\.(jpe?g|png|gif|webp)/i)?.[1] || 'jpg').toLowerCase();
      const safeExt = ext === 'jpeg' ? 'jpg' : ext;
      storageUrl = await uploadImage(imageUrl, `${prefix}_${stem}.${safeExt}`, referer);
      await sleep(80);
    }

    const { error } = await supabase.from('therapists').insert({
      id, shop_id: shopId, name, image_url: storageUrl ?? null,
    });
    if (error) { console.log(`\n❌ ${name}: ${error.message}`); failed++; }
    else { process.stdout.write(storageUrl ? '+' : 'n'); inserted++; }
    await sleep(80);
  }
  console.log(`\n  挿入 ${inserted}名 / スキップ ${skipped}名 / 失敗 ${failed}名`);
}

// ─── 1. Anjuaile (蒲田) ──────────────────────────────────────────────────────
console.log('【Anjuaile】 取得中...');
{
  const BASE = 'https://esthe-angeaile.com';
  const html = await fetchHtml(`${BASE}/staff.php`, BASE + '/');
  const $ = cheerio.load(html);
  const map = new Map();

  $('img[src*="images_staff"]').each((_, el) => {
    const src = $(el).attr('src') || '';
    const alt = ($(el).attr('alt') || '').trim();
    if (!alt || alt.length < 2 || alt.length > 15) return;
    if (!/[ぁ-んァ-ヾ一-龯]/.test(alt)) return;
    if (/ノーイメージ|no.?image|logo|icon/i.test(alt)) return;
    const imageUrl = src.startsWith('http') ? src : `${BASE}${src}`;
    if (!map.has(alt)) map.set(alt, imageUrl);
  });

  console.log(`  取得: ${map.size}名`);
  await processShop({
    shopId: 'tokyo_ota_kamata_anjuaile',
    nameImagePairs: [...map],
    prefix: 'anjuaile',
    referer: BASE + '/',
  });
}

await sleep(1000);

// ─── 2. AUTHORITY (池尻大橋) ─────────────────────────────────────────────────
console.log('\n【AUTHORITY】 取得中...');
{
  const BASE = 'https://www.me-authority.com';
  const html = await fetchHtml(`${BASE}/staff/`, BASE + '/');
  const $ = cheerio.load(html);
  const map = new Map();

  $('img[alt*="さんの写真"]').each((_, el) => {
    let name = ($(el).attr('alt') || '').replace(/さんの写真$/, '').replace(/\([^()]*\)/g, '').trim();
    name = name.replace(/\s+/g, ' ').trim();
    if (!name || name.length < 2 || name.length > 15) return;
    if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return;
    const style = $(el).attr('style') || '';
    const imgPath = style.match(/url\(['"]?([^'")\s]+)['"]?\)/)?.[1] || '';
    const imageUrl = imgPath ? (imgPath.startsWith('http') ? imgPath : `${BASE}${imgPath}`) : null;
    if (!map.has(name)) map.set(name, imageUrl);
  });

  console.log(`  取得: ${map.size}名`);
  await processShop({
    shopId: 'tokyo_setagaya_ikejiriohashi_authority',
    nameImagePairs: [...map],
    prefix: 'authority',
    referer: BASE + '/',
  });
}

await sleep(1000);

// ─── 3. AROMA AMOUR (銀座) ───────────────────────────────────────────────────
console.log('\n【AROMA AMOUR】 取得中...');
{
  const BASE = 'http://www.akiba-amour.com';
  const html = await fetchHtml(`${BASE}/staff/`, BASE + '/');
  const $ = cheerio.load(html);
  const map = new Map();

  $('div.item').each((_, el) => {
    // 名前: div.info > a
    const name = $(el).find('div.info a').first().text().trim();
    if (!name || name.length < 2 || name.length > 15) return;
    if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return;
    // 画像: div.photo img の style
    const style = $(el).find('div.photo img').attr('style') || '';
    const imgPath = style.match(/url\(['"]?([^'")\s]+)['"]?\)/)?.[1] || '';
    const imageUrl = imgPath ? (imgPath.startsWith('http') ? imgPath : `${BASE}${imgPath}`) : null;
    if (!map.has(name)) map.set(name, imageUrl);
  });

  console.log(`  取得: ${map.size}名`);
  await processShop({
    shopId: 'tokyo_chuo_ginza_aroma_amour',
    nameImagePairs: [...map],
    prefix: 'amour',
    referer: BASE + '/',
  });
}

console.log('\n完了');
