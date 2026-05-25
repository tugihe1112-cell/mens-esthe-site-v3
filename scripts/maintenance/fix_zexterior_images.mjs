/**
 * Zexterior（新宿・秋葉原）セラピスト写真修正（全4店舗）
 * パターン: /images_staff/{id}/{file}.jpeg
 * 実行: node scripts/maintenance/fix_zexterior_images.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const BASE = 'https://zexterior-aroma.com';
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

const ZEXTERIOR_DATA = [
  ['瑞樹 なつ', `${BASE}/images_staff/151/08281936429.jpeg`],
  ['白雪 紗良', `${BASE}/images_staff/236/051020261345.jpeg`],
  ['神野 沙也加', `${BASE}/images_staff/181/100614410612.jpeg`],
  ['冴島 きょうか', `${BASE}/images_staff/214/090118370952.jpeg`],
  ['東条 百華', `${BASE}/images_staff/104/012716171685.jpeg`],
  ['千秋 世奈', `${BASE}/images_staff/197/101512152857.jpeg`],
  ['花里 のん', `${BASE}/images_staff/228/021620431716.jpeg`],
  ['輝夜 純連', `${BASE}/images_staff/107/092216140260.jpeg`],
  ['皐月 杏奈', `${BASE}/images_staff/207/091108035877.jpeg`],
  ['似鳥 芹香', `${BASE}/images_staff/187/022409540823.jpeg`],
  ['百瀬 柚奈', `${BASE}/images_staff/230/030317524058.jpeg`],
  ['社 しおり', `${BASE}/images_staff/232/032210181163.jpeg`],
  ['宮野 桃', `${BASE}/images_staff/118/022113470169.jpeg`],
  ['早乙女 夜狐', `${BASE}/images_staff/201/090112565024.jpeg`],
  ['森 星', `${BASE}/images_staff/234/041113290757.jpeg`],
  ['一条 カレン', `${BASE}/images_staff/203/033020395837.jpeg`],
  ['青山 桜', `${BASE}/images_staff/198/082909335065.jpeg`],
  ['天海 亜來', `${BASE}/images_staff/117/090712421980.jpeg`],
  ['咲良 ゆり', `${BASE}/images_staff/222/120318461956.jpeg`],
  ['香山 里香', `${BASE}/images_staff/173/09051325388.jpeg`],
  ['桃川 理亜', `${BASE}/images_staff/113/022114101060.jpeg`],
  ['花鳥 風月', `${BASE}/images_staff/235/050610343085.jpeg`],
  ['稲森 莉子', `${BASE}/images_staff/204/083021501490.jpeg`],
  ['桜井 梨花', `${BASE}/images_staff/112/090814132765.jpeg`],
  ['夏目 沙也加', `${BASE}/images_staff/150/120122483316.jpeg`],
  ['村岡 美咲', `${BASE}/images_staff/161/041709350125.jpeg`],
  ['神楽 梨緒', `${BASE}/images_staff/229/022513095884.jpeg`],
  ['楪 れい', `${BASE}/images_staff/178/083117303958.jpeg`],
  ['柏木 ひより', `${BASE}/images_staff/208/083016132232.jpeg`],
  ['神薙 雫', `${BASE}/images_staff/216/092106220178.jpeg`],
  ['姫乃 澪', `${BASE}/images_staff/143/092913100394.jpeg`],
  ['早川 ゆき', `${BASE}/images_staff/188/03171454577.jpeg`],
  ['桜河 恋春', `${BASE}/images_staff/227/041611553275.jpeg`],
  ['月詠 茉都香', `${BASE}/images_staff/179/091110252124.jpeg`],
  ['小川 菜々子', `${BASE}/images_staff/233/040313402284.jpeg`],
  ['河合 千鶴', `${BASE}/images_staff/190/091214570295.jpeg`],
  ['峰山 結衣', `${BASE}/images_staff/115/083020033538.jpeg`],
  ['七瀬 凛々', `${BASE}/images_staff/223/120914401762.jpeg`],
  ['波多野 莉奈', `${BASE}/images_staff/206/090111481931.jpeg`],
  ['橘 花奈', `${BASE}/images_staff/183/120611355281.jpeg`],
  ['高橋 真帆', `${BASE}/images_staff/226/020117182460.jpeg`],
  ['星崎 菜衣', `${BASE}/images_staff/174/100621593515.jpeg`],
  ['渚 弥生', `${BASE}/images_staff/144/112321114473.jpeg`],
  ['楠木 芽依', `${BASE}/images_staff/95/021514455312.jpeg`],
  ['長谷川 真央', `${BASE}/images_staff/192/013111573963.jpeg`],
  ['天使 姫華', `${BASE}/images_staff/196/11092337134.jpeg`],
  ['ひろか', `${BASE}/images_staff/180/050912384892.jpeg`],
  ['杉原 成美', `${BASE}/images_staff/136/092213140538.jpeg`],
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
  .ilike('website_url', '%zexterior%');

if (!shops || shops.length === 0) {
  console.log('Zexteriorの店舗が見つかりません');
  process.exit(1);
}
console.log(`対象店舗: ${shops.map(s => s.id + ' ' + s.name).join(', ')}\n`);

if (DRY_RUN) {
  console.log(`【Zexterior】 ${ZEXTERIOR_DATA.length}名`);
  ZEXTERIOR_DATA.slice(0, 5).forEach(([n, u]) => console.log(`  ${n} → ${u.split('/').slice(-2).join('/')}`));
  process.exit(0);
}

let updated = 0, skipped = 0, notFound = 0, failed = 0;
const shopIds = shops.map(s => s.id);

for (const [name, imageUrl] of ZEXTERIOR_DATA) {
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
  const fileId = parts[parts.length - 1].replace('.jpeg', '');
  const fileName = `zexterior_${staffId}_${fileId.substring(0, 15)}.jpg`;
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
