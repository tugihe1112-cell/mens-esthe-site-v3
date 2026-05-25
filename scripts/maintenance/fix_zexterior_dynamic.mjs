/**
 * Zexterior 動的スクレイプ版（全4店舗）
 * /cast/ ページから images_staff パターンで名前+画像を取得
 * 既存ハードコード版（fix_zexterior_images.mjs）を補完する
 * 実行: node scripts/maintenance/fix_zexterior_dynamic.mjs [--dry-run]
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
const BASE = 'https://zexterior-aroma.com';
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
    const ext = imageUrl.match(/\.(jpe?g|png|gif|webp)/i)?.[1]?.toLowerCase() || 'jpg';
    const safeExt = ext === 'jpeg' ? 'jpg' : ext;
    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
    if (error) { process.stdout.write(`[E]`); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (e) { process.stdout.write(`[ERR]`); return null; }
}

// ─── スクレイプ ──────────────────────────────────────────────────
// Zexteriorは複数のキャストページを持つ可能性があるため複数URLを試す
const CAST_PAGES = ['/cast/', '/cast', '/therapist/', '/', '/staff/'];
let castHtml = '';
let usedUrl = '';

console.log(`${BASE} キャストページ取得中...`);
for (const path of CAST_PAGES) {
  try {
    const res = await fetch(BASE + path, {
      headers: { 'User-Agent': UA, Referer: BASE + '/' },
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      const text = await res.text();
      // images_staff が含まれているページを優先
      if (text.includes('images_staff')) {
        castHtml = text;
        usedUrl = BASE + path;
        console.log(`✅ ${path} で images_staff パターン確認`);
        break;
      }
    }
  } catch { /* skip */ }
  await sleep(300);
}

if (!castHtml) {
  console.log('キャストページが取得できませんでした。URLを確認してください。');
  process.exit(1);
}

const $ = cheerio.load(castHtml);
const nameImageMap = new Map(); // name → {url, staffId}

// images_staff パターン: img[src*="images_staff"]
$('img[src*="images_staff"]').each((_, el) => {
  const src = $(el).attr('src') || '';
  const alt = ($(el).attr('alt') || '').trim();

  // noimage / ロゴ / バナー 除外
  if (!alt || /noimage|logo|banner|bnr|求人|icon/i.test(src)) return;
  // alt に日本語がなければスキップ
  if (!/[ぁ-んァ-ヾ一-龯]/.test(alt)) return;

  const staffIdMatch = src.match(/\/images_staff\/(\d+)\//);
  if (!staffIdMatch) return;
  const staffId = staffIdMatch[1];

  // alt から名前を抽出（年齢・ランク等を除去）
  let name = alt
    .replace(/\(\d+\)/g, '')    // (28) などの年齢除去
    .replace(/（\d+）/g, '')
    .replace(/★.*$/, '')         // ★以降除去
    .replace(/【.*?】/g, '')      // 【】内除去
    .replace(/\s+/g, ' ')
    .trim();
  if (!name || name.length > 15) return;

  const fullUrl = src.startsWith('http') ? src : BASE + src;
  if (!nameImageMap.has(name)) {
    nameImageMap.set(name, { url: fullUrl, staffId });
  }
});

// data-src / data-original にあるケースも対応
$('img[data-src*="images_staff"], img[data-original*="images_staff"]').each((_, el) => {
  const src = $(el).attr('data-src') || $(el).attr('data-original') || '';
  const alt = ($(el).attr('alt') || '').trim();
  if (!alt || !/[ぁ-んァ-ヾ一-龯]/.test(alt)) return;
  const staffIdMatch = src.match(/\/images_staff\/(\d+)\//);
  if (!staffIdMatch) return;
  const staffId = staffIdMatch[1];
  let name = alt.replace(/\(\d+\)/g, '').replace(/★.*$/, '').trim();
  if (!name || name.length > 15) return;
  const fullUrl = src.startsWith('http') ? src : BASE + src;
  if (!nameImageMap.has(name)) nameImageMap.set(name, { url: fullUrl, staffId });
});

console.log(`サイトから取得: ${nameImageMap.size}名`);
if (DRY_RUN && nameImageMap.size > 0) {
  for (const [n, info] of [...nameImageMap].slice(0, 10)) {
    console.log(`  "${n}" → staffId=${info.staffId} ...${info.url.slice(-40)}`);
  }
}

if (nameImageMap.size === 0) {
  console.log('\nimages_staff パターンの画像が見つかりませんでした。');
  console.log('サイトがJS描画に変わった可能性があります。Chrome での確認が必要です。');
  process.exit(0);
}

// ─── DB 取得 ─────────────────────────────────────────────────────
const { data: shops } = await supabase.from('shops')
  .select('id, name')
  .ilike('website_url', '%zexterior%');

if (!shops?.length) { console.log('Zexteriorの店舗が見つかりません'); process.exit(1); }
console.log(`\n対象店舗: ${shops.map(s => s.name).join(', ')}`);
const shopIds = shops.map(s => s.id);

const { data: nullT } = await supabase.from('therapists')
  .select('id, name, shop_id, image_url')
  .in('shop_id', shopIds)
  .is('image_url', null);

console.log(`DB写真なし: ${nullT?.length ?? 0}名`);

// 名前マッチング
function findMatch(dbName) {
  if (nameImageMap.has(dbName)) return nameImageMap.get(dbName);
  // スペースあり/なし の揺れ
  const noSpace = dbName.replace(/[\s　]/g, '');
  for (const [siteName, info] of nameImageMap) {
    if (siteName.replace(/[\s　]/g, '') === noSpace && noSpace.length >= 2) return info;
  }
  // DB名がサイト名に含まれる（または逆）
  for (const [siteName, info] of nameImageMap) {
    if (siteName.includes(dbName) && dbName.length >= 3) return info;
    if (dbName.includes(siteName) && siteName.length >= 3) return info;
  }
  return null;
}

if (DRY_RUN) {
  console.log('\n[マッチング確認]');
  const matched = (nullT || []).filter(t => findMatch(t.name));
  const notFoundList = (nullT || []).filter(t => !findMatch(t.name));
  console.log(`マッチ: ${matched.length}名`);
  matched.slice(0, 15).forEach(t => {
    const info = findMatch(t.name);
    console.log(`  ✅ "${t.name}" → staffId=${info.staffId}`);
  });
  console.log(`未マッチ: ${notFoundList.length}名`);
  notFoundList.slice(0, 10).forEach(t => console.log(`  ❓ "${t.name}"`));
  process.exit(0);
}

// ─── 更新 ────────────────────────────────────────────────────────
let updated = 0, notFound = 0, failed = 0;
const processedStaffIds = new Map(); // staffId → storageUrl

for (const t of nullT || []) {
  const info = findMatch(t.name);
  if (!info) { process.stdout.write('?'); notFound++; continue; }

  let storageUrl;
  if (processedStaffIds.has(info.staffId)) {
    storageUrl = processedStaffIds.get(info.staffId);
  } else {
    const parts = info.url.split('/');
    const fileId = (parts[parts.length - 1] || '').replace(/\.\w+$/, '').substring(0, 15);
    const fileName = `zexterior_${info.staffId}_${fileId}.jpg`;
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
