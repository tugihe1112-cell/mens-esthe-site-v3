/**
 * うさぎのお部屋 セラピスト写真修正（全7エリア）
 * パターン: bunny-room.com/images_staff/{id}/{file}.jpg
 * 実行: node scripts/maintenance/fix_bunny_room_images.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const BASE = 'https://bunny-room.com';
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

const BUNNY_DATA = [
  ['西宮ゆめ', `${BASE}/images_staff/245/041101301566.jpg`],
  ['色葉みさ', `${BASE}/images_staff/476/041101311971.jpg`],
  ['小羽もも', `${BASE}/images_staff/587/041101323569.jpg`],
  ['鈴村あいり', `${BASE}/images_staff/191/041109251118.jpg`],
  ['音ノ瀬ゆい', `${BASE}/images_staff/427/041109174248.jpg`],
  ['白銀あい', `${BASE}/images_staff/623/041321243366.jpg`],
  ['宮脇かれん', `${BASE}/images_staff/468/041109120299.jpg`],
  ['桜あおい', `${BASE}/images_staff/267/041109283687.jpg`],
  ['神楽りり', `${BASE}/images_staff/524/041109103082.jpg`],
  ['櫻井あゆ', `${BASE}/images_staff/221/041109310874.jpg`],
  ['恋葉うらら', `${BASE}/images_staff/596/041109145761.jpg`],
  ['滝沢はな', `${BASE}/images_staff/566/041109314156.jpg`],
  ['るる', `${BASE}/images_staff/541/041108172637.jpg`],
  ['星宮いちか', `${BASE}/images_staff/655/042014104083.jpg`],
  ['宮月さな', `${BASE}/images_staff/653/041621473765.jpg`],
  ['吉沢ましろ', `${BASE}/images_staff/647/042019274551.jpeg`],
  ['西野らん', `${BASE}/images_staff/485/041109211638.jpg`],
  ['井ノ上たきな', `${BASE}/images_staff/335/041109352753.jpg`],
  ['月乃みる', `${BASE}/images_staff/222/041109360433.jpg`],
  ['春しおん', `${BASE}/images_staff/642/05012250486.jpg`],
  ['桜木あお', `${BASE}/images_staff/620/041109221785.jpg`],
  ['有村りか', `${BASE}/images_staff/644/041101173858.jpg`],
  ['深川なこ', `${BASE}/images_staff/640/042019283711.jpeg`],
  ['西園寺あずさ', `${BASE}/images_staff/657/042417195651.jpg`],
  ['柏木サラ', `${BASE}/images_staff/660/042723195258.jpg`],
  ['清野はる', `${BASE}/images_staff/639/042016321245.jpg`],
  ['芹沢のあ', `${BASE}/images_staff/602/041109334076.jpg`],
  ['星乃おと', `${BASE}/images_staff/632/042223501099.jpg`],
  ['朝比奈るい', `${BASE}/images_staff/650/041320500581.jpg`],
  ['片桐ゆうか', `${BASE}/images_staff/646/041109281171.jpg`],
  ['乙葉くるみ', `${BASE}/images_staff/560/042112544418.jpg`],
  ['小紫のの', `${BASE}/images_staff/454/041112202127.jpg`],
  ['立華きき', `${BASE}/images_staff/598/042014510120.jpg`],
  ['綾瀬りさ', `${BASE}/images_staff/570/041112001790.jpg`],
  ['椎名なつき', `${BASE}/images_staff/630/041109204257.jpg`],
  ['みれい', `${BASE}/images_staff/622/041112362199.jpg`],
  ['美波かのん', `${BASE}/images_staff/374/041112165626.jpg`],
  ['柚瀬みこと', `${BASE}/images_staff/350/041112140192.jpg`],
  ['望月りあ', `${BASE}/images_staff/574/041111584170.jpg`],
  ['七海かりん', `${BASE}/images_staff/616/041112272180.jpg`],
  ['仁兎まう', `${BASE}/images_staff/556/041112005428.jpg`],
  ['来栖ティナ', `${BASE}/images_staff/611/041112274479.jpg`],
  ['皐月うた', `${BASE}/images_staff/559/04111200339.jpg`],
  ['花火せいな', `${BASE}/images_staff/635/041112305160.jpg`],
  ['観月ふわ', `${BASE}/images_staff/654/041815265285.jpg`],
  ['三上えりか', `${BASE}/images_staff/645/041101151668.jpg`],
  ['結城さら', `${BASE}/images_staff/648/041101022892.jpg`],
  ['春野わかな', `${BASE}/images_staff/638/04110129059.jpg`],
  ['姫野カヤ', `${BASE}/images_staff/626/041108154926.jpg`],
  ['美月のどか', `${BASE}/images_staff/605/041112302022.jpg`],
  ['南雲のえる', `${BASE}/images_staff/597/041111592620.jpg`],
  ['兎田ももな', `${BASE}/images_staff/610/041112275892.jpg`],
  ['河北せな', `${BASE}/images_staff/604/041112303633.jpg`],
  ['桜庭もね', `${BASE}/images_staff/593/041112253985.jpg`],
  ['のん', `${BASE}/images_staff/573/041112243387.jpg`],
  ['蒼井るな', `${BASE}/images_staff/585/041108165993.jpg`],
  ['北川みかな', `${BASE}/images_staff/520/041109161881.jpg`],
  ['四葉まゆ', `${BASE}/images_staff/481/041112200138.jpg`],
  ['乾ほのか', `${BASE}/images_staff/509/041112231633.jpg`],
  ['西園寺こころ', `${BASE}/images_staff/588/041112265380.jpg`],
  ['羽宮あお', `${BASE}/images_staff/487/041112184796.jpg`],
  ['岡咲せりな', `${BASE}/images_staff/438/041112143163.jpg`],
  ['星野みらん', `${BASE}/images_staff/533/041112213231.jpg`],
  ['影宮芹', `${BASE}/images_staff/565/041112251192.jpg`],
  ['籠乃めあ', `${BASE}/images_staff/621/041112311517.jpg`],
  ['メアリ', `${BASE}/images_staff/432/041112162143.jpg`],
  ['朝比奈あみ', `${BASE}/images_staff/589/041112262468.jpg`],
  ['夜空ゆのん', `${BASE}/images_staff/516/041112224938.jpg`],
  ['篠崎きらら', `${BASE}/images_staff/569/041112244926.jpg`],
  ['牧野のぞみ', `${BASE}/images_staff/470/041109163811.jpg`],
  ['夢咲なゆ', `${BASE}/images_staff/484/041112193970.jpg`],
  ['宇佐美みるく', `${BASE}/images_staff/489/041112175477.jpg`],
  ['城乃ヒカリ', `${BASE}/images_staff/508/041112234582.jpg`],
  ['佐藤さくら', `${BASE}/images_staff/501/041112240840.jpg`],
  ['星咲うい', `${BASE}/images_staff/492/041112173016.jpg`],
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

const { data: shops } = await supabase.from('shops').select('id, name').ilike('website_url', '%bunny-room%');
if (!shops || shops.length === 0) { console.log('うさぎのお部屋の店舗が見つかりません'); process.exit(1); }
console.log(`対象店舗(${shops.length}店): ${shops.map(s => s.name).join(', ')}\n`);

if (DRY_RUN) {
  BUNNY_DATA.slice(0, 5).forEach(([n, u]) => console.log(`  ${n} → ${u.split('/').slice(-2).join('/')}`));
  process.exit(0);
}

let updated = 0, skipped = 0, notFound = 0, failed = 0;
const shopIds = shops.map(s => s.id);

for (const [name, imageUrl] of BUNNY_DATA) {
  const { data: therapists } = await supabase.from('therapists').select('id, shop_id, image_url').in('shop_id', shopIds).eq('name', name);
  if (!therapists || therapists.length === 0) { process.stdout.write('?'); notFound++; continue; }
  const nullOnes = therapists.filter(t => !t.image_url);
  if (nullOnes.length === 0) { process.stdout.write('='); skipped++; continue; }
  const parts = imageUrl.split('/');
  const staffId = parts[parts.length - 2];
  const ext = parts[parts.length - 1].split('.').pop();
  const fileName = `bunny_room_${staffId}.${ext}`;
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
