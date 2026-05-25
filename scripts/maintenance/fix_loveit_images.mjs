/**
 * Love it（ラヴィット）麻布十番・大宮 セラピスト写真修正
 * パターン: loveit.love/data/staff/{id}/stf_{hash}.jpg
 * 実行: node scripts/maintenance/fix_loveit_images.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const BASE = 'https://loveit.love';
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

const LOVEIT_DATA = [
  ['鳴海あお', `${BASE}/data/staff/17/stf_69438c76273a7.jpg`],
  ['愛野えり', `${BASE}/data/staff/14/stf_69b166d3231ca.jpg`],
  ['小倉ゆい', `${BASE}/data/staff/39/stf_6948048ad31cc.jpg`],
  ['優木みなみ', `${BASE}/data/staff/46/stf_6999a0ecb56d9.png`],
  ['天羽あすか', `${BASE}/data/staff/34/stf_68ddb8ad4d937.jpg`],
  ['一条らな', `${BASE}/data/staff/44/stf_68f31637d57ff.jpg`],
  ['逢沢えま', `${BASE}/data/staff/37/stf_69f7426d27f24.jpg`],
  ['月星うさぎ', `${BASE}/data/staff/12/stf_68540ddc2dfc1.jpg`],
  ['若菜みゆ', `${BASE}/data/staff/13/stf_699f14f33152a.jpg`],
  ['花咲れあ', `${BASE}/data/staff/18/stf_69f04ffe5ba24.png`],
  ['桜庭めぐ', `${BASE}/data/staff/2/stf_6909486e63489.jpg`],
  ['水瀬みずき', `${BASE}/data/staff/21/stf_69eee58ca657c.jpg`],
  ['美波せな', `${BASE}/data/staff/36/stf_6995d7af80719.jpg`],
  ['新堂さら', `${BASE}/data/staff/9/stf_699bad153ad56.jpg`],
  ['南まりん', `${BASE}/data/staff/8/stf_689c3576c4aa8.png`],
  ['夢咲えれな', `${BASE}/data/staff/26/stf_685129158b184.jpg`],
  ['小坂なほ', `${BASE}/data/staff/1/stf_69a925bc0493b.jpg`],
  ['有栖ユマ', `${BASE}/data/staff/22/stf_681001bf6345f.jpg`],
  ['日向ありさ', `${BASE}/data/staff/3/stf_67edebab85b3d.jpg`],
  ['音花せいら', `${BASE}/data/staff/10/stf_6979d243501c1.jpg`],
  ['藤堂さや', `${BASE}/data/staff/43/stf_68e7511e0ffda.jpg`],
  ['宮羽るい', `${BASE}/data/staff/41/stf_683f7385d6e67.jpg`],
  ['神楽りな', `${BASE}/data/staff/29/stf_690a018396672.jpg`],
  ['茉白もね', `${BASE}/data/staff/33/stf_69412124a3e26.jpg`],
  ['来栖わかな', `${BASE}/data/staff/24/stf_690a13bc3e827.jpg`],
  ['雪城ほのか', `${BASE}/data/staff/45/stf_68e8c7d2f173c.jpg`],
  ['星宮なぎさ', `${BASE}/data/staff/40/stf_68a6a8c4df7ba.jpg`],
  ['夢眠なづ', `${BASE}/data/staff/20/stf_68455f15ea14c.jpg`],
  ['苺みる', `${BASE}/data/staff/30/stf_677e1c02ad095.jpg`],
];

async function uploadImage(imageUrl, fileName) {
  try {
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
      .upload(fileName, buf, { contentType: ct, upsert: true });
    if (error) { console.log(`\n  Storage: ${error.message}`); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (e) { console.log(`\n  fetch error: ${e.message}`); return null; }
}

const { data: shops } = await supabase.from('shops').select('id, name').ilike('website_url', '%loveit%');
if (!shops || shops.length === 0) { console.log('Love itの店舗が見つかりません'); process.exit(1); }
console.log(`対象店舗: ${shops.map(s => s.id + ' ' + s.name).join(', ')}\n`);

if (DRY_RUN) {
  LOVEIT_DATA.slice(0, 5).forEach(([n, u]) => console.log(`  ${n} → ${u.split('/').slice(-2).join('/')}`));
  process.exit(0);
}

let updated = 0, skipped = 0, notFound = 0, failed = 0;
const shopIds = shops.map(s => s.id);

for (const [name, imageUrl] of LOVEIT_DATA) {
  const { data: therapists } = await supabase.from('therapists').select('id, shop_id, image_url').in('shop_id', shopIds).eq('name', name);
  if (!therapists || therapists.length === 0) { process.stdout.write('?'); notFound++; continue; }
  const nullOnes = therapists.filter(t => !t.image_url);
  if (nullOnes.length === 0) { process.stdout.write('='); skipped++; continue; }
  const staffId = imageUrl.match(/\/staff\/(\d+)\//)?.[1] || name;
  const ext = imageUrl.split('.').pop();
  const fileName = `loveit_${staffId}.${ext}`;
  const storageUrl = await uploadImage(imageUrl, fileName);
  await sleep(100);
  for (const t of nullOnes) {
    const { error } = await supabase.from('therapists').update({ image_url: storageUrl ?? null }).eq('id', t.id);
    if (error) { console.log(`\n❌ ${name}: ${error.message}`); failed++; }
    else { process.stdout.write(storageUrl ? '+' : 'n'); updated++; }
  }
  await sleep(80);
}
console.log(`\n\n更新 ${updated}件 / スキップ ${skipped}件 / 見つからず ${notFound}件 / 失敗 ${failed}件`);
console.log('\n完了');
