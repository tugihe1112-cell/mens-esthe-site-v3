/**
 * 大阪 estama(11店舗) + premium_spa(2店舗) セラピスト登録
 * 実行: node scripts/maintenance/process_osaka_estama_premium.mjs [--dry-run]
 */
import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchHtml(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Referer': url }, signal: AbortSignal.timeout(12000) });
    return res.ok ? res.text() : null;
  } catch { return null; }
}

async function uploadImage(url, storageKey, referer) {
  try {
    const headers = { 'User-Agent': UA, 'Referer': referer };
    const cleanUrl = url.split('?')[0];
    const res = await fetch(cleanUrl, { headers, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = cleanUrl.split('.').pop().toLowerCase().replace(/[^a-z]/g, '') || 'jpg';
    const key = `${storageKey}.${ext}`;
    const { error } = await supabase.storage.from('therapist-images').upload(key, buf, {
      contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, upsert: true
    });
    if (error) return null;
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(key);
    return data.publicUrl;
  } catch { return null; }
}

function cleanName(raw) {
  if (!raw) return null;
  let name = raw
    .replace(/^(NEW[！!]?|新人[！!]?|体験入店|★new★|\[new\])/i, '')
    .replace(/【[^】]*】.*$/, '')
    .replace(/\([^)]{1,8}\)$/, '')
    .replace(/（[^）]{1,8}）$/, '')
    .replace(/\s+/g, '').trim();
  if (!name || name.length > 15) return null;
  const hasJP = /[ぁ-んァ-ヾ一-龯]/.test(name);
  const hasRomaji = /^[a-zA-Z][a-zA-Z\s\-]{1,14}$/.test(name);
  if (!hasJP && !hasRomaji) return null;
  if (/NEW|SNS|LINE|Twitter|Instagram|予約|体験|割引|求人|バナー|イベント/i.test(name)) return null;
  return name;
}

// ===== estama パターン =====
async function scrapeEstama(baseUrl, castPath) {
  // まず castPath を試し、次にroot
  const urls = [
    baseUrl.replace(/\/+$/, '') + castPath,
    baseUrl.replace(/\/top$/, ''),
    baseUrl,
  ];

  for (const url of urls) {
    const html = await fetchHtml(url);
    if (!html) continue;
    const $ = cheerio.load(html);
    const results = [], seen = new Set();

    // estama cast/main パターン
    $('img[src*="cast/main"], img[src*="cast/thumb"], img[src*="cast/"]').each((_, el) => {
      const src = $(el).attr('src') || '';
      if (!src || src.includes('noimage') || src.includes('no_image')) return;
      const alt = $(el).attr('alt') || '';
      const name = cleanName(alt);
      if (!name || seen.has(name)) return;
      seen.add(name);
      const imgUrl = src.startsWith('http') ? src : `${baseUrl.replace(/\/+$/, '')}${src}`;
      results.push({ name, rawImgUrl: imgUrl });
    });

    // 汎用 img[alt] パターン（estama CDN外パターン）
    if (results.length === 0) {
      // staffboxやgirls_box系
      $('img[alt]').each((_, el) => {
        const src = $(el).attr('src') || '';
        const alt = $(el).attr('alt') || '';
        // ある程度の画像（プロフィール写真らしいもの）
        if (!src || src.length < 10) return;
        if (src.includes('logo') || src.includes('banner') || src.includes('btn') || src.includes('icon')) return;
        if (src.includes('noimage') || src.includes('no_image')) return;
        const name = cleanName(alt);
        if (!name || seen.has(name)) return;
        seen.add(name);
        const imgUrl = src.startsWith('http') ? src : `${baseUrl.replace(/\/+$/, '')}${src}`;
        results.push({ name, rawImgUrl: imgUrl });
      });
    }

    if (results.length > 0) {
      console.log(`    URL: ${url} → ${results.length}名`);
      return results;
    }
  }
  return [];
}

// ===== premium_spa パターン =====
// 例: bellosavon.com → Chrome経由が必要かも。まず静的取得を試みる
async function scrapePremiumSpa(baseUrl) {
  // premium_spa CMSは /data/staff/{id}/stf_{hash}.webp
  // キャストページは / か /therapist/ か /cast/
  const urls = [
    baseUrl.replace(/\/+$/, '') + '/therapist/',
    baseUrl.replace(/\/+$/, '') + '/cast/',
    baseUrl,
  ];
  for (const url of urls) {
    const html = await fetchHtml(url);
    if (!html) continue;
    const $ = cheerio.load(html);
    const results = [], seen = new Set();

    // premium_spa パターン: [data-src*="/data/staff/"] or img[src*="/data/staff/"]
    $('[data-src*="/data/staff/"], img[src*="/data/staff/"]').each((_, el) => {
      const src = $(el).attr('data-src') || $(el).attr('src') || '';
      const alt = $(el).attr('alt') || '';
      const name = cleanName(alt);
      if (!name || seen.has(name)) return;
      seen.add(name);
      const imgUrl = src.startsWith('http') ? src : `${baseUrl.replace(/\/+$/, '')}${src}`;
      results.push({ name, rawImgUrl: imgUrl });
    });

    if (results.length > 0) {
      console.log(`    URL: ${url} → ${results.length}名`);
      return results;
    }
  }
  return [];
}

// ===== 店舗リスト =====
const detection = JSON.parse(fs.readFileSync('./osaka_cms_detection.json', 'utf-8'));

// 処理対象: estama + premium_spa
const TARGET_TYPES = ['estama', 'premium_spa'];
const shops = detection.details.filter(d => TARGET_TYPES.includes(d.cms));

console.log(`大阪 estama+premium_spa セラピスト登録${DRY_RUN ? ' [DRY-RUN]' : ''}`);
console.log(`対象: ${shops.length}店舗\n`);

let totalAdded = 0, totalFailed = 0;

for (const shop of shops) {
  console.log(`[${shop.cms}] ${shop.name}`);

  // shop_id取得
  const domain = shop.url.replace(/https?:\/\/(www\.)?/, '').replace(/\/.*/, '').replace(/\/+$/, '');
  const { data: dbShops } = await supabase.from('shops').select('id,name').eq('id', shop.id);
  if (!dbShops?.length) {
    // IDで見つからない場合はURLで検索
    const { data: dbShops2 } = await supabase.from('shops').select('id,name').ilike('website_url', `%${domain}%`);
    if (!dbShops2?.length) { console.log(`  shop not found: ${shop.id}`); totalFailed++; continue; }
    shop.id = dbShops2[0].id;
  }
  const shopId = shop.id;
  console.log(`  shop_id: ${shopId}`);

  // 既登録チェック
  const { count } = await supabase.from('therapists').select('id', { count: 'exact' }).eq('shop_id', shopId);
  if (count > 0) { console.log(`  スキップ（既存 ${count}件）`); continue; }

  // スクレイプ
  let results = [];
  const castPath = shop.staffUrl ? (new URL(shop.staffUrl.startsWith('http') ? shop.staffUrl : 'https://x.com' + shop.staffUrl).pathname) : '/cast/';

  if (shop.cms === 'estama') {
    results = await scrapeEstama(shop.url, castPath);
  } else if (shop.cms === 'premium_spa') {
    results = await scrapePremiumSpa(shop.url);
  }

  if (results.length === 0) {
    console.log(`  ⚠️ 取得できず`);
    totalFailed++;
    await sleep(500);
    continue;
  }

  console.log(`  取得: ${results.length}名`);
  results.slice(0, 5).forEach(t => console.log(`    ${t.name}  ${t.rawImgUrl?.slice(0, 60)}`));

  if (DRY_RUN) { await sleep(500); continue; }

  let added = 0;
  for (const t of results) {
    let imageUrl = null;
    if (t.rawImgUrl) {
      const safePrefix = `osaka_${shopId.replace(/[^a-z0-9]/gi, '_').slice(0, 20)}`;
      const safeFile = t.rawImgUrl.split('/').pop().split('?')[0].replace(/[^a-z0-9.]/gi, '_');
      imageUrl = await uploadImage(t.rawImgUrl, `${safePrefix}_${safeFile}`, shop.url);
    }
    const id = `${shopId}_${t.name}`;
    const { error } = await supabase.from('therapists').insert({ id, shop_id: shopId, name: t.name, image_url: imageUrl });
    if (!error) { added++; process.stdout.write('.'); }
  }
  process.stdout.write('\n');
  console.log(`  ✅ 登録: ${added}名`);
  totalAdded += added;
  await sleep(800);
}

console.log(`\n============================`);
console.log(`合計 登録: ${totalAdded}名 / 失敗: ${totalFailed}`);
console.log(`dry-run: ${DRY_RUN}`);
