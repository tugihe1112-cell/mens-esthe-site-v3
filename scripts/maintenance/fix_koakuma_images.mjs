/**
 * 小悪魔Spa Tokyo セラピスト写真修正（Chrome DOM抽出データ使用）
 * S3: 3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/{uuid}.{ext}
 * 実行: node scripts/maintenance/fix_koakuma_images.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const BASE = 'https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

// Chrome DOM抽出データ（therapists.html から取得）[name, uuid.ext]
const KOAKUMA_DATA = [
  ['こい', '12ba9e77-6c5f-46ce-9c84-b3296e2256f3.jpeg'],
  ['うな', 'c32346e1-e150-42ff-a7a3-dbfe356fc6f4.jpeg'],
  ['みさき', 'c4ddcf22-9b58-4e02-a05e-2943e64c07bf.jpeg'],
  ['大谷みり', '6fd74d82-fc37-4283-8f2c-000a72bb83df.JPG'],
  ['める', 'bcea03e4-a7ed-4955-a924-21c925bf6545.jpeg'],
  ['あいか', 'df890c56-9dba-4223-a018-4fce3443308e.jpeg'],
  ['ゆめか', '91f1b395-0229-441c-a637-463f74d6cd0b.jpeg'],
  ['ゆの', '958be943-16a3-4038-ace9-285af69aa7e6.jpeg'],
  ['佐倉みづき', 'd564a7bd-d9cc-4891-b0a6-0b138ad70326.jpeg'],
  ['みあ', '7bf31673-8e01-4f10-9fb0-2ac77d697990.jpeg'],
  ['姫乃もえ', 'b932a77f-a92a-480c-b314-e060699fb52a.jpeg'],
  ['天使ひな', 'f9cfdbea-e952-4c2d-b336-3c01a6086e1b.jpeg'],
  ['大川恋華', '5b70e222-51d6-4dc8-a7db-7a024737df0e.jpeg'],
  ['帝玲葉', '0050704c-f8ac-4ea9-bce7-13eaebaa8f24.jpeg'],
  ['りこ', 'c200cb14-0e3c-460e-b2ea-f9bab347afab.jpeg'],
  ['みるく', '84f5e2a2-4d5a-44c9-9bc1-55b2e38d9e0a.jpeg'],
  ['ふう', '015a7f1e-a0ad-498d-9589-6b5ad53a4c59.jpeg'],
  ['真田さな', '283bf5ee-8bca-4b2c-aa13-df965815e0e0.jpg'],
  ['みゆ', '39fb546a-9b04-401a-96f0-eea34398ab56.jpeg'],
  ['藤咲りり', 'c7926cc3-4817-466e-8e7e-f7e4c3417ba5.jpeg'],
  ['さや', 'dc20a749-ddbe-45f3-8c7b-667b03dfa52f.jpeg'],
  ['えみる', 'f7941c28-423b-4170-b3af-dd9da72f777c.JPG'],
  ['かりん', '9fe295a7-2c9d-4f2c-a3f4-fa858182f6c2.jpeg'],
  ['みなみ', 'efcb67f0-bb13-409b-9a84-ba6a6a4958fe.jpeg'],
  ['ゆゆ', '4dc8a267-3fec-46f7-9813-14f0ce6d422f.jpeg'],
  ['ひめ', '161c83f3-2302-4672-81c9-620b07934ca2.JPG'],
  ['にこ', 'b0bc2ac4-3a21-42f2-bb5d-0a2b8c349e49.jpeg'],
  ['アリス', '274b811b-8631-4439-8ba6-44588734ac3a.jpeg'],
  ['白鳥さくら', 'd1a4395a-f14c-4ecb-896a-2dfed28224f1.jpeg'],
  ['ふりる', '286ae8d1-d477-411f-bfb3-f7d76c4c45d9.jpeg'],
  ['ゆりか', '74b06ab7-95cc-4fc1-8df3-b440fa6b3043.PNG'],
  ['まいか', '3e2e167c-fea3-4b07-a83c-e9cabc025e88.JPG'],
  ['るか', '8d409a57-edba-4da1-8883-c90350579213.JPG'],
  ['しおり', 'b64022bd-fc15-436d-aa4a-96945c698487.jpeg'],
  ['むい', '988232b5-0c56-4215-a5be-6a9c0e866a23.jpeg'],
  ['せあん', 'a4d8b927-acbb-4525-be56-76a4b79552fe.jpeg'],
  ['桜井みゆ', 'c10cdd2a-9ec0-455f-a4e3-cf92288596ec.jpg'],
  ['まむ', '649b5c1b-b103-4d7b-951c-7c5809c1f8b9.jpeg'],
  ['陽咲うい', '7509e31d-6a1b-4992-b3a7-89e3d1fd9378.jpeg'],
  ['せな', 'b1864820-7b17-4f8f-acf0-ee967f383e95.jpeg'],
  ['ゆずは', '56012814-b110-4969-b91a-ebbff25c9c6c.jpeg'],
  ['あおは', '8d749383-63bd-4b02-ba4e-8113c108a14a.JPG'],
  ['さろめ', 'f520da39-7b19-418d-a3a9-68c9675910aa.jpg'],
  ['あんじゅ', 'e43f8d91-ab7e-4e13-91ef-0b082c245396.jpeg'],
  ['えま', 'a0c3f3f2-2ad0-43f7-9ea3-2162b292b0a7.jpeg'],
  ['あずさ', 'b6de1d04-9fc4-4ddd-a65b-58b149cb87da.jpg'],
  ['れむ', 'bf4269e3-e93e-452d-b0e4-aa43524750fe.jpeg'],
  ['つばき', 'd076efef-796e-4e80-ac17-e1ca52bdbd7e.jpeg'],
  ['ねむ', '60f34753-3d5e-4ba6-975d-4cc6d968002d.jpeg'],
  ['まる', 'ffb5a783-1d17-4c81-812c-9f4fee1cf0b0.jpeg'],
  ['れいか', '40d60bd5-03a2-4530-97a7-34dda74b14a2.jpeg'],
  ['なこ', '378c3824-7b84-45a5-b76b-133d6467aac3.JPG'],
  ['ここあ', '54436511-adab-4e24-a807-9031fb2ff9db.jpeg'],
  ['あい', 'e7188781-1a21-4974-99bf-fde2763aef4d.jpeg'],
  ['さら', '1de6f447-4d90-42a5-afe1-669dc9adab14.JPG'],
  ['七瀬しおん', '2d0b858b-9973-4836-b099-c458b41fa51c.jpeg'],
  ['茜', '13d444d3-8fc0-4d35-9aee-39b7cc5742d0.jpeg'],
  ['なつめ', 'da2d6840-26f2-4820-b4f8-c0f23f67ff43.JPG'],
  ['百瀬もか', '8aace1b4-3791-4bca-b1d9-eeb9db2c8755.JPG'],
  ['れな', 'bd384feb-6117-4cec-87fb-e9fa1e6ff725.jpeg'],
  ['月乃るな', '259f7b95-3803-4991-919c-36d558bca155.jpeg'],
  ['れい', 'bd8fa27b-45f9-459b-b6b7-4b5f73214508.jpeg'],
  ['なごみ', '4f397c7f-5d69-4dcd-835b-f265dd2db366.jpeg'],
  ['のあ', '2caf4054-09ef-4a06-b6ef-933a74b4b853.JPG'],
  ['える', '29b108e7-52a4-4e7c-b13a-3893e5185415.jpeg'],
  ['水沢みずき', '9d0241be-de44-49fe-b644-ab5dbbba8061.jpg'],
  ['ティナ', '0dd9fa56-58ca-4b65-a605-eb5502e87239.JPG'],
  ['はる', 'f71c7e5a-ae10-4c9b-afc4-03bcf3c1f01c.png'],
  ['うさ', '45c33bd7-5680-4379-8d71-c8b23e22143f.jpeg'],
  ['えり', '78cff0e0-bc41-4344-b37f-99fcbe72af62.JPG'],
  ['真白みゆ', '87c699dd-95f3-4997-b55d-c40dce70dee7.jpg'],
  ['いろは', '746171a3-6901-4f1f-80cb-c2b0e4150b6a.jfif'],
  ['りず', '463052b7-8d9d-48f0-bd1c-97a0b829f9d1.jpg'],
  ['あめ', '90795286-8c43-4e2f-86a7-22d0e21ab39a.jpeg'],
  ['みれい', '735115c4-5685-44e1-a10b-7b82e2b46cb7.jpeg'],
  ['池田あい', '346062af-bffa-44ad-8fe9-61b16f022c2e.jpeg'],
  ['ゆめ', 'f0b6b999-d3a2-4743-bd21-9c933a509940.JPG'],
  ['四谷ふたば', 'a13c6151-89ff-4baa-96ed-480e47c9a550.jpeg'],
  ['櫻井もも', '87d4897b-cdfa-4e8e-84e2-6b5cd5ed4241.jfif'],
  ['西野りか', '6e7733e7-f2bc-4bad-99e7-327fef3dc07d.JPG'],
  ['海月もね', '1627fa89-f33e-4f4e-90f6-34e8b7326ade.jpeg'],
  ['雅芽衣', '6bedaa13-855c-47ea-88e0-1300483d827d.jpeg'],
  ['白鳥あいか', '17f54c87-e98e-4b4c-a480-4662e685af2b.jpg'],
  ['一ノ瀬まりん', '388af099-0b63-4a6c-b83f-165b74424c15.jpg'],
  ['ひかり', '0a8d19cc-93d3-48b7-8e93-c673080019c1.jpeg'],
  ['夕凪レイ', '8593b316-b2ac-48a0-bed1-66badd4e7a6f.jpeg'],
  ['天城りあん', 'b6835acf-0430-4637-ad35-0c72ac37f899.JPG'],
  ['渚るい', '9234e3a1-5d02-4be0-a186-aa3bc360c12a.jpeg'],
  ['白雲ふわり', 'fbb47bdd-3863-4834-862a-cd5ea7b6df6f.jpg'],
  ['みな', '79b64c44-c25b-4aac-8893-db30085f5c43.jfif'],
  ['来栖もな', 'b55eeb61-11fe-4871-bf49-fb477c4b25be.JPG'],
  ['那月れむ', '3c447165-c408-4e30-b3e2-08037e732b31.JPG'],
  ['平和あい', 'c5e635ca-64bd-450f-8ba4-9a732fc496fc.JPG'],
  ['日色りお', '0bbb4302-cb36-4e80-adc8-9cfb4da5618d.jpeg'],
  ['桃瀬ゆうり', '873ce4a6-4b4a-437d-b14d-144ec74e09b5.jfif'],
  ['一ノ瀬なな', 'dcef32c2-7c10-4935-bfa0-acf2c561588c.jpg'],
  ['ほの', '04398abc-2323-4551-bbb8-34db8551a6ec.png'],
  ['いのり', 'c2923185-1c30-4ae2-8d20-dd709e364589.JPG'],
  ['きらら', '533152a5-2b36-4f30-ba27-a4c995fe3b75.jpeg'],
  ['かんな', '95c1c7b3-a6a8-4fac-869a-94b46021a0b2.JPG'],
  ['ひなこ', 'ec8e0de2-a9ac-4c27-9efd-a0b61f4169f8.jpeg'],
  ['桃瀬つき', '0555daa7-dae7-4aba-a722-422ffac8bbbb.jpg'],
  ['はづき', '2b713508-744a-43c0-af1d-d6f50f4247aa.jpeg'],
  ['ひらり', 'ea092f30-5e16-4822-849b-eb55efee4fc7.jfif'],
  ['かな', '56f4010b-abdc-4df9-af55-dab5c0686736.jpeg'],
  ['舞香', '4834dd27-db04-4d33-b0e9-2e5f2c1d4efc.jpg'],
  ['こころ', '0c0ee5b4-2065-4858-88cd-39ffc25ee86e.jpeg'],
  ['あいす', 'c4c41d4e-a651-464a-b831-19c5aeb6f90b.jpeg'],
  ['なるせ', '1641a9a0-04c4-4eb4-b950-b37345916a0d.jpeg'],
  ['らい', 'c44f777f-5d1e-426c-846e-47265b790dd0.jpeg'],
  ['真波こころ', 'f9b209ed-4897-43bf-a20c-dc91a357c9b8.jpeg'],
  ['なえ', '39911698-e431-4206-b9af-39d4c3092b24.JPG'],
  ['さく', '4f3642cd-7260-4316-ae74-55df18a5b5bb.jpeg'],
  ['ここ', 'f49cad5d-7d35-47d4-9ad2-93eee94eedc6.jpeg'],
  ['せり', 'd9802052-0024-4a75-9940-f993d76c518a.jpeg'],
  ['みりさ', '2338d13d-78ce-487d-ba32-072f26542ee3.jpeg'],
  ['りお', '370c4c51-77fe-42e9-906a-ff7adf33031f.jpeg'],
  ['こと', 'ef4279b1-7fbd-4f8c-9f57-21c507220beb.jpeg'],
  ['さやか', 'faadcc50-255a-4776-a86d-3531eb91d4d9.jpeg'],
  ['みいな', 'cms-content/1028/img/みいな'], // placeholder - get below
  ['桃尻めろん', 'e5e785d8-6516-445d-97fa-63685f78238f.jpeg'],
  ['森まな', '3fae1a3d-ac09-4948-8e4e-e91270bc2f1c.jfif'],
  ['七海のあ', '554f87c1-7a79-4d92-ab7c-c7fd2b22367b.JPG'],
  ['ゆき', '1e3402b0-58e8-420e-bef9-db57abcc173c.jpg'],
].filter(([, f]) => !f.includes('placeholder'));

// URLを生成
const nameImageMap = new Map(
  KOAKUMA_DATA.map(([name, file]) => [name, `${BASE}/${file}`])
);
// スペース除去版も登録
for (const [name, url] of [...nameImageMap]) {
  const noSpace = name.replace(/[\s　]/g, '');
  if (noSpace !== name) nameImageMap.set(noSpace, url);
}

async function uploadImage(imageUrl, fileName) {
  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { process.stdout.write(`[${res.status}]`); return null; }
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const ext = ct.includes('png') ? 'png' : ct.includes('webp') ? 'webp' : 'jpg';
    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType: ct, upsert: true });
    if (error) { process.stdout.write(`[E:${error.message.slice(0,20)}]`); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (e) { process.stdout.write(`[ERR]`); return null; }
}

// DB取得
const { data: shops } = await supabase.from('shops').select('id, name').ilike('website_url', '%mens-esthe-aroma%');
if (!shops?.length) { console.log('店舗なし'); process.exit(1); }
console.log(`対象店舗: ${shops.map(s => s.name).join(', ')}`);
const shopIds = shops.map(s => s.id);

const { data: nullT } = await supabase.from('therapists')
  .select('id, name, shop_id, image_url')
  .in('shop_id', shopIds)
  .is('image_url', null);

console.log(`DB写真なし: ${nullT?.length ?? 0}名`);

function findMatch(dbName) {
  if (nameImageMap.has(dbName)) return nameImageMap.get(dbName);
  const noSpace = dbName.replace(/[\s　]/g, '');
  if (nameImageMap.has(noSpace)) return nameImageMap.get(noSpace);
  // 部分一致（suffix）
  for (const [siteName, url] of nameImageMap) {
    if (siteName.endsWith(noSpace) && noSpace.length >= 2) return url;
    if (noSpace.endsWith(siteName) && siteName.length >= 2) return url;
  }
  return null;
}

if (DRY_RUN) {
  console.log('\n[マッチング確認]');
  const matched = (nullT || []).filter(t => findMatch(t.name));
  const notFoundList = (nullT || []).filter(t => !findMatch(t.name));
  console.log(`マッチ: ${matched.length}名`);
  matched.forEach(t => console.log(`  ✅ "${t.name}"`));
  console.log(`未マッチ: ${notFoundList.length}名`);
  notFoundList.forEach(t => console.log(`  ❓ "${t.name}"`));
  process.exit(0);
}

// 更新
let updated = 0, notFound = 0, failed = 0;
const processedUrls = new Map();

for (const t of nullT || []) {
  const imageUrl = findMatch(t.name);
  if (!imageUrl) { process.stdout.write('?'); notFound++; continue; }

  let storageUrl;
  if (processedUrls.has(imageUrl)) {
    storageUrl = processedUrls.get(imageUrl);
  } else {
    const uuidMatch = imageUrl.match(/([a-f0-9-]{36})\.(\w+)$/i);
    const uuid = uuidMatch?.[1]?.replace(/-/g, '').slice(0, 24) || Date.now();
    const ext = uuidMatch?.[2]?.toLowerCase() || 'jpg';
    const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'jfif'].includes(ext) ? (ext === 'jfif' ? 'jpg' : ext === 'jpeg' ? 'jpg' : ext) : 'jpg';
    const fileName = `koakuma_${uuid}.${safeExt}`;
    storageUrl = await uploadImage(imageUrl, fileName);
    processedUrls.set(imageUrl, storageUrl);
    await sleep(150);
  }

  const { error } = await supabase.from('therapists')
    .update({ image_url: storageUrl ?? imageUrl })
    .eq('id', t.id);
  if (error) { console.log(`\n❌ ${t.name}: ${error.message}`); failed++; }
  else { process.stdout.write(storageUrl ? '+' : '.'); updated++; }
  await sleep(80);
}

console.log(`\n\n更新 ${updated}件 / 未マッチ ${notFound}件 / 失敗 ${failed}件`);
console.log('完了');
