/**
 * 大阪 残りセラピスト登録
 *   A) /photos/raw_ パターン: メンズエステ大阪, Mrs.C'est la vie, 極SPA, 秘宝殿
 *   B) estama正常動作: athena, belle femme, もくきん堂, ぽっちゃりエステ
 *   C) wp-content: Aroma one
 * 実行: node scripts/maintenance/process_osaka_remaining_photos.mjs [--dry-run]
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

async function uploadImage(rawUrl, storageKey, referer) {
  try {
    const url = rawUrl.split('?')[0];
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Referer': referer }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = url.split('.').pop().toLowerCase().replace(/[^a-z]/g, '') || 'jpg';
    const safeExt = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) ? ext : 'jpg';
    const key = `${storageKey}.${safeExt}`;
    const { error } = await supabase.storage.from('therapist-images').upload(key, buf, {
      contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true
    });
    if (error) return null;
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(key);
    return data.publicUrl;
  } catch { return null; }
}

function cleanName(raw) {
  if (!raw) return null;
  let name = raw.trim();
  // ⚠DATE速報⚠ 除去
  name = name.replace(/⚠[^⚠]*⚠/g, '').trim();
  // 店舗名プレフィックス "(アテナ)" 等除去
  name = name.replace(/^[^ぁ-んァ-ヾ一-龯a-zA-Z]*/, '').replace(/^.+?[\)）]\s*/, '').trim();
  // 最後のトークン
  const parts = name.split(/\s+/);
  name = parts[parts.length - 1];
  // 日付・年齢除去
  name = name.replace(/\d+月\d+日.*$/, '').replace(/\d+\/\d+.*$/, '')
             .replace(/\(\d+\)$/, '').replace(/（\d+）$/, '').replace(/さん$/, '').trim();
  if (!name || name.length > 15) return null;
  const hasJP = /[ぁ-んァ-ヾ一-龯]/.test(name);
  const hasRomaji = /^[a-zA-Z][a-zA-Z\-\.]{1,14}$/.test(name);
  if (!hasJP && !hasRomaji) return null;
  if (/出勤|速報|空き|ご案内|立入|体験入店|イベント|キャンペーン|割引|求人|バナー|ボタン|アイコン|logo|icon/i.test(name)) return null;
  if (/^(NEW|SNS|LINE|TEL|FAX|WEB|INFO|TOP|MENU|HOME)$/i.test(name)) return null;
  return name;
}

// ===== 店舗別スクレイプ関数 =====

