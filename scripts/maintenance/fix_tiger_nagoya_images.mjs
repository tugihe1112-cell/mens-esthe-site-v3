/**
 * タイガーアイ（名古屋）セラピスト写真修正
 * パターン: tiger01-nagoya.com/images_staff/{id}/{file}.jpg
 * 実行: node scripts/maintenance/fix_tiger_nagoya_images.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const BASE = 'https://tiger01-nagoya.com';
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

const TIGER_DATA = [
  ['みどり', `${BASE}/images_staff/1034/051116594232.jpg`],
  ['すずね', `${BASE}/images_staff/1033/050913504767.jpg`],
  ['ゆま', `${BASE}/images_staff/1031/050403032113.jpg`],
  ['あお', `${BASE}/images_staff/1030/050215483833.jpg`],
  ['ひいろ', `${BASE}/images_staff/1029/050616273018.jpg`],
  ['りんご', `${BASE}/images_staff/1026/042915351250.jpg`],
  ['あの', `${BASE}/images_staff/1025/042812592820.jpg`],
  ['あさ', `${BASE}/images_staff/1022/042016182586.jpg`],
  ['みぽ', `${BASE}/images_staff/1021/041812584185.jpg`],
  ['ぱるる', `${BASE}/images_staff/1018/041620213351.jpg`],
  ['まりか', `${BASE}/images_staff/1014/041316393331.jpg`],
  ['いちご', `${BASE}/images_staff/1013/041117450253.jpg`],
  ['みこと', `${BASE}/images_staff/1012/041100581622.jpg`],
  ['いくみ', `${BASE}/images_staff/1009/040812211985.jpg`],
  ['ほたる', `${BASE}/images_staff/1008/040900425487.jpg`],
  ['ゆめ', `${BASE}/images_staff/1006/04051314464.jpg`],
  ['はるみ', `${BASE}/images_staff/1005/040113552641.jpg`],
  ['せいな', `${BASE}/images_staff/1004/040102091116.jpg`],
  ['れみ', `${BASE}/images_staff/1003/040102114836.jpg`],
  ['まりあ', `${BASE}/images_staff/1002/033022554845.jpg`],
  ['りさ', `${BASE}/images_staff/999/032815035168.jpg`],
  ['りる', `${BASE}/images_staff/998/032712302574.jpg`],
  ['りぼん', `${BASE}/images_staff/997/032802410283.jpg`],
  ['さと', `${BASE}/images_staff/996/032613284258.jpg`],
  ['つばき', `${BASE}/images_staff/995/032712270541.jpg`],
  ['かよ', `${BASE}/images_staff/994/032515530624.jpg`],
  ['じゅん', `${BASE}/images_staff/993/032212182292.jpg`],
  ['ほまれ', `${BASE}/images_staff/992/032216112926.jpg`],
  ['たま', `${BASE}/images_staff/991/032200261662.jpg`],
  ['せな', `${BASE}/images_staff/990/032414081774.jpg`],
  ['るいか', `${BASE}/images_staff/988/031917412219.jpg`],
  ['なの', `${BASE}/images_staff/986/031812070173.jpg`],
  ['こな', `${BASE}/images_staff/981/031415472866.jpg`],
  ['えま', `${BASE}/images_staff/980/031013455727.jpg`],
  ['くろ', `${BASE}/images_staff/978/030919542311.jpeg`],
  ['かおり', `${BASE}/images_staff/977/030916051854.jpg`],
  ['みすず', `${BASE}/images_staff/975/03061834409.jpg`],
  ['じゅり', `${BASE}/images_staff/974/030620365556.jpg`],
  ['なつき', `${BASE}/images_staff/971/03041858581.jpg`],
  ['ゆり', `${BASE}/images_staff/970/030212125695.jpg`],
  ['まほみ', `${BASE}/images_staff/969/030318151648.jpg`],
  ['しゅう', `${BASE}/images_staff/968/030114081940.jpg`],
  ['めゆ', `${BASE}/images_staff/966/022712373010.jpg`],
  ['みさと', `${BASE}/images_staff/965/022701180217.jpg`],
  ['ふうか', `${BASE}/images_staff/963/022512463314.jpg`],
  ['あずき', `${BASE}/images_staff/962/030318064624.jpg`],
  ['かりな', `${BASE}/images_staff/961/022311251553.jpg`],
  ['こむぎ', `${BASE}/images_staff/960/03030218566.jpg`],
  ['ほし', `${BASE}/images_staff/957/022023350094.jpg`],
  ['かなで', `${BASE}/images_staff/956/022021501675.jpg`],
  ['ゆず', `${BASE}/images_staff/955/021914214999.jpg`],
  ['かな', `${BASE}/images_staff/949/042813074744.jpg`],
  ['てん', `${BASE}/images_staff/948/021619150856.jpg`],
  ['あいみ', `${BASE}/images_staff/947/021416423241.jpg`],
  ['せいら', `${BASE}/images_staff/945/021000095089.jpg`],
  ['ひなた', `${BASE}/images_staff/944/020323253490.jpg`],
  ['ちさ', `${BASE}/images_staff/942/020418145071.jpeg`],
  ['りおな', `${BASE}/images_staff/941/01311255581.jpg`],
  ['あやめ', `${BASE}/images_staff/940/013103564474.jpg`],
  ['うる', `${BASE}/images_staff/939/013103535689.jpg`],
  ['りえ', `${BASE}/images_staff/938/012701582519.jpg`],
  ['りりあ', `${BASE}/images_staff/937/022711255879.jpg`],
  ['のあ', `${BASE}/images_staff/936/012516254458.jpg`],
  ['にじ', `${BASE}/images_staff/935/012413071384.jpg`],
  ['すう', `${BASE}/images_staff/934/022711223882.jpg`],
  ['あんな', `${BASE}/images_staff/932/012412372251.jpg`],
  ['うみ', `${BASE}/images_staff/931/012312075977.jpg`],
  ['あずさ', `${BASE}/images_staff/930/012012075225.jpg`],
  ['りこ', `${BASE}/images_staff/929/022714491712.jpg`],
  ['うらら', `${BASE}/images_staff/928/011713444650.jpg`],
  ['める', `${BASE}/images_staff/927/011413182443.jpg`],
  ['もえ', `${BASE}/images_staff/926/011023382841.jpg`],
  ['にいな', `${BASE}/images_staff/925/010615312775.jpg`],
  ['もか', `${BASE}/images_staff/924/010615291137.jpg`],
  ['るる', `${BASE}/images_staff/923/011423400379.jpg`],
  ['さち', `${BASE}/images_staff/919/122215084287.jpg`],
  ['ねむ', `${BASE}/images_staff/918/122113380147.jpg`],
  ['みりや', `${BASE}/images_staff/916/121414120253.jpg`],
  ['さえ', `${BASE}/images_staff/914/121113194751.jpg`],
  ['まや', `${BASE}/images_staff/913/121120375715.jpg`],
  ['あかり', `${BASE}/images_staff/912/121017501045.jpeg`],
  ['ひか', `${BASE}/images_staff/911/121101014620.jpg`],
  ['ゆりな', `${BASE}/images_staff/908/120714051071.jpg`],
  ['いろは', `${BASE}/images_staff/906/120521462426.jpeg`],
  ['ふゆ', `${BASE}/images_staff/902/113018030032.jpeg`],
  ['みさ', `${BASE}/images_staff/901/112915424370.jpg`],
  ['ゆうひ', `${BASE}/images_staff/898/112523340345.jpg`],
  ['れん', `${BASE}/images_staff/896/11241129003.jpg`],
  ['きなこ', `${BASE}/images_staff/895/112316325528.jpg`],
  ['まゆ', `${BASE}/images_staff/893/112020153072.jpg`],
  ['まこ', `${BASE}/images_staff/892/112020185250.jpg`],
  ['きい', `${BASE}/images_staff/890/111915003317.jpg`],
  ['ことり', `${BASE}/images_staff/889/111814083473.jpg`],
  ['すみれ', `${BASE}/images_staff/887/022711243569.jpg`],
  ['うの', `${BASE}/images_staff/883/111513204978.jpg`],
  ['ぴんく', `${BASE}/images_staff/882/111423193133.jpg`],
  ['きほ', `${BASE}/images_staff/881/022711204544.jpg`],
  ['あきな', `${BASE}/images_staff/879/111217110686.jpg`],
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
      .upload(fileName, buf, { contentType: 'image/jpeg', upsert: true });
    if (error) { console.log(`\n  Storage: ${error.message}`); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (e) { console.log(`\n  fetch error: ${e.message}`); return null; }
}

const { data: shops } = await supabase.from('shops')
  .select('id, name')
  .ilike('website_url', '%tiger01-nagoya%');

if (!shops || shops.length === 0) {
  console.log('タイガーアイの店舗が見つかりません');
  process.exit(1);
}
console.log(`対象店舗: ${shops.map(s => s.id + ' ' + s.name).join(', ')}\n`);

if (DRY_RUN) {
  console.log(`【タイガーアイ】 ${TIGER_DATA.length}名`);
  TIGER_DATA.slice(0, 5).forEach(([n, u]) => console.log(`  ${n} → ${u.split('/').slice(-2).join('/')}`));
  process.exit(0);
}

let updated = 0, skipped = 0, notFound = 0, failed = 0;
const shopIds = shops.map(s => s.id);

for (const [name, imageUrl] of TIGER_DATA) {
  const { data: therapists } = await supabase.from('therapists')
    .select('id, shop_id, image_url')
    .in('shop_id', shopIds)
    .eq('name', name);

  if (!therapists || therapists.length === 0) {
    process.stdout.write('?'); notFound++; continue;
  }

  const nullOnes = therapists.filter(t => !t.image_url);
  if (nullOnes.length === 0) { process.stdout.write('='); skipped++; continue; }

  const parts = imageUrl.split('/');
  const staffId = parts[parts.length - 2];
  const ext = parts[parts.length - 1].split('.').pop();
  const fileName = `tiger_nagoya_${staffId}.${ext}`;
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
