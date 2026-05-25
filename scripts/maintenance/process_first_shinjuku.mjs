/**
 * First 新宿 セラピスト登録
 * パターン: a[href*="therapist.html?id="] > img[src*="/photo/staff/"] + テキストから名前
 * 実行: node scripts/maintenance/process_first_shinjuku.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const BASE = 'https://esthe-first.com';
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SHOP_ID = 'tokyo_shinjuku_shinjuku_first';

if (DRY_RUN) console.log('[DRY RUN]\n');

// Chrome から取得した42名
const FIRST_DATA = [
  ['坂本まなか',   `${BASE}/photo/staff/5/106078_1_20260425162102.png`],
  ['高井らん',     `${BASE}/photo/staff/5/106050_1_20260408132044.png`],
  ['大崎えり',     `${BASE}/photo/staff/5/106040_1_20260401190405.jpg`],
  ['一ノ瀬 るな',  `${BASE}/photo/staff/5/106028_1_20260329214900.png`],
  ['大田さやか',   `${BASE}/photo/staff/5/105996_1_20260320155837.png`],
  ['春川さくら',   `${BASE}/photo/staff/5/105977_1_20260306070139.jpg`],
  ['鹿島あゆ',     `${BASE}/photo/staff/5/105976_1_20260305024916.jpg`],
  ['松本さちか',   `${BASE}/photo/staff/5/105913_1_20260127013741.jpg`],
  ['橘しずく',     `${BASE}/photo/staff/5/105804_1_20251219212812.jpg`],
  ['辻せりな',     `${BASE}/photo/staff/5/105737_1_20251117195554.jpg`],
  ['藤崎さや',     `${BASE}/photo/staff/5/105701_1_20251013162948.jpg`],
  ['白石れい',     `${BASE}/photo/staff/5/105686_1_20251018204106.jpg`],
  ['高瀬かえで',   `${BASE}/photo/staff/5/105653_1_20250916002943.jpg`],
  ['結城めい',     `${BASE}/photo/staff/5/105643_1_20250910111105.jpg`],
  ['真白かりん',   `${BASE}/photo/staff/5/105532_1_20250813103714.jpg`],
  ['山中みく',     `${BASE}/photo/staff/5/105503_1_20250802211023.jpg`],
  ['中野さな',     `${BASE}/photo/staff/5/105509_1_20250703023202.jpg`],
  ['椿ゆきの',     `${BASE}/photo/staff/5/105450_1_20250625001732.jpg`],
  ['星野みき',     `${BASE}/photo/staff/5/105421_1_20250602170439.jpg`],
  ['綾瀬せいら',   `${BASE}/photo/staff/5/105405_1_20260313181923.jpg`],
  ['中村りりあ',   `${BASE}/photo/staff/5/105358_1_20251119155209.jpg`],
  ['北川すず',     `${BASE}/photo/staff/5/105349_1_20250427130214.jpg`],
  ['水瀬みおん',   `${BASE}/photo/staff/5/105040_1_20250125231813.jpg`],
  ['小森ゆあ',     `${BASE}/photo/staff/5/104949_1_20241119001811.jpg`],
  ['風間つばき',   `${BASE}/photo/staff/5/104905_1_20250205143837.jpg`],
  ['森すみか',     `${BASE}/photo/staff/5/104847_1_20250225232219.jpg`],
  ['白井ゆき',     `${BASE}/photo/staff/5/104671_1_20240615174936.jpg`],
  ['織田もも',     `${BASE}/photo/staff/5/104515_1_20241129234420.jpg`],
  ['木村さき',     `${BASE}/photo/staff/5/104280_1_20240115041758.jpg`],
  ['真野ゆな',     `${BASE}/photo/staff/5/103651_1_20230805155429.jpg`],
  ['森田りこ',     `${BASE}/photo/staff/5/103541_1_20230629031057.jpg`],
  ['白咲なな',     `${BASE}/photo/staff/5/103472_1_20250414210357.jpg`],
  ['佐藤ふうか',   `${BASE}/photo/staff/5/103391_1_20230503123235.jpg`],
  ['福美れい',     `${BASE}/photo/staff/5/101107_1_20210803210415.jpg`],
  ['彩川みゆき',   `${BASE}/photo/staff/5/100872_1_20230513210555.jpg`],
  ['大槻かな',     `${BASE}/photo/staff/5/100162_1_20230303195332.jpg`],
  ['大谷まいか',   `${BASE}/photo/staff/5/99478_1_20200113191439.jpg`],
  ['佐野りほ',     `${BASE}/photo/staff/5/99384_1_20221025202318.jpg`],
  ['霧島すみれ',   `${BASE}/photo/staff/5/98855_1_20190804123432.jpg`],
  ['南かれん',     `${BASE}/photo/staff/5/98123_1_20260329132504.jpg`],
  ['三上みか',     `${BASE}/photo/staff/5/97747_1_20181025170820.jpg`],
  ['藤井リナ',     `${BASE}/photo/staff/5/97815_1_20230330211943.jpg`],
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
  console.log(`【First 新宿】 ${FIRST_DATA.length}名`);
  FIRST_DATA.slice(0, 8).forEach(([n, u]) => console.log(`  ${n} → ${u.slice(-50)}`));
  if (FIRST_DATA.length > 8) console.log(`  ... 他${FIRST_DATA.length - 8}名`);
  process.exit(0);
}

console.log(`\n=== ${SHOP_ID} (${FIRST_DATA.length}名) ===`);
let inserted = 0, skipped = 0, failed = 0;

for (const [name, imageUrl] of FIRST_DATA) {
  const id = `${SHOP_ID}_${name}`;
  const { data: existing } = await supabase.from('therapists').select('id').eq('id', id).single();
  if (existing) { process.stdout.write('='); skipped++; continue; }

  // staff ID をファイル名に使用（例: 106078_1_20260425162102.png → first_106078.png）
  const staffId = imageUrl.match(/\/(\d+)_\d+_\d+\.(png|jpg)/)?.[1] || name;
  const ext = imageUrl.endsWith('.png') ? 'png' : 'jpg';
  const fileName = `first_${staffId}.${ext}`;
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
