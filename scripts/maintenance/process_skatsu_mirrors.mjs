/**
 * S活・mirrors spa — 渋谷 shop & therapist 登録スクリプト
 * Chrome DOM抽出データをハードコード済み
 *
 * 実行:
 *   node scripts/maintenance/process_skatsu_mirrors.mjs --dry-run
 *   node scripts/maintenance/process_skatsu_mirrors.mjs
 *   node scripts/maintenance/process_skatsu_mirrors.mjs --shop skatsu
 *   node scripts/maintenance/process_skatsu_mirrors.mjs --shop mirrors
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const DRY_RUN = process.argv.includes('--dry-run');
const shopArg = (() => { const i = process.argv.indexOf('--shop'); return i >= 0 ? process.argv[i+1] : null; })();

// ===== S活 =====
const SKATSU_SHOP = {
  id: 'tokyo_shibuya_shibuya_skatsu',
  name: 'S活 (エスかつ)',
  website_url: 'https://www.xn--s-vp9b.com/',
  schedule_url: 'https://www.xn--s-vp9b.com/schedule/',
  image_url: null,
  raw_data: { prefecture: '東京都', area: '渋谷' },
};

// Chrome /cast/ ページから取得（52名、末尾のコース案内ノイズを除く）
const SKATSU_THERAPISTS = [
  { name: '佐々木みく', imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_1313.jpg' },
  { name: '倉科あおい', imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_1301.jpg' },
  { name: '柚木えま',   imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_1226.jpg' },
  { name: '山岸まほ',   imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_1234.jpg' },
  { name: '佐藤ゆずは', imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_1253.jpg' },
  { name: '有村ゆあ',   imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_1053.jpg' },
  { name: '七崎あいか', imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_1002.jpg' },
  { name: '吉沢ゆら',   imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_1278.jpg' },
  { name: '皆川はづき', imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_1281.jpg' },
  { name: '橘せり',     imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_1119.jpg' },
  { name: '天川もえ',   imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_510.jpg' },
  { name: '広瀬じゅり', imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_1084.jpg' },
  { name: '平井いちか', imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_1148.jpg' },
  { name: '日向まなみ', imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_1129.jpg' },
  { name: '藤井りおな', imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_801.jpg' },
  { name: '白石かのん', imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_1016.jpg' },
  { name: '岡部りの',   imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_1054.jpg' },
  { name: '森下すず',   imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_998.jpg' },
  { name: '来栖さら',   imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_944.jpg' },
  { name: '間宮りほ',   imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_833.jpg' },
  { name: '松風るな',   imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_382.jpg' },
  { name: '新木さくら', imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_703.jpg' },
  { name: '姫野なつき', imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_446.jpg' },
  { name: '椎名かすみ', imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_290.jpg' },
  { name: '大園めぐみ', imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_701.jpg' },
  { name: '西山りえ',   imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_448.jpg' },
  { name: '御神本りょう', imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_782.jpg' },
  { name: '松井なほ',   imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_487.jpg' },
  { name: '百瀬ありな', imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_467.jpg' },
  { name: '葉山ゆな',   imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_507.jpg' },
  { name: '茜さやか',   imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_742.jpg' },
  { name: '鈴森えなこ', imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_791.jpg' },
  { name: '新島こはる', imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_344.jpg' },
  { name: '星宮あん',   imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_249.jpg' },
  { name: '道明りな',   imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_396.jpg' },
  { name: '神崎みお',   imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_928.jpg' },
  { name: '結城かれん', imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_843.jpg' },
  { name: '南ひなこ',   imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_237.jpg' },
  { name: '東雲ゆりか', imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_308.jpg' },
  { name: '中川えり',   imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_932.jpg' },
  { name: '流川えみり', imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_228.jpg' },
  { name: '真野ふみか', imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_658.jpg' },
  { name: '蓮見れな',   imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_234.jpg' },
  { name: '天海つばさ', imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_239.jpg' },
  { name: '水川せな',   imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_414.jpg' },
  { name: '白咲めいさ', imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_490.jpg' },
  { name: '橋本あや',   imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_465.jpg' },
  { name: '川村ののか', imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_439.jpg' },
  { name: '一条みつき', imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_644.jpg' },
  { name: '田中なな',   imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_438.jpg' },
  { name: '満島りか',   imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_420.jpg' },
  { name: '一ノ瀬さな', imgUrl: 'https://www.xn--s-vp9b.com/images/ml_11_1_492.jpeg' },
];

// ===== mirrors spa =====
const MIRRORS_SHOP = {
  id: 'tokyo_shibuya_shibuya_mirrors_spa',
  name: 'mirrors spa (ミラーズスパ)',
  website_url: 'https://mirrorsspa.com/',
  schedule_url: 'https://mirrorsspa.com/schedule',
  image_url: null,
  raw_data: { prefecture: '東京都', area: '渋谷' },
};

// Chrome /girl ページから取得（57名・全員写真あり）lidをStorageファイル名キーに使用
const MIRRORS_THERAPISTS = [
  { name: 'まりあ', lid: 141, imgUrl: 'https://mirrorsspa.com/photos/141/20260602013250-38E1095E-098C-4D23-ABCF-0CDD21A473CF.jpg' },
  { name: 'りお',   lid: 140, imgUrl: 'https://mirrorsspa.com/photos/140/20260524021020-AD912B1D-BDD6-4218-8C9A-E64BC36CC884.jpg' },
  { name: 'きほ',   lid: 139, imgUrl: 'https://mirrorsspa.com/photos/139/20260520081911-S__29810696_0.jpg' },
  { name: 'あみ',   lid: 138, imgUrl: 'https://mirrorsspa.com/photos/138/20260520012353-5D0C04CE-3A19-4B37-A355-A0E867103A9D.jpg' },
  { name: 'あい',   lid: 136, imgUrl: 'https://mirrorsspa.com/photos/136/20260502143914-DDA06017-B1D6-4936-B83C-AE16556FFDD9.jpg' },
  { name: 'みれい', lid: 133, imgUrl: 'https://mirrorsspa.com/photos/133/20260506014511-IMG_1331.jpeg' },
  { name: 'つき',   lid: 135, imgUrl: 'https://mirrorsspa.com/photos/135/20260526235057-801525AB-6D0C-44CE-A3B5-974C6C7B92B4.jpg' },
  { name: 'もな',   lid: 132, imgUrl: 'https://mirrorsspa.com/photos/132/20260417000202-4DD0818E-37C4-40DF-BAC4-06D569F241B5.jpg' },
  { name: 'めい',   lid: 130, imgUrl: 'https://mirrorsspa.com/photos/130/20260408002439-IMG_1301.jpeg' },
  { name: 'ひかる', lid: 126, imgUrl: 'https://mirrorsspa.com/photos/126/20260321103127-IMG_1272.jpeg' },
  { name: 'なち',   lid: 122, imgUrl: 'https://mirrorsspa.com/photos/122/20260228182531-IMG_1244.jpeg' },
  { name: 'まい',   lid: 53,  imgUrl: 'https://mirrorsspa.com/photos/53/20260201162253-IMG_1165.jpeg' },
  { name: 'ゆず',   lid: 43,  imgUrl: 'https://mirrorsspa.com/photos/43/20260216141701-IMG_1218.jpeg' },
  { name: 'しずく', lid: 107, imgUrl: 'https://mirrorsspa.com/photos/107/20260205033935-IMG_1190.jpeg' },
  { name: 'あや',   lid: 120, imgUrl: 'https://mirrorsspa.com/photos/120/20260219234157-S__40943619_0.jpg' },
  { name: 'れみ',   lid: 121, imgUrl: 'https://mirrorsspa.com/photos/121/20260228182500-IMG_1246.jpeg' },
  { name: 'こなつ', lid: 119, imgUrl: 'https://mirrorsspa.com/photos/119/20260305095114-IMG_1254.jpeg' },
  { name: 'ゆり',   lid: 61,  imgUrl: 'https://mirrorsspa.com/photos/61/20260509124044-S__11223109.jpg' },
  { name: 'りんか', lid: 116, imgUrl: 'https://mirrorsspa.com/photos/116/20260220142648-4A6DADF9-628E-4BFB-95F1-1DB32A008F59.jpg' },
  { name: 'りな',   lid: 128, imgUrl: 'https://mirrorsspa.com/photos/128/20260328184951-IMG_1282.jpeg' },
  { name: 'りり',   lid: 110, imgUrl: 'https://mirrorsspa.com/photos/110/20260209082113-5B0573D2-67AB-4337-97B5-85B492FF8AD8.jpg' },
  { name: 'れいか', lid: 27,  imgUrl: 'https://mirrorsspa.com/photos/27/20260216141807-IMG_1217.jpeg' },
  { name: 'えま',   lid: 104, imgUrl: 'https://mirrorsspa.com/photos/104/20260211081558-S__436502540.jpg' },
  { name: 'あん',   lid: 98,  imgUrl: 'https://mirrorsspa.com/photos/98/20260201171601-IMG_1167.jpeg' },
  { name: 'ひかり', lid: 94,  imgUrl: 'https://mirrorsspa.com/photos/94/20260307171651-IMG_1256.jpeg' },
  { name: 'のあ',   lid: 67,  imgUrl: 'https://mirrorsspa.com/photos/67/20260519195125-IMG_1356.jpeg' },
  { name: 'ゆき',   lid: 2,   imgUrl: 'https://mirrorsspa.com/photos/2/20260210114216-IMG_1205.jpeg' },
  { name: 'ちはる', lid: 86,  imgUrl: 'https://mirrorsspa.com/photos/86/20260203225804-S__40394765_0.jpg' },
  { name: 'みあ',   lid: 134, imgUrl: 'https://mirrorsspa.com/photos/134/20260426160338-IMG_1316.jpeg' },
  { name: 'まな',   lid: 68,  imgUrl: 'https://mirrorsspa.com/photos/68/20260426160614-IMG_1315.jpeg' },
  { name: 'ともえ', lid: 17,  imgUrl: 'https://mirrorsspa.com/photos/17/20250121025856-D53D42C6-41F2-4CC0-84FA-BEC5308A81DF.jpg' },
  { name: 'のの',   lid: 125, imgUrl: 'https://mirrorsspa.com/photos/125/20260314213828-IMG_1261.jpeg' },
  { name: 'あゆ',   lid: 100, imgUrl: 'https://mirrorsspa.com/photos/100/20260207173016-S__40574982_0.jpg' },
  { name: 'えれか', lid: 131, imgUrl: 'https://mirrorsspa.com/photos/131/20260407183836-IMG_1298.jpeg' },
  { name: 'あすか', lid: 117, imgUrl: 'https://mirrorsspa.com/photos/117/20260207085018-S__12910602_0.jpg' },
  { name: 'みゆ',   lid: 127, imgUrl: 'https://mirrorsspa.com/photos/127/20260321112003-IMG_1271.jpeg' },
  { name: 'ゆな',   lid: 137, imgUrl: 'https://mirrorsspa.com/photos/137/20260507143733-IMG_1335.jpeg' },
  { name: 'もも',   lid: 73,  imgUrl: 'https://mirrorsspa.com/photos/73/20250821225252-LINE_ALBUM_%E3%83%91%E3%83%8D%E3%83%AB%E5%B8%8C%E6%9C%9B_250821_1.jpg' },
  { name: 'はる',   lid: 20,  imgUrl: 'https://mirrorsspa.com/photos/20/20260214175437-ACEA05DA-F5C1-412C-B6AD-B1BA448431A2.jpg' },
  { name: 'れい',   lid: 108, imgUrl: 'https://mirrorsspa.com/photos/108/20260209182217-IMG_1200.jpeg' },
  { name: 'なお',   lid: 111, imgUrl: 'https://mirrorsspa.com/photos/111/20260213184654-EBF341F8-42ED-4296-8991-A850FBE8CACD.jpg' },
  { name: 'ねね',   lid: 124, imgUrl: 'https://mirrorsspa.com/photos/124/20260314144157-F0700E89-50E2-4BE5-BE42-09DEA37984C7.jpg' },
  { name: 'らん',   lid: 123, imgUrl: 'https://mirrorsspa.com/photos/123/20260302025918-S__41287683_0.jpg' },
  { name: 'るい',   lid: 103, imgUrl: 'https://mirrorsspa.com/photos/103/20260130042813-56F69293-0494-4F91-8D50-90246463E65F.jpg' },
  { name: 'ゆめ',   lid: 95,  imgUrl: 'https://mirrorsspa.com/photos/95/20251016152046-IMG_0939.jpeg' },
  { name: 'みお',   lid: 62,  imgUrl: 'https://mirrorsspa.com/photos/62/20260110201905-IMG_0598.jpeg' },
  { name: 'のどか', lid: 12,  imgUrl: 'https://mirrorsspa.com/photos/12/20241218212011-S__33005600_0.jpg' },
  { name: 'さくら', lid: 57,  imgUrl: 'https://mirrorsspa.com/photos/57/20250526153600-IMG_0686.jpeg' },
  { name: 'りあ',   lid: 74,  imgUrl: 'https://mirrorsspa.com/photos/74/20250625151845-IMG_0718.jpeg' },
  { name: 'まき',   lid: 112, imgUrl: 'https://mirrorsspa.com/photos/112/20251213220124-FAB9D591-02CA-4B0F-ADC6-7413265ADB27.jpg' },
  { name: 'つばき', lid: 65,  imgUrl: 'https://mirrorsspa.com/photos/65/20251128220528-9BEE5714-C34A-45EC-A910-24D66195B637.jpg' },
  { name: 'かほ',   lid: 32,  imgUrl: 'https://mirrorsspa.com/photos/32/20250128221347-S__33849347.jpg' },
  { name: 'りん',   lid: 89,  imgUrl: 'https://mirrorsspa.com/photos/89/20251019134645-IMG_0948.jpeg' },
  { name: 'こはく', lid: 79,  imgUrl: 'https://mirrorsspa.com/photos/79/20250705112538-B4F53D9D-802F-4556-808B-CD3735466388.jpg' },
  { name: 'つむぎ', lid: 59,  imgUrl: 'https://mirrorsspa.com/photos/59/20250417015406-S__12165124_0.jpg' },
  { name: 'えりさ', lid: 106, imgUrl: 'https://mirrorsspa.com/photos/106/20251127224113-IMG_1032.jpeg' },
  { name: 'ぺてぃ', lid: 115, imgUrl: 'https://mirrorsspa.com/photos/115/20260125183523-line_oa_chat_260125_183453.jpeg' },
];

async function uploadImage(imageUrl, storageKey, referer) {
  try {
    const res = await fetch(imageUrl, {
      headers: { Referer: referer, 'User-Agent': 'Mozilla/5.0' }
    });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const ext = imageUrl.split('.').pop().toLowerCase().split('?')[0];
    const contentType = (ext === 'jpeg' || ext === 'jpg') ? 'image/jpeg' : 'image/png';
    const fileName = `${storageKey}.jpg`;
    const { error } = await supabase.storage.from('therapist-images').upload(fileName, buffer, { contentType, upsert: true });
    if (error) { console.error(`  storage err:`, error.message); return null; }
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(fileName);
    return data.publicUrl;
  } catch (e) { return null; }
}

async function registerShop(shopData) {
  if (DRY_RUN) { console.log(`[DRY] Shop: ${shopData.name}`); return; }
  const { error } = await supabase.from('shops').upsert(shopData, { onConflict: 'id' });
  if (error) console.error('Shop error:', error.message);
  else console.log(`✅ Shop: ${shopData.id}`);
}

async function registerTherapists(shopId, therapists, prefix, referer) {
  let inserted = 0, skipped = 0, errors = 0;
  for (const t of therapists) {
    const therapistId = `${shopId}_${t.name}`;
    const { data: existing } = await supabase.from('therapists').select('id,image_url').eq('id', therapistId).single();
    if (existing?.image_url) { process.stdout.write('='); skipped++; continue; }

    const key = t.lid ? `${prefix}_${t.lid}` : `${prefix}_${t.name.replace(/[^\w]/g, '_')}`;
    let storageUrl = null;
    if (t.imgUrl) {
      storageUrl = DRY_RUN ? t.imgUrl : await uploadImage(t.imgUrl, key, referer);
    }

    const record = { id: therapistId, shop_id: shopId, name: t.name, image_url: storageUrl };
    if (!DRY_RUN) {
      const { error } = await supabase.from('therapists').upsert(record, { onConflict: 'id' });
      if (error) { console.error(`\n✗ ${t.name}:`, error.message); errors++; }
      else { process.stdout.write(storageUrl ? '+' : 'n'); inserted++; }
    } else {
      process.stdout.write(t.imgUrl ? '+' : 'n'); inserted++;
    }
    await new Promise(r => setTimeout(r, 250));
  }
  console.log(`\n挿入: ${inserted} / スキップ: ${skipped} / エラー: ${errors}`);
}

async function main() {
  console.log(`=== S活・ミラーズスパ 登録スクリプト (DRY_RUN=${DRY_RUN}) ===\n`);
  const runSkatsu  = !shopArg || shopArg === 'skatsu';
  const runMirrors = !shopArg || shopArg === 'mirrors';

  if (runSkatsu) {
    console.log(`--- S活 ${SKATSU_THERAPISTS.length}名 ---`);
    await registerShop(SKATSU_SHOP);
    await registerTherapists(SKATSU_SHOP.id, SKATSU_THERAPISTS, 'skatsu', 'https://www.xn--s-vp9b.com');
  }
  if (runMirrors) {
    console.log(`\n--- mirrors spa ${MIRRORS_THERAPISTS.length}名 ---`);
    await registerShop(MIRRORS_SHOP);
    await registerTherapists(MIRRORS_SHOP.id, MIRRORS_THERAPISTS, 'mirrors', 'https://mirrorsspa.com');
  }
}

main().catch(console.error);
