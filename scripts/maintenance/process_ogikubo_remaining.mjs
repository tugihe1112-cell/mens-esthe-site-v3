/**
 * 高田馬場・荻窪 残り4店舗 登録スクリプト
 *   - evergreen (高田馬場10位) 23名 — 画像なし（noimage）
 *   - SENZSPA (荻窪9位) 29名 — /images/ml_11_1_{id}.jpeg
 *   - Jewelry (荻窪10位) 27名 — S3バケット
 *   ※ 熟的: 公式サイト不明のためスキップ
 *
 * 実行:
 *   node scripts/maintenance/process_ogikubo_remaining.mjs --dry-run
 *   node scripts/maintenance/process_ogikubo_remaining.mjs
 *   node scripts/maintenance/process_ogikubo_remaining.mjs --shop evergreen
 *   node scripts/maintenance/process_ogikubo_remaining.mjs --shop senzspa
 *   node scripts/maintenance/process_ogikubo_remaining.mjs --shop jewelry
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

// ===== evergreen (画像なし) =====
const EVERGREEN_SHOP = {
  id: 'tokyo_shinjuku_takadanobaba_evergreen',
  name: 'evergreen (エバーグリーン)',
  website_url: 'https://www.ever-green.tokyo/',
  schedule_url: 'https://www.ever-green.tokyo/schedule/',
  image_url: null,
  raw_data: { prefecture: '東京都', area: '高田馬場' },
};
const EVERGREEN_NAMES = ['樋口','上原','和泉','星野','青葉','津島','小西','坂口','日高','中野','進藤','朝比奈','三浦','橋本','松原','真矢','鈴木','花咲','矢沢','蓮美','北村','保田','川上'];

// ===== SENZSPA =====
const SENZ_SHOP = {
  id: 'tokyo_suginami_asagaya_senzspa',
  name: 'SENZSPA (センズスパ) 阿佐ヶ谷',
  website_url: 'https://www.senzspa.com/',
  schedule_url: 'https://www.senzspa.com/schedule/',
  image_url: null,
  raw_data: { prefecture: '東京都', area: '荻窪' },
};
const SENZ_THERAPISTS = [
  { name: '百合川 なな', id: '2877', ext: 'jpeg' },
  { name: '七瀬 ひかり', id: '2982', ext: 'jpg'  },
  { name: '品川 まり',   id: '132',  ext: 'jpeg' },
  { name: '伊吹 きい',   id: '145',  ext: 'jpeg' },
  { name: '夢咲 ことり', id: '170',  ext: 'jpeg' },
  { name: '藤白 こよみ', id: '3114', ext: 'jpeg' },
  { name: '花井 みつき', id: '3193', ext: 'jpeg' },
  { name: '愛坂あやな',  id: '3411', ext: 'jpeg' },
  { name: '椎原みなみ',  id: '3563', ext: 'jpeg' },
  { name: '坂口みすず',  id: '3982', ext: 'jpeg' },
  { name: '西宮ゆあ',    id: '3966', ext: 'jpeg' },
  { name: '七瀬さな',    id: '4883', ext: 'jpeg' },
  { name: '椎名ひまり',  id: '4973', ext: 'jpeg' },
  { name: '桃瀬 あい',   id: '4993', ext: 'jpeg' },
  { name: '夢中りん',    id: '5349', ext: 'jpeg' },
  { name: '美咲りほ',    id: null,   ext: null   },  // 画像なし
  { name: '前田莉緒',    id: '5398', ext: 'jpeg' },
  { name: '如月えれな',  id: '5411', ext: 'jpeg' },
  { name: '苺谷あおい',  id: '5552', ext: 'jpeg' },
  { name: '松村かれん',  id: '5578', ext: 'jpeg' },
  { name: '夏川志保',    id: '5627', ext: 'jpeg' },
  { name: '葵 さくら',   id: '5810', ext: 'jpeg' },
  { name: '桜みお',      id: null,   ext: null   },  // 画像なし
  { name: '佐野みらい',  id: '5849', ext: 'jpeg' },
  { name: '鈴野るい',    id: '5909', ext: 'jpeg' },
  { name: '白石りこ',    id: '5930', ext: 'jpeg' },
  { name: '鳴海うみ',    id: '5939', ext: 'jpeg' },
  { name: '北乃ゆい',    id: '5984', ext: 'jpeg' },
  { name: '仲 メイさ',   id: '6011', ext: 'jpeg' },
].map(t => ({
  name: t.name,
  src: t.id ? `https://www.senzspa.com/images/ml_11_1_${t.id}.${t.ext}` : null,
  key: t.id ? `senzspa_${t.id}` : null,
}));

// ===== Jewelry (S3バケット) =====
const JEWELRY_SHOP = {
  id: 'tokyo_suginami_ogikubo_jewelry',
  name: 'Jewelry (ジュエリー)',
  website_url: 'https://jewelry-esthe.com/',
  schedule_url: 'https://jewelry-esthe.com/schedule',
  image_url: 'https://jewelry-esthe.com/assets/customer/logo-b6f45cd290c5593333cb0d960315db193b5f178e6a880e81f8e9eda9e4074875.png',
  raw_data: { prefecture: '東京都', area: '荻窪' },
};
const JEWELRY_THERAPISTS = [
  { name: '大沢 みゆ',   key: 'jewelry_40', src: 'https://jewelry-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/40/00efe729-e604-4e37-88f8-5701755332d3.jpg' },
  { name: '愛沢 みこ',   key: 'jewelry_39', src: 'https://jewelry-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/39/9ebc66b8-3ff6-49e1-b8c8-fe9a5ef8b469.jpg' },
  { name: '森 ぴの',     key: 'jewelry_26', src: 'https://jewelry-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/26/6544eb27-41e6-4c41-ae82-368dc07e2db3.jpg' },
  { name: '南 ゆうな',   key: 'jewelry_7',  src: 'https://jewelry-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/7/90877d90-3b9f-4f88-b959-a29ac2b74552.jpg' },
  { name: '八代 ゆい',   key: 'jewelry_2',  src: 'https://jewelry-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/2/f6b6ef96-0249-4793-a24d-61344b602735.jpg' },
  { name: '新里 らん',   key: 'jewelry_10', src: 'https://jewelry-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/10/0f69c166-f6ea-4036-b26d-0daeb8a85430.jpg' },
  { name: '水戸 なみ',   key: 'jewelry_11', src: 'https://jewelry-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/11/21164ad3-58db-4307-b939-d38ef2e1e4b3.jpg' },
  { name: '長門 りづ',   key: 'jewelry_22', src: 'https://jewelry-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/22/3d5bd447-5b47-4c00-9dc6-94bc89e05f82.jpg' },
  { name: '月島 ましろ', key: 'jewelry_23', src: 'https://jewelry-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/23/9d4eadbc-cdea-4e6a-8e51-3e20ba7af21c.jpg' },
  { name: '友利 つばさ', key: 'jewelry_36', src: 'https://jewelry-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/36/1dfec66c-6b19-4ece-9023-5d6db6b38b79.jpg' },
  { name: '新垣 もえ',   key: 'jewelry_37', src: 'https://jewelry-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/37/e59dd91f-d86d-4d4c-83b4-3f12f547df6c.jpg' },
  { name: '大浜 るな',   key: 'jewelry_38', src: 'https://jewelry-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/38/ad5ac225-5264-4a73-a46b-b7d0f9a2ea47.jpg' },
  { name: '永瀬 あかり', key: 'jewelry_35', src: 'https://jewelry-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/35/0f78e7f9-47c0-4e25-b7a4-e34e88d7b3ea.jpg' },
  { name: '明日香 えみり',key: 'jewelry_24', src: 'https://jewelry-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/24/382e5cf0-2b40-492b-9f13-b9651bb4c1b5.jpg' },
  { name: '西宮 はづき', key: 'jewelry_12', src: 'https://jewelry-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/12/a263d6f9-ec22-42b7-804f-73a5f28b0906.jpg' },
  { name: '花咲 あゆ',   key: 'jewelry_13', src: 'https://jewelry-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/13/cc840e40-6352-4060-a43b-d72be4260c91.jpg' },
  { name: '白石 さくら', key: 'jewelry_14', src: 'https://jewelry-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/14/eb3e6f2c-e3e7-45b0-83f2-d20c768a886f.jpg' },
  { name: '藤野 にじ',   key: 'jewelry_15', src: 'https://jewelry-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/15/8d951b79-8b9d-4335-9a36-28c8327da619.jpg' },
  { name: '星乃 りう',   key: 'jewelry_16', src: 'https://jewelry-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/16/f7d8da7a-15d7-4038-b71e-c9d7f3aebe9f.jpg' },
  { name: '天使 める',   key: 'jewelry_28', src: 'https://jewelry-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/28/f4f2ea51-0d82-4882-8a7c-fa9ba7ea0edb.jpg' },
  { name: '白星 もも',   key: 'jewelry_32', src: 'https://jewelry-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/32/c4d2d2f5-f1f6-47dd-a124-44f3e4576a96.jpg' },
  { name: '島崎 あやな', key: 'jewelry_34', src: 'https://jewelry-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/34/c52610e8-5efc-4e24-96b3-56c7f9378419.jpg' },
  { name: '桜井 みな',   key: 'jewelry_29', src: 'https://jewelry-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/29/0ff20ccc-97f7-4a48-a0ad-a119ca922b51.jpg' },
  { name: '天宮 ゆり',   key: 'jewelry_30', src: 'https://jewelry-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/30/37bf89b5-9a64-490b-a5e1-6e50771185ec.jpg' },
  { name: '松川 ちはる', key: 'jewelry_17', src: 'https://jewelry-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/17/573638c4-388d-4da8-9e6c-7369870c927f.jpg' },
  { name: '一条 さやか', key: 'jewelry_19', src: 'https://jewelry-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/19/48987532-8391-4c0d-a73a-66a2d70c2b37.jpg' },
  { name: '水瀬 ももな', key: 'jewelry_20', src: 'https://jewelry-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/20/e5c4f6f7-bae3-4bd9-aad4-6f52c5f82a43.jpg' },
];

// ===== 共通 =====
async function uploadImage(imgUrl, key, referer) {
  try {
    const headers = { 'User-Agent': 'Mozilla/5.0' };
    if (referer) headers['Referer'] = referer;
    const res = await fetch(imgUrl, { headers });
    if (!res.ok) { process.stdout.write('!'); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = imgUrl.split('?')[0].split('.').pop().toLowerCase();
    const ct = ext === 'png' ? 'image/png' : 'image/jpeg';
    const { error } = await supabase.storage.from('therapist-images').upload(`${key}.jpg`, buf, { contentType: ct, upsert: true });
    if (error) { process.stdout.write('!'); return null; }
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(`${key}.jpg`);
    return data.publicUrl;
  } catch { process.stdout.write('!'); return null; }
}

async function registerShop(s) {
  if (DRY_RUN) { console.log(`[DRY] Shop: ${s.name}`); return; }
  const { error } = await supabase.from('shops').upsert(s, { onConflict: 'id' });
  if (error) console.error('Shop error:', error.message);
  else console.log(`✅ ${s.id}`);
}

async function registerTherapists(shopId, therapists, referer) {
  let ins = 0, skp = 0, err = 0;
  for (const t of therapists) {
    const name = typeof t === 'string' ? t : t.name;
    const src  = typeof t === 'string' ? null : t.src;
    const key  = typeof t === 'string' ? null : t.key;
    const tid  = `${shopId}_${name}`;
    const { data: ex } = await supabase.from('therapists').select('id,image_url').eq('id', tid).single();
    if (ex?.image_url) { process.stdout.write('='); skp++; continue; }
    const url = (!DRY_RUN && src && key) ? await uploadImage(src, key, referer) : (DRY_RUN && src ? src : null);
    const record = { id: tid, shop_id: shopId, name, image_url: url };
    if (!DRY_RUN) {
      const { error } = await supabase.from('therapists').upsert(record, { onConflict: 'id' });
      if (error) { console.error(`\n✗ ${name}`); err++; }
      else { process.stdout.write(url ? '+' : 'n'); ins++; }
    } else { process.stdout.write(src ? '+' : 'n'); ins++; }
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`\n挿入: ${ins} / スキップ: ${skp} / エラー: ${err}`);
}

async function main() {
  console.log(`=== 残り3店舗 登録 (DRY_RUN=${DRY_RUN}) ===\n`);
  const run = (n) => !shopArg || shopArg === n;

  if (run('evergreen')) { console.log(`--- evergreen ${EVERGREEN_NAMES.length}名 ---`);    await registerShop(EVERGREEN_SHOP); await registerTherapists(EVERGREEN_SHOP.id, EVERGREEN_NAMES, null); }
  if (run('senzspa'))   { console.log(`\n--- SENZSPA ${SENZ_THERAPISTS.length}名 ---`);   await registerShop(SENZ_SHOP); await registerTherapists(SENZ_SHOP.id, SENZ_THERAPISTS, 'https://www.senzspa.com'); }
  if (run('jewelry'))   { console.log(`\n--- Jewelry ${JEWELRY_THERAPISTS.length}名 ---`); await registerShop(JEWELRY_SHOP); await registerTherapists(JEWELRY_SHOP.id, JEWELRY_THERAPISTS, 'https://jewelry-esthe.com'); }

  console.log('\n=== 完了 ===');
}
main().catch(console.error);
