/**
 * 愛知県 JS描画4店舗 セラピスト登録
 *   - Cucue (きゅきゅ)        aichi_sakae_cucue
 *   - century (センチュリー)   aichi_takaoka_century
 *   - ゆりかご FC名古屋        aichi_yabacho_yurikago
 *   - Aroma Terrace           aichi_yabacho_aroma_terrace
 * 実行: node scripts/maintenance/process_aichi_js_shops.mjs [--dry-run]
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
      headers: { ...UA, Referer: referer || imageUrl },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/') || ct.includes('svg')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const ext = (imageUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || 'jpg').toLowerCase();
    const safeExt = ext === 'jpeg' ? 'jpg' : ext;
    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
    if (error) { console.error(`  Storage: ${error.message}`); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch { return null; }
}

async function processShop({ shopId, therapistMap, prefix, referer }) {
  console.log(`\n=== ${shopId} (${therapistMap.size}名) ===`);
  if (DRY_RUN) {
    let i = 0;
    for (const [name, url] of therapistMap) {
      if (i++ < 10) console.log(`  ${name} → ${url ? url.slice(0, 80) : '(写真なし)'}`);
    }
    if (therapistMap.size > 10) console.log(`  ... 他${therapistMap.size - 10}名`);
    return;
  }
  let inserted = 0, skipped = 0, failed = 0;
  for (const [name, imageUrl] of therapistMap) {
    const id = `${shopId}_${name}`;
    const { data: existing } = await supabase.from('therapists').select('id').eq('id', id).single();
    if (existing) { process.stdout.write('='); skipped++; continue; }

    let storageUrl = null;
    if (imageUrl) {
      const base = imageUrl.split('/').pop().split('?')[0];
      const stem = base.replace(/\.[^.]+$/, '').replace(/[^\w-]/g, '_').slice(0, 40);
      const ext = (base.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || 'jpg').toLowerCase();
      const safeExt = ext === 'jpeg' ? 'jpg' : ext;
      const fileName = `${prefix}_${stem}.${safeExt}`;
      storageUrl = await uploadImage(imageUrl, fileName, referer);
      await sleep(80);
    }

    const { error } = await supabase.from('therapists').insert({
      id, shop_id: shopId, name,
      image_url: storageUrl ?? imageUrl ?? null,
    });
    if (error) { console.log(`\n❌ ${name}: ${error.message}`); failed++; }
    else { process.stdout.write(imageUrl ? (storageUrl ? '+' : '.') : 'n'); inserted++; }
    await sleep(80);
  }
  console.log(`\n  挿入 ${inserted}名 / スキップ ${skipped}名 / 失敗 ${failed}名`);
}

// ─── 1. Cucue (きゅきゅ) ───────────────────────────────────────────────────────
console.log('【Cucue】 /therapist 取得中...');
{
  const BASE = 'https://cucue.jp';
  const NO_EYE = '/no_eye.jpg';
  const html = await fetchHtml(`${BASE}/therapist`, BASE + '/');
  const $ = cheerio.load(html);
  const map = new Map();

  $('li.p-postList__item').each((_, li) => {
    const name = ($(li).find('h2.p-postList__title').text() || '').trim();
    const img = $(li).find('img.c-postThumb__img');
    const dataSrc = img.attr('data-src') || img.attr('src') || '';
    const imageUrl = dataSrc.includes(NO_EYE) ? null : (dataSrc.startsWith('http') ? dataSrc : `${BASE}${dataSrc}`);
    if (name && name.length >= 1 && name.length <= 12 && !map.has(name)) {
      map.set(name, imageUrl);
    }
  });

  console.log(`  取得: ${map.size}名`);
  await processShop({ shopId: 'aichi_sakae_cucue', therapistMap: map, prefix: 'cucue', referer: BASE + '/' });
}

await sleep(1000);

// ─── 2. century (センチュリー) ────────────────────────────────────────────────
console.log('\n【century】 /staff.php 取得中...');
{
  const BASE = 'https://century-nagoya.com';
  const html = await fetchHtml(`${BASE}/staff.php`, BASE + '/');
  const text = cheerio.load(html).text();
  const map = new Map();

  // 「名前 XX歳/YYcm」パターンを抽出
  const regex = /([^\s\n]{1,15}?)\s+\d{1,2}歳\/\d{3}cm/g;
  let m;
  while ((m = regex.exec(text)) !== null) {
    const raw = m[1];
    // ※以降を除去（「白石えりな※新人割対象‼︎」→「白石えりな」）
    const name = raw.replace(/※.*$/, '').trim();
    if (name.length < 1 || name.length > 15) continue;
    if (!/[ぁ-んァ-ヾ一-龯a-zA-Zａ-ｚＡ-Ｚ]/.test(name)) continue;
    if (/スタッフ|セラピスト|予約|満了|メンズ|エステ/.test(name)) continue;
    if (/フェザータッチ/.test(name)) continue; // ノイズ除去
    if (!map.has(name)) map.set(name, null); // century は写真なし
  }

  console.log(`  取得: ${map.size}名`);
  await processShop({ shopId: 'aichi_takaoka_century', therapistMap: map, prefix: 'century', referer: BASE + '/' });
}

await sleep(1000);

// ─── 3. ゆりかご FC名古屋 ─────────────────────────────────────────────────────
console.log('\n【ゆりかご】 /therapist/ 取得中...');
{
  const BASE = 'https://www.yurikago-nagoya.com';
  const PAGE_URL = `${BASE}/therapist/`;
  const html = await fetchHtml(PAGE_URL, BASE + '/');
  const $ = cheerio.load(html);
  const map = new Map();
  const noise = /在籍|詳細|メッセージ|ゆりかご|名古屋|logo|menu|icon|banner|セラピスト/i;

  $('img').each((_, el) => {
    const alt = ($(el).attr('alt') || '').trim();
    const src = $(el).attr('src') || '';
    if (!alt || alt.length < 1 || alt.length > 10) return;
    if (!/[ぁ-んァ-ヾ一-龯a-zA-Z]/.test(alt)) return;
    if (noise.test(alt + src)) return;
    // 相対URL解決（../userImgShop/... → /userImgShop/...）
    let fullSrc = src;
    if (src.startsWith('../')) fullSrc = `${BASE}/${src.replace(/^\.\.\//, '')}`;
    else if (src.startsWith('/')) fullSrc = `${BASE}${src}`;
    else if (!src.startsWith('http')) fullSrc = `${PAGE_URL}${src}`;
    if (!map.has(alt)) map.set(alt, fullSrc);
  });

  console.log(`  取得: ${map.size}名`);
  await processShop({ shopId: 'aichi_yabacho_yurikago', therapistMap: map, prefix: 'yurikago', referer: BASE + '/' });
}

await sleep(1000);

// ─── 4. Aroma Terrace ─────────────────────────────────────────────────────────
console.log('\n【Aroma Terrace】 /therapist.html 取得中...');
{
  const BASE = 'https://aroma-terrace.men-este.com';
  const html = await fetchHtml(`${BASE}/therapist.html`, BASE + '/');
  const text = cheerio.load(html).text();
  const map = new Map();

  // 「名前 (年齢) T: 身長 バスト(カップ)」パターン
  const regex = /([^\s\n(]{1,10})\s+\(\d{2}\)\s+T:/g;
  let m;
  while ((m = regex.exec(text)) !== null) {
    const name = m[1].trim();
    if (name.length < 1 || name.length > 10) continue;
    if (!/[ぁ-んァ-ヾ一-龯a-zA-Zａ-ｚＡ-Ｚ]/.test(name)) continue;
    if (/リセット|セラピスト|名古屋|アロマ|テラス/i.test(name)) continue;
    if (!map.has(name)) map.set(name, null); // Aroma Terrace は写真なし
  }

  console.log(`  取得: ${map.size}名`);
  await processShop({ shopId: 'aichi_yabacho_aroma_terrace', therapistMap: map, prefix: 'aromaterrace', referer: BASE + '/' });
}

console.log('\n完了');
