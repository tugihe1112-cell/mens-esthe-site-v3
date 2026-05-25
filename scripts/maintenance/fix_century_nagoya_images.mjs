/**
 * Century（センチュリー）名古屋 セラピスト写真修正
 * パターン: century-nagoya.com/images_staff/{id}/{file}.jpeg
 * 実行: node scripts/maintenance/fix_century_nagoya_images.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const BASE = 'https://century-nagoya.com';
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

// 名前から「※新人割対象‼」などのサフィックスを除去
const cleanName = (n) => n.replace(/\s*[※＊].*/g, '').replace(/\s*\*.*/, '').trim();

// ノイズ名除外
const isNoise = (n) => n.includes('フェザータッチ') || n.length > 10;

const CENTURY_RAW = [
  ['杉本くれは', `${BASE}/images_staff/694/032209514569.jpg`],
  ['朝宮ちあ', `${BASE}/images_staff/758/122301070627.jpg`],
  ['まいか', `${BASE}/images_staff/1020/030623122684.jpeg`],
  ['工藤りの', `${BASE}/images_staff/632/032118523731.jpg`],
  ['雛森あすか', `${BASE}/images_staff/962/032221093578.jpeg`],
  ['近藤とあ', `${BASE}/images_staff/606/012218014590.jpeg`],
  ['愛沢うめ', `${BASE}/images_staff/673/032414503828.jpeg`],
  ['板倉もあ', `${BASE}/images_staff/558/032118523112.jpg`],
  ['森田みあ', `${BASE}/images_staff/206/120516145684.jpeg`],
  ['加賀ゆい', `${BASE}/images_staff/1002/012114254080.jpg`],
  ['如月るい', `${BASE}/images_staff/939/03242320247.jpeg`],
  ['水瀬らい', `${BASE}/images_staff/1018/031915251771.jpeg`],
  ['フェザータッチみすずマン', `${BASE}/images_staff/479/100820123437.jpeg`], // ノイズ
  ['新井さら', `${BASE}/images_staff/915/052522001140.jpeg`],
  ['神崎もね', `${BASE}/images_staff/907/11292005208.jpeg`],
  ['流川るこ', `${BASE}/images_staff/1016/030915111065.jpeg`],
  ['出雲るり', `${BASE}/images_staff/736/032118535125.jpg`],
  ['五十嵐みり', `${BASE}/images_staff/979/042822371819.jpeg`],
  ['白石えりな', `${BASE}/images_staff/1026/040319272051.jpeg`],
  ['星ほのか', `${BASE}/images_staff/586/032118584737.jpg`],
  ['三浦ももか', `${BASE}/images_staff/290/051316585098.jpeg`],
  ['麦乃はる', `${BASE}/images_staff/1022/031903582071.jpg`],
  ['園田まお', `${BASE}/images_staff/987/050215180244.jpeg`],
  ['黒川あいな', `${BASE}/images_staff/780/070501061191.jpeg`],
  ['さくら', `${BASE}/images_staff/933/041613135762.jpeg`],
  ['るる※新人割対象‼', `${BASE}/images_staff/1037/050919210534.jpeg`],
  ['さゆみ※新人割対象‼', `${BASE}/images_staff/1035/050413335931.jpeg`],
  ['恋水ここあ', `${BASE}/images_staff/980/041019051023.jpeg`],
  ['蒼井みれい', `${BASE}/images_staff/992/041002124950.jpeg`],
  ['月城せりな', `${BASE}/images_staff/997/012118410185.jpg`],
  ['東条あずさ', `${BASE}/images_staff/115/032118514789.jpg`],
  ['赤池りお', `${BASE}/images_staff/756/082301125022.jpeg`],
  ['ねいろ※新人割対象‼︎', `${BASE}/images_staff/1033/050216082552.jpeg`],
  ['若葉つむぎ※新人割対象!!', `${BASE}/images_staff/1034/050213313155.jpeg`],
  ['桜庭みゆう', `${BASE}/images_staff/967/112013582576.jpeg`],
  ['安田ゆうこ', `${BASE}/images_staff/281/032118582825.jpg`],
  ['神谷れいな', `${BASE}/images_staff/441/032118550692.jpg`],
  ['黒木もえ', `${BASE}/images_staff/54/03211853333.jpg`],
  ['草野おかゆ※新人割対象‼', `${BASE}/images_staff/1029/041320010623.jpeg`],
  ['天音くるみ', `${BASE}/images_staff/680/032118534481.jpg`],
  ['ここな', `${BASE}/images_staff/1024/03232105027.jpeg`],
  ['森川りな', `${BASE}/images_staff/988/122012143987.jpeg`],
  ['神田みるあ', `${BASE}/images_staff/999/011815063396.jpeg`],
  ['音坂ほたる', `${BASE}/images_staff/331/032118595865.jpg`],
  ['千早えみ', `${BASE}/images_staff/965/101715505824.jpeg`],
  ['白瀬みる', `${BASE}/images_staff/1005/032220580663.jpeg`],
  ['比嘉ゆりあ', `${BASE}/images_staff/1001/022719391781.jpeg`],
  ['滝本あいり', `${BASE}/images_staff/803/02231511092.jpeg`],
  ['星月ねね', `${BASE}/images_staff/1000/012101241785.jpg`],
  ['ひまり※新人割対象‼︎', `${BASE}/images_staff/1031/041912394965.jpeg`],
  ['緑ふうか', `${BASE}/images_staff/968/102310285518.jpeg`],
  ['中西あんり', `${BASE}/images_staff/1011/040217515949.jpg`],
  ['筒井なお', `${BASE}/images_staff/291/032213220335.jpeg`],
  ['月宮すずか', `${BASE}/images_staff/969/122018240462.jpeg`],
  ['寺島なえ', `${BASE}/images_staff/964/101513154667.jpeg`],
  ['竹野あこ', `${BASE}/images_staff/925/110412235345.jpeg`],
  ['華瀬せいか', `${BASE}/images_staff/1009/021713262637.jpeg`],
  ['霜月はな', `${BASE}/images_staff/934/070223090943.jpeg`],
  ['るか', `${BASE}/images_staff/1004/020814351594.jpeg`],
  ['めぐみ', `${BASE}/images_staff/1023/032212011940.jpeg`],
  ['最上くれあ', `${BASE}/images_staff/447/110801451281.jpeg`],
  ['藤咲あやか', `${BASE}/images_staff/80/032118585225.jpg`],
  ['皆木れいか', `${BASE}/images_staff/415/062700060811.jpeg`],
  ['津田かな', `${BASE}/images_staff/991/122321113737.jpeg`],
  ['まい', `${BASE}/images_staff/989/121917390984.jpeg`],
  ['伊吹せな', `${BASE}/images_staff/323/032118592979.jpg`],
  ['平松しづね', `${BASE}/images_staff/943/080918231385.jpeg`],
  ['水樹しゅか', `${BASE}/images_staff/949/090116382824.jpeg`],
  ['七瀬つばき', `${BASE}/images_staff/926/062114560492.jpeg`],
  ['初音るな', `${BASE}/images_staff/910/051407065179.jpeg`],
  ['ゆり', `${BASE}/images_staff/954/091215002728.jpeg`],
  ['式波れお', `${BASE}/images_staff/890/060523352888.jpeg`],
  ['百瀬かよ', `${BASE}/images_staff/909/101519330338.jpeg`],
  ['宇佐美まみ', `${BASE}/images_staff/761/03211856157.jpg`],
  ['柚川むぎ', `${BASE}/images_staff/963/100913112310.jpeg`],
  ['木葉めい', `${BASE}/images_staff/960/092505352548.jpeg`],
  ['山下いちか', `${BASE}/images_staff/126/122818523078.jpeg`],
  ['みおな', `${BASE}/images_staff/985/12042055106.jpeg`],
  ['ゆら', `${BASE}/images_staff/1027/050404564182.jpeg`],
  ['あんな', `${BASE}/images_staff/983/112921262657.jpg`],
  ['れな', `${BASE}/images_staff/972/112521440111.jpeg`],
  ['中山ちなつ', `${BASE}/images_staff/688/082117331958.jpeg`],
  ['にいな', `${BASE}/images_staff/913/052018161489.jpeg`],
  ['林らな', `${BASE}/images_staff/515/011818395628.jpeg`],
  ['有村わかば', `${BASE}/images_staff/779/032118575389.jpg`],
  ['水嶋あげは', `${BASE}/images_staff/902/061215483033.jpeg`],
  ['一ノ瀬ゆう', `${BASE}/images_staff/617/032418074316.jpeg`],
  ['有栖ねむ', `${BASE}/images_staff/706/032118561228.jpg`],
  ['月乃かんな', `${BASE}/images_staff/789/041220134096.jpeg`],
  ['成宮ゆん', `${BASE}/images_staff/884/032315184150.jpeg`],
  ['夜桜かほ', `${BASE}/images_staff/820/032118012748.jpeg`],
  ['高梨ななみ', `${BASE}/images_staff/75/032118575647.jpg`],
  ['白川しお', `${BASE}/images_staff/769/120319004156.jpg`],
  ['月嶋うた', `${BASE}/images_staff/695/032118560889.jpg`],
  ['有馬かな', `${BASE}/images_staff/791/032119010953.jpg`],
  ['猫宮りんな', `${BASE}/images_staff/591/032118581764.jpg`],
  ['桃香りさ', `${BASE}/images_staff/392/03211852218.jpg`],
  ['長谷川まいこ', `${BASE}/images_staff/618/032118593513.jpg`],
  ['佐倉おと', `${BASE}/images_staff/751/022418503547.jpeg`],
];

// ノイズ除去・名前クリーニング後のデータ
const CENTURY_DATA = CENTURY_RAW
  .map(([n, u]) => [cleanName(n), u])
  .filter(([n]) => !isNoise(n));

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
  .ilike('website_url', '%century-nagoya%');

if (!shops || shops.length === 0) {
  console.log('Centuryの店舗が見つかりません');
  process.exit(1);
}
console.log(`対象店舗: ${shops.map(s => s.id + ' ' + s.name).join(', ')}\n`);

if (DRY_RUN) {
  console.log(`【Century】 ${CENTURY_DATA.length}名`);
  CENTURY_DATA.slice(0, 5).forEach(([n, u]) => console.log(`  ${n} → ${u.split('/').slice(-2).join('/')}`));
  process.exit(0);
}

let updated = 0, skipped = 0, notFound = 0, failed = 0;
const shopIds = shops.map(s => s.id);

for (const [name, imageUrl] of CENTURY_DATA) {
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
  const fileName = `century_nagoya_${staffId}.${ext}`;
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
