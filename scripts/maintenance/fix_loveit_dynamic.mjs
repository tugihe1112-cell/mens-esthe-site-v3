/**
 * Love it（ラヴィット） 動的スクレイプ版
 * /data/staff/{id}/stf_{hash}.jpg パターン (MITSUBACHIと同一CMS)
 * 既存 fix_loveit_images.mjs にない新規セラピストを修正
 * 実行: node scripts/maintenance/fix_loveit_dynamic.mjs [--dry-run]
 */
import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const BASE = 'https://loveit.love';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

async function uploadImage(imageUrl, fileName) {
  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': UA, Referer: BASE + '/' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { process.stdout.write(`[${res.status}]`); return null; }
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const ext = ct.includes('png') ? 'png' : ct.includes('webp') ? 'webp' : 'jpg';
    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType: ct, upsert: true });
    if (error) { process.stdout.write(`[E]`); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (e) { process.stdout.write(`[ERR]`); return null; }
}

// ─── スクレイプ ──────────────────────────────────────────────────
console.log(`${BASE}/ 取得中...`);
const html = await (await fetch(BASE + '/', {
  headers: { 'User-Agent': UA, Referer: BASE + '/' },
  signal: AbortSignal.timeout(20000),
})).text();
const $ = cheerio.load(html);

const nameImageMap = new Map(); // name → {url, staffId}

// パターン1: background-image に /data/staff/ が含まれる要素
$('[style*="/data/staff/"]').each((_, el) => {
  const style = $(el).attr('style') || '';
  const urlMatch = style.match(/url\(['"]?([^'")\s]*\/data\/staff\/(\d+)\/stf_[a-f0-9]+\.[a-z]+)['"]?\)/i);
  if (!urlMatch) return;
  const imgUrl = urlMatch[1].startsWith('http') ? urlMatch[1] : BASE + urlMatch[1];
  const staffId = urlMatch[2];

  // 名前の取得: 同コンテナ内の複数セレクタを試す
  const $container = $(el).closest('li, article, div.cast, div.item, div.staff, .staff-box, .box');
  const nameSelectors = [
    '.box-inner li:first-child',
    '.name', '.staff-name', 'h3', 'h2',
    '.box-name', '.cast-name', 'dd', '.text',
    'li:first-child', 'p:first-of-type',
  ];
  let name = '';
  for (const sel of nameSelectors) {
    const text = $container.find(sel).first().text()
      .replace(/\(\d+\)/g, '').replace(/（\d+）/g, '')
      .replace(/★.*$/, '').replace(/【.*?】/g, '')
      .trim();
    if (text && text.length >= 2 && text.length <= 15 && /[ぁ-んァ-ヾ一-龯a-zA-Zａ-ｚ]/.test(text)) {
      name = text;
      break;
    }
  }
  if (name && !nameImageMap.has(name)) {
    nameImageMap.set(name, { url: imgUrl, staffId });
  }
});

// パターン2: img の src/data-src に /data/staff/ が含まれる場合
$('img[src*="/data/staff/"], img[data-src*="/data/staff/"]').each((_, el) => {
  const src = $(el).attr('src') || $(el).attr('data-src') || '';
  const staffIdMatch = src.match(/\/data\/staff\/(\d+)\//);
  if (!staffIdMatch) return;
  const staffId = staffIdMatch[1];
  const imgUrl = src.startsWith('http') ? src : BASE + src;

  const $container = $(el).closest('li, article, div.cast, div.item, .staff-box, .box');
  let name = ($(el).attr('alt') || '').replace(/\(\d+\)/g, '').trim();
  if (!name || name.length < 2) {
    const nameSelectors = ['.box-inner li:first-child', '.name', 'h3', 'dd', 'li:first-child'];
    for (const sel of nameSelectors) {
      const text = $container.find(sel).first().text()
        .replace(/\(\d+\)/g, '').trim();
      if (text && text.length >= 2 && text.length <= 15 && /[ぁ-んァ-ヾ一-龯]/.test(text)) {
        name = text; break;
      }
    }
  }
  if (name && !nameImageMap.has(name)) {
    nameImageMap.set(name, { url: imgUrl, staffId });
  }
});

console.log(`サイトから取得: ${nameImageMap.size}名`);
if (DRY_RUN) {
  for (const [n, info] of nameImageMap) {
    console.log(`  "${n}" → staffId=${info.staffId} ${info.url.slice(-40)}`);
  }
}

if (nameImageMap.size === 0) {
  console.log('\n名前付き画像が取得できませんでした。サイト構造を確認してください。');
  process.exit(0);
}

// ─── DB 取得 ─────────────────────────────────────────────────────
const { data: shops } = await supabase.from('shops').select('id, name').ilike('website_url', '%loveit%');
if (!shops?.length) { console.log('店舗なし'); process.exit(1); }
console.log(`\n対象店舗: ${shops.map(s => s.name).join(', ')}`);
const shopIds = shops.map(s => s.id);

const { data: nullT } = await supabase.from('therapists')
  .select('id, name, shop_id, image_url')
  .in('shop_id', shopIds)
  .is('image_url', null);

console.log(`DB写真なし: ${nullT?.length ?? 0}名`);

function findMatch(dbName) {
  if (nameImageMap.has(dbName)) return nameImageMap.get(dbName);
  // スペース除去マッチ
  const noSpace = dbName.replace(/[\s　]/g, '');
  for (const [siteName, info] of nameImageMap) {
    if (siteName.replace(/[\s　]/g, '') === noSpace && noSpace.length >= 2) return info;
  }
  return null;
}

if (DRY_RUN) {
  console.log('\n[マッチング確認]');
  const matched = (nullT || []).filter(t => findMatch(t.name));
  const notFoundList = (nullT || []).filter(t => !findMatch(t.name));
  console.log(`マッチ: ${matched.length}名`);
  matched.forEach(t => {
    const info = findMatch(t.name);
    console.log(`  ✅ "${t.name}" → staffId=${info.staffId}`);
  });
  console.log(`未マッチ: ${notFoundList.length}名`);
  notFoundList.forEach(t => console.log(`  ❓ "${t.name}"`));
  process.exit(0);
}

// ─── 更新 ────────────────────────────────────────────────────────
let updated = 0, notFound = 0, failed = 0;
const processedStaffIds = new Map();

for (const t of nullT || []) {
  const info = findMatch(t.name);
  if (!info) { process.stdout.write('?'); notFound++; continue; }

  let storageUrl;
  if (processedStaffIds.has(info.staffId)) {
    storageUrl = processedStaffIds.get(info.staffId);
  } else {
    const ext = info.url.split('.').pop().split('?')[0] || 'jpg';
    const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? (ext === 'jpeg' ? 'jpg' : ext) : 'jpg';
    const fileName = `loveit_${info.staffId}.${safeExt}`;
    storageUrl = await uploadImage(info.url, fileName);
    processedStaffIds.set(info.staffId, storageUrl);
    await sleep(150);
  }

  const { error } = await supabase.from('therapists')
    .update({ image_url: storageUrl ?? info.url })
    .eq('id', t.id);
  if (error) { console.log(`\n❌ ${t.name}: ${error.message}`); failed++; }
  else { process.stdout.write(storageUrl ? '+' : '.'); updated++; }
  await sleep(80);
}

console.log(`\n\n更新 ${updated}件 / 未マッチ ${notFound}件 / 失敗 ${failed}件`);
console.log('完了');
