/**
 * ひまわり（大阪堺東）& Kobe Eslino（兵庫）セラピスト登録
 * 実行: node scripts/maintenance/process_himawari_eslino.mjs [--dry-run]
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
const sleep = ms => new Promise(r => setTimeout(r, ms));
if (DRY_RUN) console.log('[DRY RUN]\n');

const isNoise = (name) => {
  if (!name || name.length < 1) return true;
  if (name.length > 15) return true;
  if (/エステ|メンズ|求人|体験|新規|イベント|キャンペーン|ランキング/i.test(name)) return true;
  return false;
};

async function uploadImage(imageUrl, fileName, referer) {
  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36', 'Referer': referer },
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
    for (const [name, url] of therapistMap) console.log(`  ${name} → ${url.slice(0, 70)}`);
    return;
  }
  let inserted = 0, skipped = 0, failed = 0;
  for (const [name, imageUrl] of therapistMap) {
    const id = `${shopId}_${name}`;
    const { data: existing } = await supabase.from('therapists').select('id').eq('id', id).single();
    if (existing) { process.stdout.write('='); skipped++; continue; }

    const base = imageUrl.split('/').pop().split('?')[0];
    const stem = base.replace(/\.[^.]+$/, '').replace(/[^\w-]/g, '_').slice(0, 40);
    const ext = (base.match(/\.(jpg|jpeg|png|webp)/i)?.[1] || 'jpg').toLowerCase();
    const safeExt = ext === 'jpeg' ? 'jpg' : ext;
    const fileName = `${prefix}_${stem}.${safeExt}`;

    const storageUrl = await uploadImage(imageUrl, fileName, referer);
    await sleep(80);

    const { error } = await supabase.from('therapists').insert({
      id, shop_id: shopId, name, image_url: storageUrl ?? imageUrl,
    });
    if (error) { console.log(`\n❌ ${name}: ${error.message}`); failed++; }
    else { process.stdout.write(storageUrl ? '+' : '.'); inserted++; }
    await sleep(80);
  }
  console.log(`\n  挿入 ${inserted}名 / スキップ ${skipped}名 / 失敗 ${failed}名`);
}

// ─── ひまわり ────────────────────────────────────────────────────────────────
console.log('【ひまわり】 /cast 取得中...');
{
  const BASE = 'https://sr-himawari.com';
  const UA_REF = 'https://sr-himawari.com/';
  const res = await fetch(`${BASE}/cast`, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': UA_REF },
    signal: AbortSignal.timeout(15000),
  });
  const $ = cheerio.load(await res.text());

  const map = new Map();
  $('img[src*="upload/cast"]').each((_, el) => {
    let alt = ($(el).attr('alt') || '').trim();
    let src = $(el).attr('src') || '';
    // 店名prefix除去: "シークレットルームヒマワリ 里田 　あさみ" → "里田あさみ"
    alt = alt.replace(/シークレットルームヒマワリ\s*/i, '').replace(/sr-himawari\s*/i, '');
    // 余分なスペース除去
    alt = alt.replace(/[\s　]+/g, '').trim();
    if (isNoise(alt)) return;
    if (!src.startsWith('http')) src = `${BASE}${src}`;
    // クエリパラメータ除去
    src = src.split('?')[0];
    if (!map.has(alt)) map.set(alt, src);
  });

  console.log(`  取得: ${map.size}名`);
  await processShop({ shopId: '1076', therapistMap: map, prefix: 'himawari', referer: UA_REF });
}

await sleep(1000);

// ─── Kobe Eslino ─────────────────────────────────────────────────────────────
console.log('\n【Kobe Eslino】 /girl 取得中...');
{
  const BASE = 'https://eslino-kobe.com';
  const UA_REF = 'https://eslino-kobe.com/';
  const res = await fetch(`${BASE}/girl`, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': UA_REF },
    signal: AbortSignal.timeout(15000),
  });
  const $ = cheerio.load(await res.text());

  const map = new Map();
  $('img[src*="/photos/"]').each((_, el) => {
    const alt = ($(el).attr('alt') || '').trim();
    let src = $(el).attr('src') || '';
    // alt: "英愛留(えある)" → そのまま使用（読み仮名付きで登録）
    // ノイズ除去: エスリノ, logo系
    if (isNoise(alt) || /エスリノ|kobe|eslino/i.test(alt)) return;
    if (!src.startsWith('http')) src = `${BASE}${src}`;
    if (!map.has(alt)) map.set(alt, src);
  });

  console.log(`  取得: ${map.size}名`);
  // 2店舗（旭通・加納町）に同じキャストを登録
  for (const shopId of ['1189_1', '1189_2']) {
    await processShop({ shopId, therapistMap: map, prefix: 'eslino', referer: UA_REF });
    await sleep(500);
  }
}

console.log('\n完了');
