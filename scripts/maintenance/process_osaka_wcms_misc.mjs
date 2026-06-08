/**
 * 大阪 wcms(11店舗) + images_staff(2店舗) + UNKNOWN調査型 セラピスト登録
 * wcms = 子守唄・ムーンR系 (/gals/ + img[data-original*="/wcms/gals/"])
 * images_staff = images_staff/{id}/{file}.jpg パターン
 * 実行: node scripts/maintenance/process_osaka_wcms_misc.mjs [--dry-run]
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
  // 名前抽出パターン
  name = name.replace(/【[^】]*】.*$/, '').replace(/\s*\(\d+\)$/, '').replace(/\s*（\d+）$/, '');
  // wcms alt: "名前【読み】" → 【前
  const bracketIdx = name.indexOf('【');
  if (bracketIdx > 0) name = name.slice(0, bracketIdx).trim();
  // 全角スペース前
  const fwsIdx = name.indexOf('　');
  if (fwsIdx > 0) name = name.slice(0, fwsIdx).trim();
  // 通常スペース: 最後のトークン
  const parts = name.trim().split(/\s+/);
  name = parts[parts.length - 1].trim();
  // ノイズ除去
  name = name.replace(/^(NEW[！!]?|新人[！!]?)/, '').trim();
  if (!name || name.length > 15) return null;
  const hasJP = /[ぁ-んァ-ヾ一-龯]/.test(name);
  const hasRomaji = /^[a-zA-Z][a-zA-Z\-\.]{1,14}$/.test(name);
  if (!hasJP && !hasRomaji) return null;
  if (/出勤|速報|体験入店|イベント|キャンペーン|割引|求人|バナー|アイコン|logo/i.test(name)) return null;
  if (/^(NEW|SNS|LINE|TEL|FAX|WEB|TOP|MENU|HOME|INFO)$/i.test(name)) return null;
  return name;
}

// ===== wcms スクレイパー (子守唄・ムーンR系) =====
// キャストページ: /gals/ (または sitemap.xml で発見)
// lazy loading: img[data-original*="/wcms/gals/images/"]
async function scrapeWcms(baseUrl, prefix) {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const urls = [cleanBase + '/gals/', cleanBase + '/cast/', cleanBase + '/'];
  for (const url of urls) {
    const html = await fetchHtml(url);
    if (!html) continue;
    const $ = cheerio.load(html);
    const results = [], seen = new Set();

    // wcms lazy loading パターン
    $('[data-original*="/wcms/gals/images/"], img[src*="/wcms/gals/images/"]').each((_, el) => {
      const src = ($(el).attr('data-original') || $(el).attr('src') || '').split('?')[0];
      if (!src || src.includes('noimage')) return;
      const alt = $(el).attr('alt') || '';
      const name = cleanName(alt);
      if (!name || seen.has(name)) return;
      seen.add(name);
      const imgUrl = src.startsWith('http') ? src : src.startsWith('//') ? 'https:' + src : cleanBase + src;
      const fileId = src.match(/\/images\/(\d+)\//)?.[1] || src.split('/').pop().split('.')[0];
      results.push({ name, rawImgUrl: imgUrl, storageKey: `${prefix}_wcms_${fileId}` });
    });

    if (results.length > 0) { console.log(`    URL: ${url}`); return results; }
  }
  return [];
}

// ===== images_staff スクレイパー =====
async function scrapeImagesStaff(baseUrl, prefix) {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const urls = [cleanBase + '/therapist/', cleanBase + '/cast/', cleanBase + '/staff/', cleanBase + '/'];
  for (const url of urls) {
    const html = await fetchHtml(url);
    if (!html) continue;
    const $ = cheerio.load(html);
    const results = [], seen = new Set();

    $('img[src*="images_staff"], [data-src*="images_staff"]').each((_, el) => {
      const src = ($(el).attr('data-src') || $(el).attr('src') || '').split('?')[0];
      if (!src || src.includes('noimage')) return;
      const alt = $(el).attr('alt') || '';
      const name = cleanName(alt);
      if (!name || seen.has(name)) return;
      seen.add(name);
      const imgUrl = src.startsWith('http') ? src : src.startsWith('//') ? 'https:' + src : cleanBase + src;
      const sid = src.match(/images_staff\/(\d+)\//)?.[1] || src.split('/').pop().split('.')[0];
      results.push({ name, rawImgUrl: imgUrl, storageKey: `${prefix}_staff_${sid}` });
    });

    if (results.length > 0) { console.log(`    URL: ${url}`); return results; }
  }
  return [];
}

// ===== 汎用フォールバック (UNKNOWN型) =====
// さまざまなパターンを試みる
async function scrapeGeneric(baseUrl, staffPath, prefix) {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const paths = staffPath ? [staffPath, '/cast/', '/therapist/', '/staff/', '/'] : ['/cast/', '/therapist/', '/staff/', '/gals/', '/'];
  for (const path of paths) {
    const url = cleanBase + path;
    const html = await fetchHtml(url);
    if (!html) continue;
    const $ = cheerio.load(html);
    const results = [], seen = new Set();

    // 様々なパターン
    const selectors = [
      '[data-original*="/wcms/gals/images/"]',
      'img[src*="images_staff"]',
      'img[src*="/photos/"]',
      'img[src*="cast/main"]',
      'img[src*="cast/thumb"]',
      'img[src*="upload/cast/"]',
      '[data-p1*="upload/cast/"]',
    ];
    for (const sel of selectors) {
      $(sel).each((_, el) => {
        const src = ($(el).attr('data-original') || $(el).attr('data-p1') || $(el).attr('data-src') || $(el).attr('src') || '').split('?')[0];
        if (!src || src.includes('noimage') || src.includes('no_image')) return;
        const alt = $(el).attr('alt') || '';
        const name = cleanName(alt);
        if (!name || seen.has(name)) return;
        seen.add(name);
        const imgUrl = src.startsWith('http') ? src : src.startsWith('//') ? 'https:' + src : cleanBase + src;
        const fileBase = imgUrl.split('/').pop().replace(/[^a-z0-9._]/gi, '_').slice(0, 40);
        results.push({ name, rawImgUrl: imgUrl, storageKey: `${prefix}_${fileBase}` });
      });
      if (results.length > 0) { console.log(`    URL: ${url} (${sel})`); return results; }
    }
  }
  return [];
}

// ===== 店舗リスト =====
const SHOPS = [
  // wcms (子守唄・ムーンR系) 11店舗
  { domain: 'motejo.net',           prefix: 'motejo',          type: 'wcms',    url: 'https://motejo.net/' },
  { domain: 'tenga-osaka.com',      prefix: 'tenga',           type: 'wcms',    url: 'https://tenga-osaka.com/' },
  { domain: 'alyo.net',             prefix: 'alyo',            type: 'wcms',    url: 'https://alyo.net/' },
  { domain: 'kiramekispa.com',      prefix: 'kirameki',        type: 'wcms',    url: 'https://kiramekispa.com/' },
  { domain: 'amore-spa.com',        prefix: 'amore_spa',       type: 'wcms',    url: 'https://amore-spa.com/' },
  { domain: 'oilmadrid.com',        prefix: 'oil_madrid',      type: 'wcms',    url: 'https://oilmadrid.com/' },
  { domain: 'sarisari.jp',          prefix: 'sarisari',        type: 'wcms',    url: 'https://sarisari.jp/' },
  { domain: 'femmefatale-osaka.com',prefix: 'femme_fatale',    type: 'wcms',    url: 'https://femmefatale-osaka.com/' },
  { domain: 'belchic.net',          prefix: 'belchic',         type: 'wcms',    url: 'https://belchic.net/' },
  { domain: 'lancom.jp',            prefix: 'lancom',          type: 'wcms',    url: 'https://lancom.jp/' },
  { domain: 'pershia.jp',           prefix: 'pershia',         type: 'wcms',    url: 'https://pershia.jp/' },

  // images_staff 2店舗
  { domain: 'four-h.net',           prefix: 'four_h',          type: 'images_staff', url: 'https://four-h.net/' },
  { domain: 'hirugaosaka.com',      prefix: 'hirugao',         type: 'images_staff', url: 'https://hirugaosaka.com/' },

  // estama分類だが独自構造
  { domain: 'candy-esthe.com',      prefix: 'candy',           type: 'generic', url: 'https://candy-esthe.com/',    staffPath: '/staff.html' },
  { domain: 'osaka-yohaku.com',     prefix: 'yohaku',          type: 'generic', url: 'https://osaka-yohaku.com/',   staffPath: '/cast/' },

  // UNKNOWN型 → 汎用スクレイプ
  { domain: 'beststar-osaka.com',   prefix: 'beststar',        type: 'generic', url: 'https://beststar-osaka.com/', staffPath: '/cast/' },
  { domain: 'zechoo-spa.com',       prefix: 'zechoo',          type: 'generic', url: 'https://zechoo-spa.com/',     staffPath: '/cast/' },
  { domain: 'dandy-lab.com',        prefix: 'dandy_lab',       type: 'generic', url: 'https://www.dandy-lab.com/',  staffPath: '/staff/' },
  { domain: 'madam-spa.net',        prefix: 'madam_spa',       type: 'generic', url: 'http://www.madam-spa.net/',   staffPath: '/staff/' },
  { domain: 'deep-chill.info',      prefix: 'deep_chill',      type: 'generic', url: 'http://www.deep-chill.info/', staffPath: '/staff/' },
  { domain: 'aromaesthe.biz',       prefix: 'ordermade',       type: 'generic', url: 'https://aromaesthe.biz/',     staffPath: '/staff.html' },
  { domain: 'osakaelin.com',        prefix: 'elin',            type: 'generic', url: 'http://www.osakaelin.com/',   staffPath: '/therapist/' },
  { domain: 'osakafeliz.com',       prefix: 'feliz',           type: 'generic', url: 'https://www.osakafeliz.com/', staffPath: '/therapist/' },
];

console.log(`大阪 wcms+images_staff+misc セラピスト登録${DRY_RUN ? ' [DRY-RUN]' : ''}`);
console.log(`対象: ${SHOPS.length}店舗\n`);

let totalAdded = 0, totalFailed = 0;

for (const shop of SHOPS) {
  console.log(`[${shop.type}] ${shop.domain}`);

  const { data: dbShops } = await supabase.from('shops').select('id,name').ilike('website_url', `%${shop.domain}%`);
  if (!dbShops?.length) { console.log(`  shop not found in DB`); totalFailed++; continue; }
  const shopId = dbShops[0].id;
  console.log(`  shop_id: ${shopId} / ${dbShops[0].name}`);

  const { count } = await supabase.from('therapists').select('id', { count: 'exact' }).eq('shop_id', shopId);
  if (count > 0) { console.log(`  スキップ（既存 ${count}件）`); continue; }

  let results = [];
  if (shop.type === 'wcms')         results = await scrapeWcms(shop.url, shop.prefix);
  else if (shop.type === 'images_staff') results = await scrapeImagesStaff(shop.url, shop.prefix);
  else if (shop.type === 'generic') results = await scrapeGeneric(shop.url, shop.staffPath, shop.prefix);

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
