/**
 * 熟れた果実 セラピスト写真修正
 * WordPress wp-content/uploads パターン
 * 実行: node scripts/maintenance/fix_urekaji_images.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const BASE = 'https://spa-urekaji.com';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

const UREKAJI_DATA = [
  ['北原凛', `${BASE}/wp-content/uploads/2026/05/2CF2B1C5-1E9A-43C0-9CA0-146C114C60D6-7040-000001B2E97164A3.jpeg`],
  ['黒崎あず', `${BASE}/wp-content/uploads/2026/05/IMG_3572.jpeg`],
];

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

const { data: shops } = await supabase.from('shops').select('id, name').ilike('website_url', '%spa-urekaji%');
if (!shops?.length) { console.log('店舗なし'); process.exit(1); }
console.log(`対象店舗: ${shops.map(s => s.name).join(', ')}`);
const shopIds = shops.map(s => s.id);

const { data: nullT } = await supabase.from('therapists')
  .select('id, name, shop_id, image_url')
  .in('shop_id', shopIds)
  .is('image_url', null);

console.log(`DB写真なし: ${nullT?.length ?? 0}名`);

const nameImageMap = new Map(UREKAJI_DATA);

function findMatch(dbName) {
  if (nameImageMap.has(dbName)) return nameImageMap.get(dbName);
  const noSpace = dbName.replace(/[\s　]/g, '');
  for (const [siteName, url] of UREKAJI_DATA) {
    if (siteName.replace(/[\s　]/g, '') === noSpace) return url;
  }
  return null;
}

if (DRY_RUN) {
  console.log('\n[マッチング確認]');
  for (const t of nullT || []) {
    const url = findMatch(t.name);
    if (url) console.log(`  ✅ "${t.name}"`);
    else console.log(`  ❓ "${t.name}"`);
  }
  process.exit(0);
}

let updated = 0, notFound = 0, failed = 0;
const processedUrls = new Map();

for (const t of nullT || []) {
  const imageUrl = findMatch(t.name);
  if (!imageUrl) { process.stdout.write('?'); notFound++; continue; }

  let storageUrl;
  if (processedUrls.has(imageUrl)) {
    storageUrl = processedUrls.get(imageUrl);
  } else {
    const fileName = `urekaji_${imageUrl.split('/').pop().split('.')[0].slice(0, 30)}.jpg`;
    storageUrl = await uploadImage(imageUrl, fileName);
    processedUrls.set(imageUrl, storageUrl);
    await sleep(150);
  }

  const { error } = await supabase.from('therapists')
    .update({ image_url: storageUrl ?? imageUrl })
    .eq('id', t.id);
  if (error) { console.log(`\n❌ ${t.name}: ${error.message}`); failed++; }
  else { process.stdout.write(storageUrl ? '+' : '.'); updated++; }
  await sleep(80);
}

console.log(`\n\n更新 ${updated}件 / 未マッチ ${notFound}件 / 失敗 ${failed}件`);
console.log('完了');
