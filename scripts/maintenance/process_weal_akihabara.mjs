/**
 * Weal（ウィール）秋葉原 セラピスト登録
 * パターン: WordPress wp-content/uploads + alt=名前
 * 実行: node scripts/maintenance/process_weal_akihabara.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const BASE = 'https://weal-esthe.com';
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SHOP_ID = 'tokyo_chiyoda_akihabara_weal';

if (DRY_RUN) console.log('[DRY RUN]\n');

// Chrome から取得した43名
const WEAL_DATA = [
  ['月夜りぜ',   `${BASE}/wp-content/uploads/2026/04/12246_20260502144722_600_800_0.jpg`],
  ['愛乃もえ',   `${BASE}/wp-content/uploads/2026/04/11959_20260502144728_600_800_0.jpg`],
  ['前田しずく', `${BASE}/wp-content/uploads/2026/04/11819_20260502144735_600_800_0.jpg`],
  ['本郷あおい', `${BASE}/wp-content/uploads/2026/04/11823_20260502144740_600_800_0.jpg`],
  ['森川りの',   `${BASE}/wp-content/uploads/2026/03/11720_20260502144745_600_800_0.jpg`],
  ['森下いちか', `${BASE}/wp-content/uploads/2026/02/10976_20260502144757_600_800_0.jpg`],
  ['東條みやび', `${BASE}/wp-content/uploads/2026/02/10947_20260502144808_600_800_0.jpg`],
  ['成宮さえ',   `${BASE}/wp-content/uploads/2026/01/10728_20260502144825_600_800_0.jpg`],
  ['鳳城あやか', `${BASE}/wp-content/uploads/2026/01/10535_20260502144833_600_800_0.jpg`],
  ['石原めい',   `${BASE}/wp-content/uploads/2025/03/6221_20260502144839_600_800_0.jpg`],
  ['天羽ここあ', `${BASE}/wp-content/uploads/2025/04/7021_20260502144847_600_800_0.jpg`],
  ['天使すず',   `${BASE}/wp-content/uploads/2025/03/6218_20260502144858_600_800_0.jpg`],
  ['那月なみ',   `${BASE}/wp-content/uploads/2026/05/S__201826334_0-600x797.jpg`],
  ['星月ゆま',   `${BASE}/wp-content/uploads/2025/03/6404_20260502144920_600_800_0.jpg`],
  ['有栖みゆう', `${BASE}/wp-content/uploads/2025/03/6393_20260502144932_600_800_0.jpg`],
  ['柚木さな',   `${BASE}/wp-content/uploads/2025/06/7500_20260502144950_600_800_0.jpg`],
  ['花杉みなみ', `${BASE}/wp-content/uploads/2025/03/6381_20260502145006_600_800_0.jpg`],
  ['天宮いるる', `${BASE}/wp-content/uploads/2025/09/8129_20260502145019_600_800_0.jpg`],
  ['恋星もあ',   `${BASE}/wp-content/uploads/2025/03/6462_20260502145026_600_800_0.jpg`],
  ['美幸ゆみ',   `${BASE}/wp-content/uploads/2026/01/10532_20260502145038_600_800_0.jpg`],
  ['天野さおり', `${BASE}/wp-content/uploads/2025/03/6486_20260502145050_600_800_0.jpg`],
  ['夏目るな',   `${BASE}/wp-content/uploads/2025/06/7480_20260502200728_600_800_0.jpg`],
  ['鈴音りん',   `${BASE}/wp-content/uploads/2025/06/7512_20260502145059_600_800_0.jpg`],
  ['高嶋りんか', `${BASE}/wp-content/uploads/2025/10/8193_20260502145109_600_800_0.jpg`],
  ['初音らら',   `${BASE}/wp-content/uploads/2025/03/6361_20260502145119_600_800_0.jpg`],
  ['愛川みさ',   `${BASE}/wp-content/uploads/2025/03/6406_20260502145131_600_800_0.jpg`],
  ['櫻井あい',   `${BASE}/wp-content/uploads/2025/03/6273_20260502145139_600_800_0.jpg`],
  ['桜庭ひなの', `${BASE}/wp-content/uploads/2025/03/6241_20260502145151_600_800_0.jpg`],
  ['美咲れあ',   `${BASE}/wp-content/uploads/2025/06/7482_20260502145200_600_800_0.jpg`],
  ['葵きょうか', `${BASE}/wp-content/uploads/2025/09/8126_20260502145212_600_800_0.jpg`],
  ['相沢あみ',   `${BASE}/wp-content/uploads/2025/03/6519_20260502145221_600_800_0.jpg`],
  ['椎名ななせ', `${BASE}/wp-content/uploads/2025/11/8606_20260502145232_600_800_0.jpg`],
  ['橘ひさき',   `${BASE}/wp-content/uploads/2025/03/6525_20260502145236_600_800_0.jpg`],
  ['神崎にこ',   `${BASE}/wp-content/uploads/2025/03/6280_20260502145240_600_800_0.jpg`],
  ['岡本さや',   `${BASE}/wp-content/uploads/2025/03/6237_20260502145246_600_800_0.jpg`],
  ['朝比奈しお', `${BASE}/wp-content/uploads/2025/03/6254_20260502145251_600_800_0.jpg`],
  ['春宮ひかり', `${BASE}/wp-content/uploads/2025/03/6261_20260502145258_600_800_0.jpg`],
  ['茉白りね',   `${BASE}/wp-content/uploads/2025/03/6456_20260502145302_600_800_0.jpg`],
  ['二階堂ゆきの', `${BASE}/wp-content/uploads/2025/03/6526_20260502145306_600_800_0.jpg`],
  ['佐藤はな',   `${BASE}/wp-content/uploads/2025/03/6495_20260502145311_600_800_0.jpg`],
  ['七海かな',   `${BASE}/wp-content/uploads/2025/03/6484_20260502145317_600_800_0.jpg`],
  ['青羽ゆいか', `${BASE}/wp-content/uploads/2025/02/6216_20260502145326_600_800_0.jpg`],
  ['西川ゆかり', `${BASE}/wp-content/uploads/2025/03/6268_20260502145321_600_800_0.jpg`],
];

async function uploadImage(imageUrl, fileName) {
  try {
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
      .upload(fileName, buf, { contentType: 'image/jpeg', upsert: true });
    if (error) { console.log(`\n  Storage: ${error.message}`); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (e) { console.log(`\n  fetch error: ${e.message}`); return null; }
}

if (DRY_RUN) {
  console.log(`【Weal 秋葉原】 ${WEAL_DATA.length}名`);
  WEAL_DATA.slice(0, 8).forEach(([n, u]) => console.log(`  ${n} → ${u.slice(-50)}`));
  if (WEAL_DATA.length > 8) console.log(`  ... 他${WEAL_DATA.length - 8}名`);
  process.exit(0);
}

console.log(`\n=== ${SHOP_ID} (${WEAL_DATA.length}名) ===`);
let inserted = 0, skipped = 0, failed = 0;

for (const [name, imageUrl] of WEAL_DATA) {
  const id = `${SHOP_ID}_${name}`;
  const { data: existing } = await supabase.from('therapists').select('id').eq('id', id).single();
  if (existing) { process.stdout.write('='); skipped++; continue; }

  const fname = imageUrl.split('/').pop().replace(/[^\w.-]/g, '_').slice(0, 60);
  const fileName = `weal_${fname}`;
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
