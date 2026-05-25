/**
 * 癒しの空間 ANNEX（上野）セラピスト登録
 * パターン: WordPress wp-content/uploads + alt=名前
 * 実行: node scripts/maintenance/process_annex_ueno.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const BASE = 'https://iyashinokuukan.net';
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SHOP_ID = 'tokyo_taito_ueno_iyashinokuukan_annex';

if (DRY_RUN) console.log('[DRY RUN]\n');

// Chrome から取得した27名
const ANNEX_DATA = [
  ['みずき', `${BASE}/wp-content/uploads/2026/04/S__31825923_0-600x900.jpg`],
  ['るい',   `${BASE}/wp-content/uploads/2026/03/S__30900277_0-600x901.jpg`],
  ['ゆい',   `${BASE}/wp-content/uploads/2026/01/S__29204488_0-600x900.jpg`],
  ['さら',   `${BASE}/wp-content/uploads/2025/11/S__27549701_0-600x900.jpg`],
  ['すずか', `${BASE}/wp-content/uploads/2025/10/S__26845190_0-600x900.jpg`],
  ['のの',   `${BASE}/wp-content/uploads/2025/10/S__91660295_0-600x900.jpg`],
  ['ちい',   `${BASE}/wp-content/uploads/2026/02/S__29351951_0-600x900.jpg`],
  ['りな',   `${BASE}/wp-content/uploads/2025/09/S__90677301_0-600x900.jpg`],
  ['あかね', `${BASE}/wp-content/uploads/2026/03/S__31178756_0-600x900.jpg`],
  ['みさき', `${BASE}/wp-content/uploads/2025/10/S__26263568_0-600x900.jpg`],
  ['しほ',   `${BASE}/wp-content/uploads/2025/09/S__26025994_0-600x900.jpg`],
  ['れな',   `${BASE}/wp-content/uploads/2025/08/S__89874435-600x900.jpg`],
  ['らな',   `${BASE}/wp-content/uploads/2025/09/S__25862191_0-600x900.jpg`],
  ['ねお',   `${BASE}/wp-content/uploads/2025/10/S__26337290_0-600x900.jpg`],
  ['ゆいな', `${BASE}/wp-content/uploads/2025/09/S__90619958_0-600x900.jpg`],
  ['みさ',   `${BASE}/wp-content/uploads/2026/03/IMG_8640-600x900.jpeg`],
  ['れい',   `${BASE}/wp-content/uploads/2025/10/S__91897935_0-600x900.jpg`],
  ['るう',   `${BASE}/wp-content/uploads/2025/09/S__90964063_0-600x900.jpg`],
  ['まい',   `${BASE}/wp-content/uploads/2025/03/iyashinokuukan-mai.jpg`],
  ['まき',   `${BASE}/wp-content/uploads/2025/09/S__90873892_0-600x900.jpg`],
  ['ゆう',   `${BASE}/wp-content/uploads/2025/09/S__25870341_0-600x900.jpg`],
  ['ねろ',   `${BASE}/wp-content/uploads/2025/09/S__26066950_0-600x900.jpg`],
  ['かのん', `${BASE}/wp-content/uploads/2025/09/S__91250760_0-600x900.jpg`],
  ['うるは', `${BASE}/wp-content/uploads/2025/09/S__25894915_0-600x900.jpg`],
  ['ひまり', `${BASE}/wp-content/uploads/2025/09/S__90751086_0-600x900.jpg`],
  ['なこ',   `${BASE}/wp-content/uploads/2025/03/iyashinokuukan-nako1.jpg`],
  ['なゆ',   `${BASE}/wp-content/uploads/2025/03/iyashinokuukan-nayu.jpg`],
];

async function uploadImage(imageUrl, fileName) {
  try {
    const isJpeg = imageUrl.endsWith('.jpeg');
    const contentType = isJpeg ? 'image/jpeg' : 'image/jpeg';
    const res = await fetch(imageUrl, {
      headers: { ...UA, Referer: BASE + '/' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { console.log(`\n  HTTP ${res.status}: ${imageUrl.slice(-50)}`); return null; }
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/') || ct.includes('svg')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType, upsert: true });
    if (error) { console.log(`\n  Storage: ${error.message}`); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (e) { console.log(`\n  fetch error: ${e.message}`); return null; }
}

if (DRY_RUN) {
  console.log(`【癒しの空間 ANNEX】 ${ANNEX_DATA.length}名`);
  ANNEX_DATA.slice(0, 8).forEach(([n, u]) => console.log(`  ${n} → ${u.slice(-50)}`));
  if (ANNEX_DATA.length > 8) console.log(`  ... 他${ANNEX_DATA.length - 8}名`);
  process.exit(0);
}

console.log(`\n=== ${SHOP_ID} (${ANNEX_DATA.length}名) ===`);
let inserted = 0, skipped = 0, failed = 0;

for (const [name, imageUrl] of ANNEX_DATA) {
  const id = `${SHOP_ID}_${name}`;
  const { data: existing } = await supabase.from('therapists').select('id').eq('id', id).single();
  if (existing) { process.stdout.write('='); skipped++; continue; }

  // wp-content ファイル名をStorage名に使用
  const fname = imageUrl.split('/').pop().replace(/[^\w.-]/g, '_');
  const fileName = `annex_${fname}`;
  const storageUrl = await uploadImage(imageUrl, fileName);
  await sleep(100);

  const { error } = await supabase.from('therapists').insert({
    id, shop_id: SHOP_ID, name, image_url: storageUrl ?? null,
  });
  if (error) { console.log(`\n❌ ${name}: ${error.message}`); failed++; }
  else { process.stdout.write(storageUrl ? '+' : 'n'); inserted++; }
  await sleep(80);
}

console.log(`\n\n挿入 ${inserted}名 / スキップ ${skipped}名 / 失敗 ${failed}名`);
console.log('\n完了');
