/**
 * Queen (クイーン) セラピスト登録 (広島3位)
 * 47名 / es-pack.jp CDN (slug: h_queen)
 * 実行: node scripts/maintenance/process_queen_hiroshima.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
const CDN_BASE = 'https://img.es-pack.jp/shop/h_queen/images/';
const SHOP_ID = 'hiroshima_hiroshima_queen';

const THERAPISTS = [
  { name: 'さな',    file: '177988084625568900.jpg' },
  { name: 'りつ',    file: '164275418786670000.png' },
  { name: 'まいか',  file: '177966501446513800.jpg' },
  { name: 'りり',    file: '177863067139213200.jpg' },
  { name: 'ゆい',    file: '177807290970723700.jpg' },
  { name: 'こゆき',  file: '177763252360647400.jpg' },
  { name: 'るる',    file: '177735521903839500.jpg' },
  { name: 'ちはる',  file: '177721233315576800.jpg' },
  { name: 'ゆき',    file: '177721020454846200.jpg' },
  { name: 'かえで',  file: '177243766382895700.jpg' },
  { name: 'こころ',  file: '177243770800986300.png' },
  { name: 'ねね',    file: '177244057254746000.png' },
  { name: 'えな',    file: '175661385186778700.jpg' },
  { name: 'まや',    file: '175655001709660300.jpg' },
  { name: 'なほ',    file: '177244079404298800.png' },
  { name: 'みづき',  file: '177243775429130400.png' },
  { name: 'みい',    file: '174511069129096200.jpg' },
  { name: 'あめ',    file: '175429472246214900.jpg' },
  { name: 'まほ',    file: '174520606158882300.jpg' },
  { name: 'ゆかり',  file: '177243824966743500.png' },
  { name: 'かりな',  file: '177244139381318400.jpg' },
  { name: 'れあ',    file: '177244131369810800.png' },
  { name: 'みか',    file: '177251318527902200.png' },
  { name: 'ひなみ',  file: '177244127049348300.png' },
  { name: 'あみ',    file: '177251360230349900.png' },
  { name: 'よる',    file: '177251380185610500.png' },
  { name: 'せな',    file: '177251374215822200.png' },
  { name: 'れい',    file: '177251451142754300.png' },
  { name: 'にこ',    file: '177243788297187400.png' },
  { name: 'ひなた',  file: '177244086350350300.png' },
  { name: 'めい',    file: '177251639112667000.png' },
  { name: 'ふたば',  file: '177251404487333900.png' },
  { name: 'みあ',    file: '177243779283888400.png' },
  { name: 'ゆいか',  file: '177244118282114400.png' },
  { name: 'あむ',    file: '177243800428815500.png' },
  { name: 'れいな',  file: '177244097125672700.png' },
  { name: 'みお',    file: '177244122982982200.png' },
  { name: 'さくら',  file: '177244109094272800.png' },
  { name: 'なるみ',  file: '177244113399531700.png' },
  { name: 'さよ',    file: '177244135928730300.png' },
  { name: 'みな',    file: '177251641959758400.png' },
  { name: 'あいす',  file: '177763509567992400.jpg' },
  { name: 'りりか',  file: '177251346827414000.png' },
  { name: 'しおり',  file: '177251457237207900.png' },
  { name: 'えま',    file: '177251393123364400.png' },
  { name: 'りいさ',  file: '177251508929517900.png' },
  { name: 'まゆ',    file: '177251048531104400.jpg' },
];

async function uploadImage(file) {
  const numericId = file.replace(/\.[^.]+$/, '');
  const ext = file.split('.').pop();
  const storageKey = `queen_hiroshima_${numericId}.${ext}`;
  const imgUrl = `${CDN_BASE}${file}`;
  try {
    const res = await fetch(imgUrl, {
      headers: { 'User-Agent': UA, 'Referer': 'https://hiroshima-queen.com/' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { console.log(`  ✗ 取得失敗 ${file} (${res.status})`); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const ct = ext === 'png' ? 'image/png' : 'image/jpeg';
    const { error } = await supabase.storage.from('therapist-images').upload(storageKey, buf, { contentType: ct, upsert: true });
    if (error) { console.log(`  ✗ Storage失敗 ${file}: ${error.message}`); return null; }
    return supabase.storage.from('therapist-images').getPublicUrl(storageKey).data.publicUrl;
  } catch (e) { console.log(`  ✗ エラー ${file}: ${e.message}`); return null; }
}

const { data: shopData } = await supabase.from('shops').select('id,name').eq('id', SHOP_ID);
if (!shopData?.length) { console.error(`${SHOP_ID} not found in DB`); process.exit(1); }
console.log(`shop: ${shopData[0].name} (${SHOP_ID})`);

const { count } = await supabase.from('therapists').select('id', { count: 'exact' }).eq('shop_id', SHOP_ID);
console.log(`既存: ${count}件\n`);
if (count > 0 && !process.argv.includes('--force')) { console.log('既登録あり。--force で再実行'); process.exit(0); }

if (DRY_RUN) {
  THERAPISTS.forEach(t => console.log(`  [dry] ${t.name} <- ${CDN_BASE}${t.file}`));
  console.log(`\n(dry-run) 計 ${THERAPISTS.length}名`);
  process.exit(0);
}

let added = 0, failed = 0;
for (const t of THERAPISTS) {
  const imageUrl = await uploadImage(t.file);
  const { error } = await supabase.from('therapists').insert({
    id: `${SHOP_ID}_${t.name}`,
    shop_id: SHOP_ID,
    name: t.name,
    image_url: imageUrl,
  });
  if (!error) { added++; process.stdout.write(imageUrl ? '.' : 'n'); }
  else { failed++; console.log(`\n  ! insert失敗 ${t.name}: ${error.message}`); }
  await new Promise(r => setTimeout(r, 300));
}
process.stdout.write('\n');
console.log(`\n✅ 登録: ${added}名 / 失敗: ${failed}名`);
