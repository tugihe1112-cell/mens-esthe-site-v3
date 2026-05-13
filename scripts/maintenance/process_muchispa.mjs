/**
 * むちすぱルーム 南浦和 セラピスト登録
 * CMS: /data/staff/{id}/stf_{hash}.webp (THE PREMIUM SPA と同一CMS)
 * 実行: node scripts/maintenance/process_muchispa.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const BASE = 'https://muchispa-room.com';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

// Chrome DOM 抽出データ（29名）
const MUCHISPA_DATA = [
  ['ひめ',   184, 'stf_6a041d4499cfb.webp'],
  ['ゆか',   185, 'stf_69fdbafce3f81.webp'],
  ['えみり', 179, 'stf_6a007b822b502.webp'],
  ['ひより', 175, 'stf_697029d94bdb0.webp'],
  ['えな',   181, 'stf_69b7c21c84c32.webp'],
  ['こなつ', 183, 'stf_69edce726e5c9.webp'],
  ['るい',   173, 'stf_695dc9ddaabc9.webp'],
  ['みるく',  57, 'stf_698f3df5c2a02.webp'],
  ['あやね',  77, 'stf_699696f347975.webp'],
  ['あやか', 170, 'stf_693fecf5d62b2.webp'],
  ['うみ',   157, 'stf_69f295fbdcf28.webp'],
  ['まりあ',  25, 'stf_69e73c70080dd.webp'],
  ['ゆあ',    89, 'stf_68467d2e579c1.webp'],
  ['みつき', 119, 'stf_6986f145e4815.webp'],
  ['りん',   136, 'stf_699c31e646acc.webp'],
  ['すず',   105, 'stf_69508e84c1986.webp'],
  ['えみ',    67, 'stf_6603b4aeeacd6.webp'],
  ['ひまり', 169, 'stf_693e60a09bdaf.webp'],
  ['みや',   168, 'stf_69b38ab980f13.webp'],
  ['ゆかり', 142, 'stf_67eea3c30f4cd.webp'],
  ['くるみ',  73, 'stf_6617fa81a6cf4.webp'],
  ['かれん',  97, 'stf_6894957251495.webp'],
  ['のあ',   172, 'stf_69cf22a534d67.webp'],
  ['ゆうな', 176, 'stf_6972e41e317d5.webp'],
  ['えり',   174, 'stf_696a64ced3549.webp'],
  ['なな',   160, 'stf_68c84ff5bcb4e.webp'],
  ['もえ',   154, 'stf_68500e54101dd.webp'],
  ['しほ',   166, 'stf_6904486fcd60f.webp'],
  ['まゆ',    90, 'stf_66e6b53a8579d.webp'],
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

// DB確認
const { data: shop } = await supabase.from('shops').select('id, name, website_url').eq('id', 'muchispa_minamiurawa').single();
if (!shop) { console.log('店舗なし'); process.exit(1); }
console.log(`対象店舗: ${shop.name} (${shop.id})`);
console.log(`現在のURL: ${shop.website_url}`);

// website_url を修正
if (shop.website_url !== `${BASE}/`) {
  if (!DRY_RUN) {
    await supabase.from('shops').update({ website_url: `${BASE}/` }).eq('id', shop.id);
    console.log(`✅ website_url を ${BASE}/ に更新`);
  } else {
    console.log(`[DRY] website_url を ${BASE}/ に更新予定`);
  }
}

// 既存セラピスト確認
const { data: existing } = await supabase.from('therapists').select('name').eq('shop_id', shop.id);
const existingNames = new Set(existing?.map(t => t.name) || []);
console.log(`既存: ${existingNames.size}名`);

if (DRY_RUN) {
  console.log(`\n登録予定: ${MUCHISPA_DATA.length}名`);
  MUCHISPA_DATA.forEach(([name, staffId]) => {
    const status = existingNames.has(name) ? '= (スキップ)' : '+ (新規)';
    console.log(`  ${status} ${name} (staffId=${staffId})`);
  });
  process.exit(0);
}

let inserted = 0, skipped = 0, failed = 0;

for (const [name, staffId, stfFile] of MUCHISPA_DATA) {
  if (existingNames.has(name)) { process.stdout.write('='); skipped++; continue; }

  const imageUrl = `${BASE}/data/staff/${staffId}/${stfFile}`;
  const fileName = `muchispa_${staffId}.webp`;
  const storageUrl = await uploadImage(imageUrl, fileName);
  await sleep(150);

  const id = `${shop.id}_${name}`;
  const { error } = await supabase.from('therapists').upsert({
    id,
    shop_id: shop.id,
    name,
    image_url: storageUrl ?? imageUrl,
  });
  if (error) { console.log(`\n❌ ${name}: ${error.message}`); failed++; }
  else { process.stdout.write(storageUrl ? '+' : '.'); inserted++; }
  await sleep(80);
}

console.log(`\n\n登録 ${inserted}名 / スキップ ${skipped}名 / 失敗 ${failed}名`);
console.log('完了');
