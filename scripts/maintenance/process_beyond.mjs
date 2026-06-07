/**
 * BEYOND (ビヨンド) 上野 登録スクリプト (20名)
 * WordPress wp-content/uploads パターン（ホットリンク保護あり）
 * Referer付きでStorage移行
 *
 * 実行:
 *   node scripts/maintenance/process_beyond.mjs --dry-run
 *   node scripts/maintenance/process_beyond.mjs
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const DRY_RUN = process.argv.includes('--dry-run');
const BASE = 'https://uroom-esthe.com';

const BEYOND_SHOP = {
  id: 'tokyo_taito_ueno_beyond',
  name: 'BEYOND (ビヨンド)',
  website_url: `${BASE}/`,
  schedule_url: `${BASE}/schedule/`,
  image_url: 'https://uroom-esthe.com/wp-content/uploads/0_beyond_1450_820_5555.jpg',
  raw_data: { prefecture: '東京都', area: '上野' },
};

// WordPress wp-content/uploads、20名
// Storage ファイル名: ローマ字プレフィックス（日付前）を使用
const THERAPISTS = [
  { name: 'こやませいら', img: 'koyamaseira_20260526_11_300_450.jpg' },
  { name: '栗原しずく',   img: 'kuriharashizuku_20260518_1_300_450.jpg' },
  { name: '三川ゆな',     img: 'mikawayuna_20260515_1_1_300_450.jpg' },
  { name: '森長みなみ',   img: 'morinagaminami_20260516_1_300_450.jpg' },
  { name: '新井みお',     img: 'araimio_20260516_3_300_450.jpg' },
  { name: '沙月ももな',   img: 'satsukimomona_20260516_1_300_450.jpg' },
  { name: 'ひめのさら',   img: 'himenosara_20260506_1_1_300_450_1.jpg' },
  { name: '藤沢のどか',   img: 'hujisawanodoka_20260505_1_1_300_450.jpg' },
  { name: '氷上すみれ',   img: 'hikamisumire_20260502_1_1_300_450.jpg' },
  { name: '早乙女しゅうか',img: 'saotomesyuka_20260501_1_300_450.jpg' },
  { name: '瀬戸りっか',   img: 'setorikka_20260416_1_1_300_450.jpg' },
  { name: '大村なほ',     img: 'oomuranaho_20260407_2_300_450.jpg' },
  { name: 'ゆめのあお',   img: 'yumenoao_20260423_1_300_450.jpg' },
  { name: 'さんご',       img: 'sango_20260422_2_1_300_450.jpg' },
  { name: 'あまいきなこ', img: 'amaikinako_20260504_1_1_300_450.jpg' },
  { name: 'あずまなな',   img: 'azumanana_20260428_1_300_450.jpg' },
  { name: '奥井あずさ',   img: 'okuiazusa_20260422_1_1_300_450.jpg' },
  { name: '神谷もも',     img: 'kamiyamomo_20260420_1_1_300_450.jpg' },
  { name: '砂山さなえ',   img: 'sunayamasanae_20260405_1_1_300_450.jpg' },
  { name: '向井えな',     img: 'mukaiena_20260408_2_2_300_450.jpg' },
].map(t => ({
  ...t,
  imgUrl: `${BASE}/wp-content/uploads/${t.img}`,
  // Storage ファイル名: ローマ字部分（最初のアンダースコア〜日付前まで）
  storageKey: 'beyond_' + t.img.replace(/_\d{8}_.*$/, ''),
}));

async function uploadImage(imgUrl, key) {
  try {
    const res = await fetch(imgUrl, {
      headers: { Referer: BASE, 'User-Agent': 'Mozilla/5.0' }
    });
    if (!res.ok) { console.error(`\n  fetch failed ${res.status}: ${imgUrl}`); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = imgUrl.split('.').pop().toLowerCase();
    const ct = ext === 'png' ? 'image/png' : 'image/jpeg';
    const { error } = await supabase.storage.from('therapist-images').upload(`${key}.jpg`, buf, {
      contentType: ct, upsert: true
    });
    if (error) { console.error(`\n  upload error: ${error.message}`); return null; }
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(`${key}.jpg`);
    return data.publicUrl;
  } catch (e) { console.error(`\n  exception: ${e.message}`); return null; }
}

async function main() {
  console.log(`=== BEYOND 登録スクリプト (DRY_RUN=${DRY_RUN}) ===`);
  console.log(`対象: ${THERAPISTS.length}名\n`);

  if (DRY_RUN) {
    console.log(`[DRY] Shop: ${BEYOND_SHOP.name}`);
    THERAPISTS.forEach(t => console.log(`  + ${t.name} → ${t.storageKey}.jpg`));
    return;
  }

  const { error: shopErr } = await supabase.from('shops').upsert(BEYOND_SHOP, { onConflict: 'id' });
  if (shopErr) console.error('Shop error:', shopErr.message);
  else console.log(`✅ ${BEYOND_SHOP.id}`);

  let ins = 0, skp = 0, err = 0;
  for (const t of THERAPISTS) {
    const tid = `${BEYOND_SHOP.id}_${t.name}`;
    const { data: ex } = await supabase.from('therapists').select('id,image_url').eq('id', tid).single();
    if (ex?.image_url) { process.stdout.write('='); skp++; continue; }

    const url = await uploadImage(t.imgUrl, t.storageKey);
    const record = { id: tid, shop_id: BEYOND_SHOP.id, name: t.name, image_url: url };
    const { error } = await supabase.from('therapists').upsert(record, { onConflict: 'id' });
    if (error) { console.error(`\n✗ ${t.name}: ${error.message}`); err++; }
    else { process.stdout.write(url ? '+' : 'n'); ins++; }

    await new Promise(r => setTimeout(r, 300));
  }
  console.log(`\n\n=== 完了 ===`);
  console.log(`挿入: ${ins} / スキップ: ${skp} / エラー: ${err}`);
}

main().catch(console.error);
