/**
 * GRAND CHARIOT (グランシャリオ) 高田馬場 登録スクリプト (27名)
 * スペーサー画像パターン: img[alt*="さんの写真"] + style="background-image: url(...)"
 * 画像パターン: /images/ml_11_1_{id}.jpg (Referer不要)
 *
 * 実行:
 *   node scripts/maintenance/process_grand_chariot.mjs --dry-run
 *   node scripts/maintenance/process_grand_chariot.mjs
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const DRY_RUN = process.argv.includes('--dry-run');
const BASE = 'https://www.grandchariottakadababa.com';

const CHARIOT_SHOP = {
  id: 'tokyo_shinjuku_takadanobaba_grand_chariot',
  name: 'GRAND CHARIOT (グランシャリオ)',
  website_url: `${BASE}/`,
  schedule_url: `${BASE}/schedule/`,
  image_url: `${BASE}/asset/img/logo.png`,
  raw_data: { prefecture: '東京都', area: '高田馬場' },
};

// スペーサー+background-image パターン、27名（Chrome DOM抽出・全URL確認済み）
// key: ml_11_1_{id} の数字部分
const THERAPISTS = [
  { name: '生田 あゆ',     imgUrl: `${BASE}/images/ml_11_1_11317.jpg`,   key: 'chariot_11317' },
  { name: '涼野なな',      imgUrl: `${BASE}/images/ml_11_1_11314.jpg`,   key: 'chariot_11314' },
  { name: '神谷 ここ',    imgUrl: `${BASE}/images/ml_11_1_11293.jpg`,   key: 'chariot_11293' },
  { name: '花村 りお',    imgUrl: `${BASE}/images/ml_11_1_11184.jpeg`,  key: 'chariot_11184' },
  { name: '綾 ひいな',    imgUrl: `${BASE}/images/ml_11_1_11296.jpg`,   key: 'chariot_11296' },
  { name: '宮瀬 ちなつ',  imgUrl: `${BASE}/images/ml_11_1_11254.jpg`,   key: 'chariot_11254' },
  { name: '桜井うさ',      imgUrl: `${BASE}/images/ml_11_1_11252.jpg`,   key: 'chariot_11252' },
  { name: '潤間 えりか',  imgUrl: `${BASE}/images/ml_11_1_11310.jpg`,   key: 'chariot_11310' },
  { name: '立花 れいこ',  imgUrl: `${BASE}/images/ml_11_1_5773.jpg`,    key: 'chariot_5773'  },
  { name: 'まりん',        imgUrl: `${BASE}/images/ml_11_1_11225.jpg`,   key: 'chariot_11225' },
  { name: '白石 りの',    imgUrl: `${BASE}/images/ml_11_1_11232.jpg`,   key: 'chariot_11232' },
  { name: '明日美 すず',  imgUrl: `${BASE}/images/ml_11_1_10725.jpg`,   key: 'chariot_10725' },
  { name: '中村 ゆりな',  imgUrl: `${BASE}/images/ml_11_1_11122.jpeg`,  key: 'chariot_11122' },
  { name: '大谷 るな',    imgUrl: `${BASE}/images/ml_11_1_10321.jpeg`,  key: 'chariot_10321' },
  { name: '綾瀬 ゆき',    imgUrl: `${BASE}/images/ml_11_1_11303.jpg`,   key: 'chariot_11303' },
  { name: '七瀬 かずさ',  imgUrl: `${BASE}/images/ml_11_1_11209.jpg`,   key: 'chariot_11209' },
  { name: '如月れみ',      imgUrl: `${BASE}/images/ml_11_1_8936.jpg`,    key: 'chariot_8936'  },
  { name: '土生 みずほ',  imgUrl: `${BASE}/images/ml_11_1_5548.jpg`,    key: 'chariot_5548'  },
  { name: '直井 れいな',  imgUrl: `${BASE}/images/ml_11_1_6851.jpg`,    key: 'chariot_6851'  },
  { name: '百瀬 らん',    imgUrl: `${BASE}/images/ml_11_1_11201.jpg`,   key: 'chariot_11201' },
  { name: '紬 あやね',    imgUrl: `${BASE}/images/ml_11_1_10598.jpg`,   key: 'chariot_10598' },
  { name: '小野寺 にいな',imgUrl: `${BASE}/images/ml_11_1_6704.jpg`,    key: 'chariot_6704'  },
  { name: '藍沢 あゆ',    imgUrl: `${BASE}/images/ml_11_1_11250.jpg`,   key: 'chariot_11250' },
  { name: '小山 ゆい',    imgUrl: `${BASE}/images/ml_11_1_11260.jpg`,   key: 'chariot_11260' },
  { name: '花咲ゆい',      imgUrl: `${BASE}/images/ml_11_1_11207.jpg`,   key: 'chariot_11207' },
  { name: '堂園 かすみ',  imgUrl: `${BASE}/images/ml_11_1_8459.jpeg`,   key: 'chariot_8459'  },
  { name: '椿 かれん',    imgUrl: `${BASE}/images/ml_11_1_9399.jpg`,    key: 'chariot_9399'  },
];

async function uploadImage(imgUrl, key) {
  try {
    const res = await fetch(imgUrl, { headers: { Referer: BASE, 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) { console.error(`\n  ✗ ${res.status}: ${imgUrl}`); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = imgUrl.split('?')[0].split('.').pop().toLowerCase();
    const ct = ext === 'png' ? 'image/png' : 'image/jpeg';
    const { error } = await supabase.storage.from('therapist-images').upload(`${key}.jpg`, buf, { contentType: ct, upsert: true });
    if (error) { console.error(`\n  ✗ upload: ${error.message}`); return null; }
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(`${key}.jpg`);
    return data.publicUrl;
  } catch (e) { console.error(`\n  ✗ ${e.message}`); return null; }
}

async function main() {
  console.log(`=== GRAND CHARIOT 登録 (DRY_RUN=${DRY_RUN}) ===`);
  console.log(`対象: ${THERAPISTS.length}名\n`);

  if (DRY_RUN) {
    console.log(`[DRY] Shop: ${CHARIOT_SHOP.name}`);
    THERAPISTS.forEach(t => console.log(`  + ${t.name}`));
    return;
  }

  const { error: shopErr } = await supabase.from('shops').upsert(CHARIOT_SHOP, { onConflict: 'id' });
  if (shopErr) console.error('Shop error:', shopErr.message);
  else console.log(`✅ ${CHARIOT_SHOP.id}`);

  let ins = 0, skp = 0, err = 0;
  for (const t of THERAPISTS) {
    const tid = `${CHARIOT_SHOP.id}_${t.name}`;
    const { data: ex } = await supabase.from('therapists').select('id,image_url').eq('id', tid).single();
    if (ex?.image_url) { process.stdout.write('='); skp++; continue; }
    const url = await uploadImage(t.imgUrl, t.key);
    const { error } = await supabase.from('therapists').upsert(
      { id: tid, shop_id: CHARIOT_SHOP.id, name: t.name, image_url: url },
      { onConflict: 'id' }
    );
    if (error) { console.error(`\n✗ ${t.name}`); err++; }
    else { process.stdout.write(url ? '+' : 'n'); ins++; }
    await new Promise(r => setTimeout(r, 300));
  }
  console.log(`\n\n=== 完了 ===`);
  console.log(`挿入: ${ins} / スキップ: ${skp} / エラー: ${err}`);
}
main().catch(console.error);
