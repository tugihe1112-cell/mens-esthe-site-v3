/**
 * Aroma BANKER セラピスト写真登録
 * Chrome から取得した画像URLをSupabase Storageにアップロード
 * 実行: node scripts/maintenance/fix_banker_images.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const BASE = 'https://aroma-banker.com';
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

// shop_id を動的に取得
const { data: shops } = await supabase.from('shops').select('id, name')
  .or('name.ilike.%バンカー%,name.ilike.%BANKER%');
if (!shops?.length) { console.error('Aroma BANKERのshopが見つかりません'); process.exit(1); }
console.log('対象shop:', shops.map(s => `${s.id} (${s.name})`).join(', '));
const SHOP_IDS = shops.map(s => s.id);

// Chrome /therapist/ から取得した89名（ゴミ含む）
const BASE_IMG = BASE + '/images/therapist/';
const BANKER_DATA = [
  ['及川さき',     BASE_IMG+'1eea09203f1c84fd0353e89c1ebe191b.jpg'],
  ['戸川ありさ',   BASE_IMG+'2e27583991f739cceaa34ca9bd024e12.jpg'],
  ['京本めぐみ',   BASE_IMG+'e6229b63415b26b7cc7916e0f391998c.jpg'],
  ['汐見まさき',   BASE_IMG+'a94c65e432ae82cd094e98134c1194e4.jpg'],
  ['丹野あかね',   BASE_IMG+'5014c925035c6123b6197241f041ef5d.jpg'],
  ['草野りり',     BASE_IMG+'297b549cd258f6fc2c1f5e233ac36a7b.jpg'],
  ['折原まりか',   BASE_IMG+'7f18a1d59ab8433fcf939d14c616832e.jpg'],
  ['深田つばき',   BASE_IMG+'c3a179fe61aeef37d87e0d7466f5de7d.jpg'],
  ['蛯原ななみ',   BASE_IMG+'e64f6fa83cd4a6032c35bcf815c9590d.jpg'],
  ['恋川ひまわり', BASE_IMG+'c9cd5fd7b43781d46ed80ceea10832fd.jpg'],
  ['峰岸こあ',     BASE_IMG+'bf781bf684e3aceffeb4b70d326b5781.jpg'],
  ['永井みい',     BASE_IMG+'235385e4650b69f9d00b3b47d30e0c6a.png'],
  ['丸山いずみ',   BASE_IMG+'cde0f21fc60267a8fc9278edd86a695e.jpg'],
  ['赤森まこ',     BASE_IMG+'70c075a571d48d61fccd097fddd43f22.jpg'],
  ['渚(なぎさ)れん', BASE_IMG+'8e5fb698c3c28dcbe922556b3e718002.jpg'],
  ['尾崎みこ',     BASE_IMG+'8dc1198c54a1547f819972244aff4b39.jpg'],
  ['堂本まい',     BASE_IMG+'3d26d6423b3b094513d43bc3cc0b5972.jpg'],
  ['切島みほ',     BASE_IMG+'c9db9a931c4350dca84dba874a51c4bb.jpg'],
  ['初田ゆのか',   BASE_IMG+'fa90fb2c3523b6c51fcb918343c8ea80.jpg'],
  ['足立みずき',   BASE_IMG+'961c650d2a362a68cc339d335945556f.jpg'],
  ['椎名あすか',   BASE_IMG+'7df50fbb44a437efb539abadca540636.jpg'],
  ['相武まなみ',   BASE_IMG+'1029770a3744847a3771abea5e4ae095.jpg'],
  ['外田ゆい',     BASE_IMG+'55ec3b4542212af9041a0512d31e78fd.jpg'],
  ['海野あきな',   BASE_IMG+'ccc6ac199e43770305811015f171afe1.jpg'],
  ['岩崎ゆり',     BASE_IMG+'43c3d790161b40054b90e727a99ab968.jpg'],
  ['八木まみ',     BASE_IMG+'59d897bd041dfeed2cfecc3c1ae617c7.jpg'],
  ['叶ひとみ',     BASE_IMG+'3011cbb194a09cbc68b90158ef4c8258.jpg'],
  ['来夢みどり',   BASE_IMG+'8c54ef122c5328b7b3d0cc354668d409.jpg'],
  ['波崎うみ',     BASE_IMG+'8532fc8f5922f0686fac9a25905d84d7.jpg'],
  ['指原はな',     BASE_IMG+'a7ac505e069a22ead52e990e62c7a90f.jpg'],
  ['岸ゆかり',     BASE_IMG+'8f10b4beea0ddb28fa616d0452e51902.jpg'],
  ['乙原みな',     BASE_IMG+'cb89b763c8c492555a4d18eaaa33e2ed.jpg'],
  ['不破みか',     BASE_IMG+'c1fca5e93821e1f3f66319d0428c5831.jpg'],
  ['市川かれん',   BASE_IMG+'45a5ca02b4c486e34deb079958f6a97e.jpg'],
  ['冴木すず',     BASE_IMG+'524ef1acf02e23cd480f207251d09c73.jpg'],
  ['夕美しおり',   BASE_IMG+'f096b77ae0600508351fc6790b790f04.jpg'],
  ['瀧口みおり',   BASE_IMG+'e51820630efced81d8c63b7b977b6972.jpg'],
  ['金子みいな',   BASE_IMG+'abdc3cbc245f2ab2dee5f07cdc7c0828.jpg'],
  ['平野まれ',     BASE_IMG+'704e066d2ccd3c5f42a91b61e1c85ac1.jpg'],
  ['桐生かおる',   BASE_IMG+'acc4aac26afb2e291083406fc894a8fa.jpg'],
  ['住田けい',     BASE_IMG+'375c452dcc5ca19144d1450270fb9d02.jpg'],
  ['鶴森あき',     BASE_IMG+'5f8a9c5b0be24e98e5763fc7bd034a94.jpg'],
  ['柚木かんな',   BASE_IMG+'fe24644940958a94756d4a485b472133.jpg'],
  ['藤崎まなみ',   BASE_IMG+'5db644dbbe24360ceae84ab0ad2e0504.jpg'],
  ['南ゆりこ',     BASE_IMG+'4a623ce176619d08e3955be000cdb0d8.jpg'],
  ['森下わか',     BASE_IMG+'8548573de807c6fce19e127cd52c2b5d.jpg'],
  ['凛堂さくら',   BASE_IMG+'2048805c6acba5a42b7d518e5a3f5db6.jpg'],
  ['手嶋いずみ',   BASE_IMG+'0fca255bf15a3a45fe8ffd772aa9410b.jpg'],
  ['君島れいか',   BASE_IMG+'4df4bb1d98983a39bfdc563ef573221a.jpg'],
  ['藍みゆ',       BASE_IMG+'5931d5fcf2801421cf9e7b305b64d106.jpg'],
  ['増田まゆ',     BASE_IMG+'847eadbf4afd52a9db47e76b9f6c5453.jpg'],
  ['杉咲すず',     BASE_IMG+'d45411c6e849df724f6a34c3d30142ff.jpg'],
  ['並木かすみ',   BASE_IMG+'a48351860d4701530e6c65e1a97ddbf7.jpg'],
  ['夢野ななみ',   BASE_IMG+'404b4774326e48e88955d297837a7bfa.jpg'],
  ['酒井みき',     BASE_IMG+'17f1657ba3fc2131a1a72b8cfc6c5932.jpg'],
  ['桶谷せり',     BASE_IMG+'f26ae4808b7c66f1cc1b88ef5bf73d29.jpg'],
  ['谷口しずか',   BASE_IMG+'a669fcfc869eb9028b59edf5f36ab913.jpg'],
  ['滝川さとみ',   BASE_IMG+'b669a8997f69d38d9060f9a390941912.jpg'],
  ['武内れおな',   BASE_IMG+'07d52378aad26b1da9715d919b5715f2.jpg'],
  ['津川ねね',     BASE_IMG+'6fa7ee205f2dbcfa05388b96a9f25902.jpg'],
  ['安岡ひかる',   BASE_IMG+'449bd269ea01e4db89a7082a670444a6.jpg'],
  ['朝比奈あん',   BASE_IMG+'eb90e93c3a6f60c7188b23d77d1957d7.jpg'],
  ['畠山みか',     BASE_IMG+'820fc87fa52f73484bdd292c03ff8574.jpg'],
  ['一ノ瀬るか',   BASE_IMG+'68e8d9f5db2fb45e6a4c4bb0e533562a.jpg'],
  ['柏木みれい',   BASE_IMG+'c1ad66ec7ced80c74b7138c6a0a367ce.jpg'],
  ['牧野まき',     BASE_IMG+'8a8ab5af060e9d63007f3d4556a1294a.jpg'],
  ['冬木ゆき',     BASE_IMG+'6fc17371165ceb52473929ceb68b0980.jpg'],
  ['影山まゆか',   BASE_IMG+'c793722b266d830b3304ba7d9b52c411.jpg'],
  ['白鳥ななせ',   BASE_IMG+'be932d0436562f1db9086285490419c9.jpg'],
  ['三井みお',     BASE_IMG+'2849f9d17ea406cec6c6bc8a720c8944.jpg'],
  ['沢口さわ',     BASE_IMG+'3689a7d812c769e5437ecf940b830c52.jpg'],
  ['宮崎りょう',   BASE_IMG+'e6fe3f86f2fe76de1ea3c16bcf1b647c.jpg'],
  ['真田しずく',   BASE_IMG+'2331740c64388d8c931c5024e5552752.jpg'],
  ['葉月らき',     BASE_IMG+'d49f36661d7a1efe811f6d0bf54b8f35.png'],
  ['天音いろ',     BASE_IMG+'c3aa9bde4d6fe5193267e80c5913d17d.jpg'],
  ['松坂りあ',     BASE_IMG+'8deb453ef0c7ec8f9a3f6fe381255bc2.jpg'],
  ['瀬川ゆら',     BASE_IMG+'d8bbe5d63a9849e9cb9ee4e08fb4697f.jpg'],
  ['堤ゆり',       BASE_IMG+'d8d6ea476f5a43dc82b793ab06a470a2.jpg'],
  ['吉川ゆい',     BASE_IMG+'b68aebb535391352eb54cd8857fa6603.jpg'],
];

async function uploadImage(imageUrl, fileName) {
  try {
    const ext = imageUrl.endsWith('.png') ? 'png' : 'jpg';
    const res = await fetch(imageUrl, {
      headers: { ...UA, Referer: BASE + '/' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { console.log(`\n  HTTP ${res.status}: ${imageUrl}`); return null; }
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`, upsert: true });
    if (error) { console.log(`\n  Storage: ${error.message}`); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (e) { console.log(`\n  fetch error: ${e.message}`); return null; }
}

console.log(`\n${BANKER_DATA.length}名処理開始...\n`);
let uploaded = 0, updated = 0, skipped = 0, notFound = 0;

for (const [name, imageUrl] of BANKER_DATA) {
  if (DRY_RUN) {
    console.log(`  ${name} → ${imageUrl.split('/').pop()}`);
    continue;
  }

  const fileBase = imageUrl.split('/').pop();
  const storageUrl = await uploadImage(imageUrl, `banker_${fileBase}`);
  await sleep(80);

  if (!storageUrl) { process.stdout.write('!'); skipped++; continue; }
  uploaded++;

  let anyUpdated = false;
  for (const shopId of SHOP_IDS) {
    const id = `${shopId}_${name}`;
    const { data: existing } = await supabase.from('therapists')
      .select('id, image_url').eq('id', id).single();
    if (!existing) { notFound++; continue; }
    if (existing.image_url) { process.stdout.write('='); continue; }

    const { error } = await supabase.from('therapists')
      .update({ image_url: storageUrl }).eq('id', id);
    if (!error) { updated++; anyUpdated = true; }
  }
  if (anyUpdated) process.stdout.write('+');
  await sleep(60);
}

if (!DRY_RUN) {
  console.log(`\n\nStorage アップロード: ${uploaded}名`);
  console.log(`DB 更新: ${updated}件`);
  console.log(`失敗: ${skipped}名`);
  if (notFound > 0) console.log(`DB に存在しない: ${notFound}件（サイト更新等による差分）`);
}
console.log('\n完了');
