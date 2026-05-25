/**
 * 神奈川 Fromage (フロマージュ) 川崎 セラピスト登録
 * shop_id: kanagawa_kawasaki_fromage
 * 実行: node scripts/maintenance/process_fromage.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const SHOP_ID = 'kanagawa_kawasaki_fromage';
const BASE = 'https://fromage-kawasaki.com';
const S3_HOST = 'fromage-bucket-prod.s3';
const BUCKET = 'therapist-images';
const UA = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Referer': BASE + '/',
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

async function uploadImage(imageUrl, fileName) {
  try {
    const res = await fetch(imageUrl, { headers: UA, signal: AbortSignal.timeout(15000) });
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

console.log('/therapist 取得中...');
const res = await fetch(`${BASE}/therapist`, { headers: UA, signal: AbortSignal.timeout(15000) });
console.log(`HTTP: ${res.status}`);
const html = await res.text();
const $ = cheerio.load(html);

const therapistMap = new Map();

$('a[href*="/therapist/"]').each((_, el) => {
  const nameEl = $(el).find('h3.itemName');
  if (!nameEl.length) return;
  const name = nameEl.text().replace(/\(\d+歳?\)/g, '').replace(/\s+/g, '').trim();
  if (!name || name.length < 1 || name.length > 12) return;

  // S3画像: data-src または src
  const img = $(el).find(`img[data-src*="${S3_HOST}"], img[src*="${S3_HOST}"]`);
  const imageUrl = img.attr('data-src') || img.attr('src') || null;

  if (!therapistMap.has(name)) therapistMap.set(name, imageUrl || null);
});

console.log(`取得: ${therapistMap.size}名`);

if (therapistMap.size === 0) {
  // フォールバック: JS描画の可能性 → 取得失敗を報告
  console.log('⚠️ cheerio で取得できませんでした（JS描画の可能性）');
  console.log('→ Claude in Chrome で再取得が必要です');
  process.exit(1);
}

if (DRY_RUN) {
  for (const [name, url] of therapistMap) {
    console.log(`  ${name} → ${url ? url.slice(0, 80) : '(写真なし)'}`);
  }
  process.exit(0);
}

let inserted = 0, skipped = 0, failed = 0;

for (const [name, imageUrl] of therapistMap) {
  const id = `${SHOP_ID}_${name}`;
  const { data: existing } = await supabase.from('therapists').select('id').eq('id', id).single();
  if (existing) { process.stdout.write('='); skipped++; continue; }

  let storageUrl = null;
  if (imageUrl) {
    // S3 URLからファイル名を取得（UUIDベース）
    const parts = imageUrl.split('/');
    const uuid = parts[parts.length - 1]; // ファイル名部分
    const therapistId = parts[parts.length - 2]; // therapist ID
    const ext = (uuid.match(/\.(jpg|jpeg|png|webp)/i)?.[1] || 'jpg').toLowerCase();
    const safeExt = ext === 'jpeg' ? 'jpg' : ext;
    const fileName = `fromage_${therapistId}_${uuid.replace(/[^\w.-]/g, '_').slice(0, 40)}.${safeExt}`;
    storageUrl = await uploadImage(imageUrl, fileName);
    await sleep(80);
  }

  const { error } = await supabase.from('therapists').insert({
    id, shop_id: SHOP_ID, name, image_url: storageUrl ?? imageUrl ?? null,
  });
  if (error) { console.log(`\n❌ ${name}: ${error.message}`); failed++; }
  else { process.stdout.write(imageUrl ? (storageUrl ? '+' : '.') : 'n'); inserted++; }
  await sleep(80);
}

console.log(`\n\n完了: 挿入 ${inserted}名 / スキップ ${skipped}名 / 失敗 ${failed}名`);