// A) /photos/raw_N.jpg パターン (LEON SPA系)
async function scrapePhotos(baseUrl, prefix) {
  const cleanBase = baseUrl.replace(/\/top$/, '').replace(/\/+$/, '');
  const urls = [cleanBase + '/', cleanBase + '/cast/', cleanBase + '/staff/', cleanBase + '/therapist/'];
  for (const url of urls) {
    const html = await fetchHtml(url);
    if (!html) continue;
    const $ = cheerio.load(html);
    const results = [], seen = new Set();
    $('img[src*="/photos/"]').each((_, el) => {
      const src = $(el).attr('src') || '';
      if (!src || src.includes('noimage')) return;
      const alt = $(el).attr('alt') || '';
      const name = cleanName(alt);
      if (!name || seen.has(name)) return;
      seen.add(name);
      const imgUrl = src.startsWith('http') ? src.split('?')[0]
                   : src.startsWith('//') ? 'https:' + src.split('?')[0]
                   : cleanBase + src.split('?')[0];
      const fileId = src.match(/\/photos\/(\d+)\//)?.[1] || src.split('/').pop().split('.')[0];
      results.push({ name, rawImgUrl: imgUrl, storageKey: `${prefix}_photo_${fileId}` });
    });
    if (results.length > 0) { console.log(`    URL: ${url}`); return results; }
  }
  return [];
}

// B-1) athena: img[src*="cast/"] + alt "athena(アテナ)NAME" → after )
async function scrapeAthena(baseUrl, prefix) {
  const cleanBase = baseUrl.replace(/\/top$/, '').replace(/\/+$/, '');
  const html = await fetchHtml(cleanBase + '/') || await fetchHtml(cleanBase + '/cast/');
  if (!html) return [];
  const $ = cheerio.load(html);
  const results = [], seen = new Set();
  // data-p1 or img src with cast/
  const els = $('[data-p1*="upload/cast/"], img[src*="cast/main"], img[src*="cast/thumb"], img[src*="upload/cast/"]');
  els.each((_, el) => {
    const alt = $(el).attr('alt') || '';
    const name = cleanName(alt);
    if (!name || seen.has(name)) return;
    seen.add(name);
    const src = $(el).attr('data-p1') || $(el).attr('src') || '';
    let imgUrl = src.startsWith('http') ? src.split('?')[0]
               : src.startsWith('//') ? 'https:' + src.split('?')[0]
               : cleanBase + src.split('?')[0];
    const fileBase = imgUrl.split('/').pop().replace(/[^a-z0-9._]/gi, '_').slice(0, 40);
    results.push({ name, rawImgUrl: imgUrl, storageKey: `${prefix}_${fileBase}` });
  });
  return results;
}

// B-2) belle femme: img[src*="upload/pub/"]
async function scrapeBelleFemme(baseUrl, prefix) {
  const cleanBase = baseUrl.replace(/\/top$/, '').replace(/\/+$/, '');
  const html = await fetchHtml(cleanBase + '/') || await fetchHtml(cleanBase + '/top');
  if (!html) return [];
  const $ = cheerio.load(html);
  const results = [], seen = new Set();
  $('img[src*="upload/pub/"], img[src*="upload/cast/"], img[src*="cast/main"], img[src*="cast/thumb"]').each((_, el) => {
    const src = $(el).attr('src') || '';
    if (src.includes('noimage') || src.includes('no_image')) return;
    const alt = $(el).attr('alt') || '';
    const name = cleanName(alt);
    if (!name || seen.has(name)) return;
    seen.add(name);
    const imgUrl = src.startsWith('http') ? src.split('?')[0]
                 : src.startsWith('//') ? 'https:' + src.split('?')[0]
                 : cleanBase + src.split('?')[0];
    const fileBase = imgUrl.split('/').pop().replace(/[^a-z0-9._]/gi, '_').slice(0, 40);
    results.push({ name, rawImgUrl: imgUrl, storageKey: `${prefix}_${fileBase}` });
  });
  return results;
}

// B-3) もくきん堂: img[src*="userimg/"]
async function scrapeMokukin(baseUrl, prefix) {
  const cleanBase = baseUrl.replace(/\/top$/, '').replace(/\/+$/, '');
  const html = await fetchHtml(cleanBase + '/') || await fetchHtml(cleanBase + '/therapist/');
  if (!html) return [];
  const $ = cheerio.load(html);
  const results = [], seen = new Set();
  $('img[src*="userimg/"], img[src*="cast/main"], img[src*="cast/thumb"]').each((_, el) => {
    const src = ($(el).attr('src') || $(el).attr('data-src') || '').split('?')[0];
    if (!src || src.includes('noimage')) return;
    const alt = $(el).attr('alt') || '';
    const name = cleanName(alt);
    if (!name || seen.has(name)) return;
    seen.add(name);
    const imgUrl = src.startsWith('http') ? src : src.startsWith('//') ? 'https:' + src : cleanBase + src;
    const fileBase = imgUrl.split('/').pop().replace(/[^a-z0-9._]/gi, '_').slice(0, 40);
    results.push({ name, rawImgUrl: imgUrl, storageKey: `${prefix}_${fileBase}` });
  });
  return results;
}

// B-4) ぽっちゃりエステ: estama CDN、100x100サムネイル除外
async function scrapePocchari(baseUrl, prefix) {
  const html = await fetchHtml(baseUrl) || await fetchHtml(baseUrl + '/top');
  if (!html) return [];
  const $ = cheerio.load(html);
  const results = [], seen = new Set();
  $('img[src*="cast/main"], img[src*="cast/thumb"]').each((_, el) => {
    const src = $(el).attr('src') || '';
    // スケジュール通知サムネイル除外
    if (src.includes('/100x100/') || src.includes('noimage')) return;
    const alt = $(el).attr('alt') || '';
    const name = cleanName(alt);
    if (!name || seen.has(name)) return;
    seen.add(name);
    const imgUrl = src.startsWith('http') ? src.split('?')[0]
                 : src.startsWith('//') ? 'https:' + src.split('?')[0]
                 : baseUrl + src.split('?')[0];
    const fileBase = imgUrl.split('/').pop().replace(/[^a-z0-9._]/gi, '_').slice(0, 40);
    results.push({ name, rawImgUrl: imgUrl, storageKey: `${prefix}_${fileBase}` });
  });
  return results;
}

// C) Aroma one: wp-content at /cast/
async function scrapeAromaOne(baseUrl, prefix) {
  const cleanBase = baseUrl.replace(/\/top$/, '').replace(/\/+$/, '');
  const html = await fetchHtml(cleanBase + '/cast/');
  if (!html) return [];
  const $ = cheerio.load(html);
  const results = [], seen = new Set();
  $('img[src*="wp-content/uploads"]').each((_, el) => {
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt') || '';
    const name = cleanName(alt);
    if (!name || seen.has(name)) return;
    seen.add(name);
    const imgUrl = src.startsWith('http') ? src.split('?')[0] : cleanBase + src.split('?')[0];
    const fileBase = imgUrl.split('/').pop().replace(/[^a-z0-9._]/gi, '_').slice(0, 40);
    results.push({ name, rawImgUrl: imgUrl, storageKey: `${prefix}_${fileBase}` });
  });
  return results;
}

// ===== 店舗リスト =====
const SHOPS = [
  // A) photos パターン (raw_N.jpg / moto_N.jpg)
  { domain: 'esthe-osaka.com',      prefix: 'menesthe_osaka',  type: 'photos',    url: 'https://esthe-osaka.com/' },
  { domain: 'mrs-cest-la-vie.com',  prefix: 'mrs_cestlavie',   type: 'photos',    url: 'https://mrs-cest-la-vie.com/' },
  { domain: 'kiwami-spa.net',       prefix: 'kiwami_spa',      type: 'photos',    url: 'https://kiwami-spa.net/' },
  { domain: 'hihouden.net',         prefix: 'hihouden',        type: 'photos',    url: 'https://hihouden.net/' },
  // A-moto) moto_photos パターン (Phase1で失敗した5店舗)
  { domain: 'mrs-b-witch.com',      prefix: 'mrs_bwitch',      type: 'photos',    url: 'https://mrs-b-witch.com/' },
  { domain: 'esthe-sakai.jp',       prefix: 'preseine',        type: 'photos',    url: 'https://www.esthe-sakai.jp/' },
  { domain: 'salon-rest.com',       prefix: 'salon_rest',      type: 'photos',    url: 'https://salon-rest.com/' },
  { domain: 'salon-emmy.com',       prefix: 'mrs_emmy',        type: 'photos',    url: 'https://salon-emmy.com/' },
  { domain: 'hamaru-spa.com',       prefix: 'hamaru_spa',      type: 'photos',    url: 'https://hamaru-spa.com/' },

  // B) estama系 正常動作
  { domain: 'athena-osaka.com',           prefix: 'athena',          type: 'athena',    url: 'https://athena-osaka.com/' },
  { domain: 'osaka-bellefemme.com',       prefix: 'bellefemme',      type: 'bellefemme',url: 'https://osaka-bellefemme.com/top' },
  { domain: 'osaka-mkd.com',              prefix: 'mokukin',         type: 'mokukin',   url: 'http://www.osaka-mkd.com/' },
  { domain: '27359.b7.estama.jp',         prefix: 'pocchari',        type: 'pocchari',  url: 'https://27359.b7.estama.jp/' },

  // C) Aroma one wp-content
  { domain: 'esthe-aromaone.com',        prefix: 'aroma_one',        type: 'aroma_one', url: 'https://esthe-aromaone.com/' },
];

console.log(`大阪 残り photos+estama セラピスト登録${DRY_RUN ? ' [DRY-RUN]' : ''}`);
console.log(`対象: ${SHOPS.length}店舗\n`);

let totalAdded = 0, totalFailed = 0;

for (const shop of SHOPS) {
  console.log(`[${shop.type}] ${shop.domain}`);

  // shop_id をURLで検索
  const { data: dbShops } = await supabase.from('shops').select('id,name').ilike('website_url', `%${shop.domain}%`);
  if (!dbShops?.length) { console.log(`  shop not found in DB`); totalFailed++; continue; }
  const shopId = dbShops[0].id;
  console.log(`  shop_id: ${shopId} / ${dbShops[0].name}`);

  // 既登録チェック
  const { count } = await supabase.from('therapists').select('id', { count: 'exact' }).eq('shop_id', shopId);
  if (count > 0) { console.log(`  スキップ（既存 ${count}件）`); continue; }

  // スクレイプ
  let results = [];
  if (shop.type === 'photos')     results = await scrapePhotos(shop.url, shop.prefix);
  else if (shop.type === 'athena')     results = await scrapeAthena(shop.url, shop.prefix);
  else if (shop.type === 'bellefemme') results = await scrapeBelleFemme(shop.url, shop.prefix);
  else if (shop.type === 'mokukin')    results = await scrapeMokukin(shop.url, shop.prefix);
  else if (shop.type === 'pocchari')   results = await scrapePocchari(shop.url, shop.prefix);
  else if (shop.type === 'aroma_one')  results = await scrapeAromaOne(shop.url, shop.prefix);

  console.log(`  取得: ${results.length}名`);
  if (results.length === 0) { totalFailed++; await sleep(500); continue; }
  results.slice(0, 5).forEach(t => console.log(`    ${t.name}  ${t.rawImgUrl?.slice(0, 65)}`));

  if (DRY_RUN) { await sleep(600); continue; }

  let added = 0;
  for (const t of results) {
    let imageUrl = null;
    if (t.rawImgUrl) {
      imageUrl = await uploadImage(t.rawImgUrl, t.storageKey, shop.url);
    }
    const id = `${shopId}_${t.name}`;
    const { error } = await supabase.from('therapists').insert({ id, shop_id: shopId, name: t.name, image_url: imageUrl });
    if (!error) { added++; process.stdout.write('.'); }
    else process.stdout.write('!');
  }
  process.stdout.write('\n');
  console.log(`  ✅ 登録: ${added}名`);
  totalAdded += added;
  await sleep(800);
}

console.log(`\n============================`);
console.log(`合計 登録: ${totalAdded}名 / 失敗: ${totalFailed}`);
console.log(`dry-run: ${DRY_RUN}`);
