/**
 * DAHLIA（五反田） セラピスト写真修正（全5店舗）
 * パターン: gotandadahlia.com/upload/cast/thumb_{id}.jpg
 * 実行: node scripts/maintenance/fix_dahlia_images.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const BASE = 'https://gotandadahlia.com';
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

// alt から "DAHLIA " プレフィックスを除去した名前 + castId
// 画像URL: gotandadahlia.com/upload/cast/thumb_{id}.jpg
const DAHLIA_DATA = [
  ['星野りな', '919'],
  ['水無月さや', '918'],
  ['月島れい', '297'],
  ['藤堂なお', '917'],
  ['綾坂ゆい', '898'],
  ['芹澤りお', '895'],
  ['夢咲のの', '916'],
  ['神楽しの', '913'],
  ['西園寺あや', '912'],
  ['朝倉ほのか', '910'],
  ['如月こゆき', '914'],
  ['北川るい', '908'],
  ['三咲ちひろ', '907'],
  ['斉藤はづき', '873'],
  ['和泉さわ', '896'],
  ['天海しほ', '867'],
  ['水上せりな', '897'],
  ['生田なお', '891'],
  ['早瀬あき', '906'],
  ['桜井もも', '53'],
  ['松本いおり', '871'],
  ['中条ゆりあ', '19'],
  ['小西りか', '25'],
  ['穂村かえで', '12'],
  ['森下すず', '901'],
  ['本宮ありす', '888'],
  ['渡也みさ', '29'],
  ['水野りょう', '904'],
  ['岩下らん', '379'],
  ['橘るか', '446'],
  ['清水まこ', '863'],
  ['北山けい', '491'],
  ['工藤かの', '864'],
  ['大倉れん', '547'],
  ['中井まり', '870'],
  ['佐藤るな', '515'],
  ['長谷川なお', '909'],
  ['松倉めぐ', '510'],
  ['鈴宮　はるか', '536'],
  ['森しずく', '560'],
  ['吉瀬あやめ', '555'],
  ['緒方しおり', '865'],
  ['柏木あきな', '866'],
  ['松原すみれ', '524'],
  ['大槻ゆあ', '192'],
  ['広瀬まい', '911'],
  ['綾波つばさ', '41'],
  ['雪峰はな', '915'],
];

async function uploadImage(castId, fileName) {
  const imageUrl = `${BASE}/upload/cast/thumb_${castId}.jpg`;
  try {
    const res = await fetch(imageUrl, {
      headers: { ...UA, Referer: BASE + '/cast/' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { console.log(`\n  HTTP ${res.status}: thumb_${castId}.jpg`); return null; }
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType: 'image/jpeg', upsert: true });
    if (error) { console.log(`\n  Storage: ${error.message}`); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (e) { console.log(`\n  fetch error: ${e.message}`); return null; }
}

const { data: shops } = await supabase.from('shops')
  .select('id, name')
  .ilike('website_url', '%gotandadahlia%');

if (!shops || shops.length === 0) {
  console.log('DAHLIAの店舗が見つかりません');
  process.exit(1);
}
console.log(`対象店舗: ${shops.map(s => s.id + ' ' + s.name).join(', ')}\n`);

if (DRY_RUN) {
  console.log(`【DAHLIA】 ${DAHLIA_DATA.length}名`);
  DAHLIA_DATA.slice(0, 5).forEach(([n, c]) => console.log(`  ${n} → thumb_${c}.jpg`));
  process.exit(0);
}

let updated = 0, skipped = 0, notFound = 0, failed = 0;
const shopIds = shops.map(s => s.id);

for (const [name, castId] of DAHLIA_DATA) {
  // DBに登録された名前は "DAHLIA " プレフィックスなしのはず
  // ただし元データは "DAHLIA 星野りな" 形式だったかもしれないので両方試みる
  const namesToTry = [name, `DAHLIA ${name}`];
  let therapists = null;

  for (const n of namesToTry) {
    const { data } = await supabase.from('therapists')
      .select('id, shop_id, image_url')
      .in('shop_id', shopIds)
      .eq('name', n);
    if (data && data.length > 0) { therapists = data; break; }
  }

  if (!therapists || therapists.length === 0) {
    process.stdout.write('?'); notFound++; continue;
  }

  const nullOnes = therapists.filter(t => !t.image_url);
  if (nullOnes.length === 0) { process.stdout.write('='); skipped++; continue; }

  const fileName = `dahlia_${castId}.jpg`;
  const storageUrl = await uploadImage(castId, fileName);
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
