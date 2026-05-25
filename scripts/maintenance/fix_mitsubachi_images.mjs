/**
 * 新宿MITSUBACHI セラピスト写真修正
 * パターン: /data/staff/{id}/stf_{hash}.jpg (background-image style, 同一CMS)
 * 実行: node scripts/maintenance/fix_mitsubachi_images.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const BASE = 'https://mens-shinjuku.com';
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

const MITSUBACHI_DATA = [
  ['かなえ', `${BASE}/data/staff/79/stf_69f07e46d0673.jpg`],
  ['あんじゅ', `${BASE}/data/staff/76/stf_69f55011550b0.jpg`],
  ['えり', `${BASE}/data/staff/80/stf_69ff4b235520a.jpg`],
  ['なお', `${BASE}/data/staff/81/stf_69feafdef2638.jpg`],
  ['ちひろ', `${BASE}/data/staff/78/stf_69ed7b0fa6b59.jpg`],
  ['みゆ', `${BASE}/data/staff/70/stf_69da4d4ba8430.jpg`],
  ['ゆあ', `${BASE}/data/staff/68/stf_69d2225b2221d.jpg`],
  ['いろ', `${BASE}/data/staff/66/stf_69cbe750418a3.jpg`],
  ['さく', `${BASE}/data/staff/61/stf_69ba46d2886c1.jpg`],
  ['もね', `${BASE}/data/staff/59/stf_69a44d91c575f.jpg`],
  ['ゆうか', `${BASE}/data/staff/65/stf_69cb313375730.jpg`],
  ['あかり', `${BASE}/data/staff/67/stf_69c7d10c5b50f.jpg`],
  ['あみ', `${BASE}/data/staff/60/stf_69cc6fa1a19f9.jpg`],
  ['つむぎ', `${BASE}/data/staff/45/stf_6981682c3b60a.jpg`],
  ['にこ', `${BASE}/data/staff/63/stf_69b6db1671f4e.jpg`],
  ['りさ', `${BASE}/data/staff/21/stf_698168b772ba6.png`],
  ['ひなの', `${BASE}/data/staff/51/stf_69904db562dd8.jpg`],
  ['うるは', `${BASE}/data/staff/64/stf_69b9ef2e6bb04.jpg`],
  ['すみれ', `${BASE}/data/staff/40/stf_69ba918b9985d.jpg`],
  ['あずさ', `${BASE}/data/staff/20/stf_6980cf70eb7fb.jpg`],
  ['みつき', `${BASE}/data/staff/39/stf_696b9edd3a755.jpg`],
  ['ほたる', `${BASE}/data/staff/36/stf_697dfa13aea72.jpg`],
  ['りん', `${BASE}/data/staff/24/stf_6957c656dfb30.jpg`],
  ['みどり', `${BASE}/data/staff/17/stf_697dfa6102358.png`],
  ['まどか', `${BASE}/data/staff/32/stf_69bbec0cdad16.jpg`],
  ['つばさ', `${BASE}/data/staff/29/stf_695c48f716fcb.jpg`],
  ['あい', `${BASE}/data/staff/14/stf_69be34e3450d4.jpg`],
  ['みなみ', `${BASE}/data/staff/49/stf_698a116f8a5d4.jpg`],
  ['しおり', `${BASE}/data/staff/41/stf_69bee93238bf4.jpg`],
  ['さえ', `${BASE}/data/staff/34/stf_69845c5a90b6c.jpg`],
  ['くるみ', `${BASE}/data/staff/23/stf_6957c5f88432d.jpg`],
  ['うみ', `${BASE}/data/staff/47/stf_698f38faa777c.jpg`],
  ['まる', `${BASE}/data/staff/52/stf_6992dd502df96.jpg`],
  ['ゆきめ', `${BASE}/data/staff/31/stf_698a148be5f85.jpg`],
  ['しいな', `${BASE}/data/staff/27/stf_698451a1dde63.jpg`],
  ['ゆき', `${BASE}/data/staff/19/stf_6957b8653648b.jpg`],
  ['すずな', `${BASE}/data/staff/16/stf_6957b38bcf58b.jpg`],
  ['みずき', `${BASE}/data/staff/15/stf_6957b1436c167.jpg`],
  ['ゆめ', `${BASE}/data/staff/28/stf_695c4894c2be7.jpg`],
  ['ゆりか', `${BASE}/data/staff/44/stf_6974a28284ebc.jpg`],
  ['さらり', `${BASE}/data/staff/22/stf_6957c58d12034.jpg`],
  ['おとは', `${BASE}/data/staff/18/stf_6957b75bc1f0b.jpg`],
  ['おと', `${BASE}/data/staff/77/stf_69ed745755c4e.jpg`],
];

async function uploadImage(imageUrl, fileName) {
  try {
    const isPng = imageUrl.endsWith('.png');
    const contentType = isPng ? 'image/png' : 'image/jpeg';
    const res = await fetch(imageUrl, {
      headers: { ...UA, Referer: BASE + '/' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { console.log(`\n  HTTP ${res.status}: ${imageUrl.slice(-50)}`); return null; }
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType, upsert: true });
    if (error) { console.log(`\n  Storage: ${error.message}`); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (e) { console.log(`\n  fetch error: ${e.message}`); return null; }
}

const { data: shops } = await supabase.from('shops')
  .select('id, name')
  .ilike('website_url', '%mens-shinjuku%');

if (!shops || shops.length === 0) {
  console.log('MITSUBACHIの店舗が見つかりません');
  process.exit(1);
}
console.log(`対象店舗: ${shops.map(s => s.id + ' ' + s.name).join(', ')}\n`);

if (DRY_RUN) {
  console.log(`【MITSUBACHI】 ${MITSUBACHI_DATA.length}名`);
  MITSUBACHI_DATA.slice(0, 5).forEach(([n, u]) => console.log(`  ${n} → ${u.slice(-50)}`));
  process.exit(0);
}

let updated = 0, skipped = 0, notFound = 0, failed = 0;
const shopIds = shops.map(s => s.id);

for (const [name, imageUrl] of MITSUBACHI_DATA) {
  const { data: therapists } = await supabase.from('therapists')
    .select('id, shop_id, image_url')
    .in('shop_id', shopIds)
    .eq('name', name);

  if (!therapists || therapists.length === 0) {
    process.stdout.write('?'); notFound++; continue;
  }

  const nullOnes = therapists.filter(t => !t.image_url);
  if (nullOnes.length === 0) { process.stdout.write('='); skipped++; continue; }

  const staffId = imageUrl.match(/\/staff\/(\d+)\//)?.[1] || name;
  const ext = imageUrl.endsWith('.png') ? 'png' : 'jpg';
  const fileName = `mitsubachi_${staffId}.${ext}`;
  const storageUrl = await uploadImage(imageUrl, fileName);
  await sleep(100);

  for (const t of nullOnes) {
    const { error } = await supabase.from('therapists')
      .update({ image_url: storageUrl ?? null })
      .eq('id', t.id);
    if (error) { console.log(`\n❌ ${name}: ${error.message}`); failed++; }
    else { process.stdout.write(storageUrl ? '+' : 'n'); updated++; }
  }
  await sleep(80);
}

console.log(`\n\n更新 ${updated}件 / スキップ ${skipped}件 / 見つからず ${notFound}件 / 失敗 ${failed}件`);
console.log('\n完了');
