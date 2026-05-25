/**
 * 超レベチなエステ24 東京店 写真なしセラピスト修正
 * /therapist/ の estama CDN 画像を取得してDBを更新
 * 対象: image_url が null のセラピスト（全店舗）
 * 実行: node scripts/maintenance/fix_levechi_tokyo_images.mjs [--dry-run]
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
const SITE_URL = 'https://tokyo242424.com/therapist/';
const UA = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Referer': 'https://tokyo242424.com/',
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

const isNoise = (name) => {
  if (!name || name.length === 0) return true;
  if (name.length > 15) return true;
  if (/エステ|メンズ|成田|東金|高崎|中野|初台|渋谷|ルーム|求人|予約|ランキング|スタッフ|セラピスト/i.test(name)) return true;
  return false;
};

async function uploadImage(imageUrl, fileName) {
  try {
    const res = await fetch(imageUrl, { headers: UA, signal: AbortSignal.timeout(15000) });
    if (!res.ok) { console.log(`\n  HTTP ${res.status}: ${imageUrl.slice(-60)}`); return null; }
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/') || ct.includes('svg')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const ext = (imageUrl.match(/\.(jpe?g|png|gif|webp)/i)?.[1] || 'jpg').toLowerCase();
    const safeExt = ext === 'jpeg' ? 'jpg' : ext;
    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
    if (error) { console.log(`\n  Storage: ${error.message}`); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (e) { console.log(`\n  fetch error: ${e.message}`); return null; }
}

// ─── スクレイプ ──────────────────────────────────────────────────
console.log(`${SITE_URL} 取得中...`);
const res = await fetch(SITE_URL, { headers: UA, signal: AbortSignal.timeout(15000) });
const html = await res.text();
const $ = cheerio.load(html);

// cast/main パターン（process_levechi.mjs と同じ）
const nameImageMap = new Map();
$('img[src*="cast/main"]').each((_, el) => {
  const name = ($(el).attr('alt') || '').trim();
  const src = $(el).attr('src') || '';
  if (isNoise(name) || !src) return;
  if (!nameImageMap.has(name)) nameImageMap.set(name, src);
});

console.log(`サイトから取得: ${nameImageMap.size}名`);
if (DRY_RUN) {
  for (const [name, url] of nameImageMap) {
    console.log(`  ${name} → ...${url.slice(-60)}`);
  }
}

// ─── DB 取得（全店舗の写真なし） ─────────────────────────────────
const { data: shops } = await supabase.from('shops').select('id, name').ilike('website_url', '%tokyo242424%');
if (!shops?.length) { console.log('店舗が見つかりません'); process.exit(1); }
console.log(`\n対象店舗: ${shops.map(s => `${s.name}(${s.id})`).join(', ')}`);
const shopIds = shops.map(s => s.id);

const { data: nullTherapists } = await supabase.from('therapists')
  .select('id, name, shop_id, image_url')
  .in('shop_id', shopIds)
  .is('image_url', null);

console.log(`DB写真なし: ${nullTherapists?.length ?? 0}名`);

if (!nullTherapists?.length) { console.log('写真なしセラピストはいません'); process.exit(0); }

// ─── マッチング確認（dry-run） ────────────────────────────────────
if (DRY_RUN) {
  console.log('\n[マッチング確認]');
  const matched = nullTherapists.filter(t => nameImageMap.has(t.name));
  const notFound = nullTherapists.filter(t => !nameImageMap.has(t.name));
  console.log(`マッチ: ${matched.length}名`);
  matched.slice(0, 10).forEach(t => {
    const url = nameImageMap.get(t.name);
    console.log(`  ✅ ${t.name}(${t.shop_id})`);
  });
  console.log(`\n未マッチ: ${notFound.length}名`);
  notFound.slice(0, 10).forEach(t => console.log(`  ❓ ${t.name}(${t.shop_id})`));
  process.exit(0);
}

// ─── 更新（同一名前は複数店舗に存在するので全て更新） ────────────────
// 名前でグループ化（複数店舗対応）
const therapistsByName = new Map();
for (const t of nullTherapists) {
  if (!therapistsByName.has(t.name)) therapistsByName.set(t.name, []);
  therapistsByName.get(t.name).push(t);
}

let updated = 0, notFound = 0, failed = 0;

for (const [name, therapists] of therapistsByName) {
  const imageUrl = nameImageMap.get(name);
  if (!imageUrl) {
    process.stdout.write('?');
    notFound += therapists.length;
    continue;
  }

  // ファイル名: estama CDN のキーを使用
  const imgKey = imageUrl.match(/cast\/main\/[^/]+\/([^/?]+)/)?.[1]
    || imageUrl.match(/\/([^/?]+)\?/)?.[1]
    || name;
  const ext = (imageUrl.match(/\.(jpe?g|png|gif|webp)/i)?.[1] || 'jpg').toLowerCase();
  const safeExt = ext === 'jpeg' ? 'jpg' : ext;
  const fileName = `levechi_${imgKey.replace(/[^\w-]/g, '_')}.${safeExt}`;

  const storageUrl = await uploadImage(imageUrl, fileName);
  await sleep(80);

  for (const t of therapists) {
    const { error } = await supabase.from('therapists')
      .update({ image_url: storageUrl ?? imageUrl })
      .eq('id', t.id);
    if (error) {
      console.log(`\n❌ ${name}(${t.shop_id}): ${error.message}`);
      failed++;
    } else {
      process.stdout.write(storageUrl ? '+' : '.');
      updated++;
    }
  }
  await sleep(80);
}

console.log(`\n\n更新 ${updated}件 / 見つからず ${notFound}件 / 失敗 ${failed}件`);
console.log('完了');
