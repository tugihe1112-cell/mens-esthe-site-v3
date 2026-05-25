/**
 * NO BRAND（ノーブランド）銀座発出張 セラピスト登録
 * パターン: /photos/{id}/moto_{id}.jpg + alt=名前（姓 or 名）
 * 実行: node scripts/maintenance/process_nobrand_ginza.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const BASE = 'https://aroma-nobrand.com';
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SHOP_ID = 'tokyo_chuo_ginza_nobrand';

if (DRY_RUN) console.log('[DRY RUN]\n');

// Chrome から取得した56名
const NOBRAND_DATA = [
  ['松浦', `${BASE}/photos/315/moto_315.jpg`],
  ['長谷川', `${BASE}/photos/314/moto_314.jpg`],
  ['姫宮', `${BASE}/photos/308/moto_308.jpg`],
  ['嶋田', `${BASE}/photos/305/moto_305.jpg`],
  ['原口', `${BASE}/photos/304/moto_304.jpg`],
  ['若林', `${BASE}/photos/300/moto_300.jpg`],
  ['森園', `${BASE}/photos/298/moto_298.jpg`],
  ['綾乃', `${BASE}/photos/16/moto_16.jpg`],
  ['白石', `${BASE}/photos/194/moto_194.jpg`],
  ['夢乃', `${BASE}/photos/261/moto_261.jpg`],
  ['有吉', `${BASE}/photos/12/moto_12.jpg`],
  ['中野', `${BASE}/photos/205/moto_205.jpg`],
  ['稲森', `${BASE}/photos/263/moto_263.jpg`],
  ['黒江', `${BASE}/photos/267/moto_267.jpg`],
  ['元木', `${BASE}/photos/182/moto_182.jpg`],
  ['野村', `${BASE}/photos/188/moto_188.jpg`],
  ['井口', `${BASE}/photos/31/moto_31.jpg`],
  ['九条', `${BASE}/photos/272/moto_272.jpg`],
  ['牧原', `${BASE}/photos/229/moto_229.jpg`],
  ['井川', `${BASE}/photos/180/moto_180.jpg`],
  ['横川', `${BASE}/photos/47/moto_47.jpg`],
  ['美里', `${BASE}/photos/228/moto_228.jpg`],
  ['天美', `${BASE}/photos/203/moto_203.jpg`],
  ['月島', `${BASE}/photos/313/moto_313.jpg`],
  ['中森', `${BASE}/photos/310/moto_310.jpg`],
  ['小日向', `${BASE}/photos/252/moto_252.jpg`],
  ['華苗', `${BASE}/photos/211/moto_211.jpg`],
  ['久保', `${BASE}/photos/255/moto_255.jpg`],
  ['中村', `${BASE}/photos/4/moto_4.jpg`],
  ['七瀬', `${BASE}/photos/306/moto_306.jpg`],
  ['和泉', `${BASE}/photos/269/moto_269.jpg`],
  ['立花', `${BASE}/photos/291/moto_291.jpg`],
  ['花園', `${BASE}/photos/281/moto_281.jpg`],
  ['鮎川', `${BASE}/photos/33/moto_33.jpg`],
  ['桜井', `${BASE}/photos/238/moto_238.jpg`],
  ['沖田', `${BASE}/photos/230/moto_230.jpg`],
  ['木南', `${BASE}/photos/265/moto_265.jpg`],
  ['天羽', `${BASE}/photos/262/moto_262.jpg`],
  ['長崎', `${BASE}/photos/256/moto_256.jpg`],
  ['桜木', `${BASE}/photos/251/moto_251.jpg`],
  ['初音', `${BASE}/photos/248/moto_248.jpg`],
  ['花山', `${BASE}/photos/246/moto_246.jpg`],
  ['渚', `${BASE}/photos/245/moto_245.jpg`],
  ['冨田', `${BASE}/photos/297/moto_297.jpg`],
  ['朝倉', `${BASE}/photos/243/moto_243.jpg`],
  ['秋山', `${BASE}/photos/242/moto_242.jpg`],
  ['美波', `${BASE}/photos/153/moto_153.jpg`],
  ['武藤', `${BASE}/photos/223/moto_223.jpg`],
  ['三枝', `${BASE}/photos/231/moto_231.jpg`],
  ['南原', `${BASE}/photos/239/moto_239.jpg`],
  ['倉橋', `${BASE}/photos/237/moto_237.jpg`],
  ['火野', `${BASE}/photos/192/moto_192.jpg`],
  ['千秋', `${BASE}/photos/60/moto_60.jpg`],
  ['藤ヶ谷', `${BASE}/photos/172/moto_172.jpg`],
  ['愛華', `${BASE}/photos/78/moto_78.jpg`],
  ['大門', `${BASE}/photos/240/moto_240.jpg`],
];

async function uploadImage(imageUrl, fileName) {
  try {
    const res = await fetch(imageUrl, {
      headers: { ...UA, Referer: BASE + '/' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { console.log(`\n  HTTP ${res.status}: ${imageUrl.slice(-40)}`); return null; }
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
  console.log(`【NO BRAND 銀座】 ${NOBRAND_DATA.length}名`);
  NOBRAND_DATA.slice(0, 8).forEach(([n, u]) => console.log(`  ${n} → ${u.slice(-40)}`));
  if (NOBRAND_DATA.length > 8) console.log(`  ... 他${NOBRAND_DATA.length - 8}名`);
  process.exit(0);
}

console.log(`\n=== ${SHOP_ID} (${NOBRAND_DATA.length}名) ===`);
let inserted = 0, skipped = 0, failed = 0;

for (const [name, imageUrl] of NOBRAND_DATA) {
  const id = `${SHOP_ID}_${name}`;
  const { data: existing } = await supabase.from('therapists').select('id').eq('id', id).single();
  if (existing) { process.stdout.write('='); skipped++; continue; }

  // /photos/{id}/moto_{id}.jpg → nobrand_{id}.jpg
  const photoId = imageUrl.match(/\/photos\/(\d+)\//)?.[1] || name;
  const fileName = `nobrand_${photoId}.jpg`;
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
