/**
 * 女教師の秘め事 セラピスト写真修正
 * パターン: /photos/{id}/{ts}-{file}.jpg  alt="苗字 名前"
 * DB名と一致しない場合は部分マッチ（alt末尾がDB名）
 * 実行: node scripts/maintenance/fix_teacher_secret_images.mjs [--dry-run]
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
const BASE_URL = 'https://teachersecret2025.com';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

async function uploadImage(imageUrl, fileName) {
  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': UA, Referer: BASE_URL + '/' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { process.stdout.write(`[${res.status}]`); return null; }
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const ext = (imageUrl.match(/\.(jpe?g|png|gif|webp)/i)?.[1] || 'jpg').toLowerCase();
    const safeExt = ext === 'jpeg' ? 'jpg' : ext;
    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
    if (error) { process.stdout.write(`[E]`); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (e) { process.stdout.write(`[ERR]`); return null; }
}

// ─── スクレイプ ──────────────────────────────────────────────────
console.log(`${BASE_URL}/ 取得中...`);
const html = await (await fetch(BASE_URL + '/', {
  headers: { 'User-Agent': UA, Referer: BASE_URL + '/' },
  signal: AbortSignal.timeout(20000),
})).text();
const $ = cheerio.load(html);

// /photos/{id}/ パターンの img
const siteMap = new Map(); // altName → {url, photoId}
$('img[src*="/photos/"]').each((_, el) => {
  const src = $(el).attr('src') || '';
  const alt = ($(el).attr('alt') || '').trim();
  if (!alt || !src.match(/\/photos\/\d+\//)) return;
  // バナー・ロゴ除外
  if (/ランキング|求人|エステ|メンズ|情報|banner|logo|bnr/i.test(alt)) return;

  const photoId = src.match(/\/photos\/(\d+)\//)?.[1];
  if (!photoId) return;
  if (!siteMap.has(alt)) siteMap.set(alt, { url: src, photoId });
});

console.log(`サイトから取得: ${siteMap.size}名`);
if (DRY_RUN) {
  for (const [name, info] of siteMap) {
    console.log(`  "${name}" → photoId=${info.photoId} ...${info.url.slice(-50)}`);
  }
}

// ─── DB 取得 ─────────────────────────────────────────────────────
const { data: shops } = await supabase.from('shops').select('id, name').ilike('website_url', '%teachersecret%');
if (!shops?.length) { console.log('店舗なし'); process.exit(1); }
console.log(`\n対象店舗: ${shops.map(s => s.name).join(', ')}`);
const shopIds = shops.map(s => s.id);

const { data: nullT } = await supabase.from('therapists')
  .select('id, name, shop_id, image_url')
  .in('shop_id', shopIds)
  .is('image_url', null);

console.log(`DB写真なし: ${nullT?.length ?? 0}名`);

// ─── 名前マッチング（完全一致 or 部分一致） ─────────────────────
function findMatch(dbName) {
  // 1. 完全一致
  if (siteMap.has(dbName)) return siteMap.get(dbName);
  // 2. サイトのalt名の末尾がDB名（苗字なし）
  for (const [altName, info] of siteMap) {
    if (altName.endsWith(dbName) || altName.endsWith(' ' + dbName) || altName.endsWith('　' + dbName)) {
      return info;
    }
  }
  // 3. DB名がサイトのalt名に含まれる
  for (const [altName, info] of siteMap) {
    if (altName.includes(dbName) && dbName.length >= 2) return info;
  }
  return null;
}

if (DRY_RUN) {
  console.log('\n[マッチング確認]');
  for (const t of nullT || []) {
    const info = findMatch(t.name);
    if (info) {
      console.log(`  ✅ "${t.name}" → photoId=${info.photoId}`);
    } else {
      console.log(`  ❓ "${t.name}" → 未マッチ`);
    }
  }
  process.exit(0);
}

// ─── 更新 ────────────────────────────────────────────────────────
let updated = 0, notFound = 0, failed = 0;
const processedPhotoIds = new Map(); // photoId → storageUrl

for (const t of nullT || []) {
  const info = findMatch(t.name);
  if (!info) { process.stdout.write('?'); notFound++; continue; }

  let storageUrl;
  if (processedPhotoIds.has(info.photoId)) {
    storageUrl = processedPhotoIds.get(info.photoId);
  } else {
    const ext = (info.url.match(/\.(jpe?g|png|gif|webp)/i)?.[1] || 'jpg').toLowerCase();
    const safeExt = ext === 'jpeg' ? 'jpg' : ext;
    const fileName = `teacher_secret_photo_${info.photoId}.${safeExt}`;
    storageUrl = await uploadImage(info.url, fileName);
    processedPhotoIds.set(info.photoId, storageUrl);
    await sleep(120);
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
