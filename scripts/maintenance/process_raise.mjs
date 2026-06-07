/**
 * Raise (レイズ) 秋葉原 登録スクリプト (17名)
 * WordPress サイト、meta-twitter:image から画像URL取得済み
 *
 * 実行:
 *   node scripts/maintenance/process_raise.mjs --dry-run
 *   node scripts/maintenance/process_raise.mjs
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const DRY_RUN = process.argv.includes('--dry-run');
const BASE = 'https://raise-esthe.com';

const RAISE_SHOP = {
  id: 'tokyo_chiyoda_akihabara_raise',
  name: 'Raise (レイズ)',
  website_url: `${BASE}/`,
  schedule_url: `${BASE}/schedule/`,
  image_url: null,
  raw_data: { prefecture: '東京都', area: '秋葉原' },
};

// meta-twitter:image から取得した画像URL（17名）
const THERAPISTS = [
  { name: 'あおい',     img: '2025/12/IMG_3917.jpeg' },
  { name: '小鳥遊めろ', img: '2025/11/IMG_3847.jpeg' },
  { name: 'さな',       img: '2025/10/IMG_3776.jpeg' },
  { name: 'もえか',     img: '2025/10/IMG_3799.jpeg' },
  { name: 'ももこ',     img: '2026/04/IMG_4116.jpeg' },
  { name: 'ねね',       img: '2022/11/2CBFE566-8499-4706-84CB-C999EE121A75.jpeg' },
  { name: 'みなみ',     img: '2024/04/IMG_2780.jpeg' },
  { name: 'さき',       img: '2022/06/1654009023051.jpg' },
  { name: 'さつき',     img: '2022/05/B960ABA9-58A4-49AF-85FA-36317C19835E.jpeg' },
  { name: 'いおり',     img: '2022/03/1648565758966.jpg' },
  { name: 'めい',       img: '2026/03/IMG_4074.jpeg' },
  { name: 'らぶ',       img: '2021/03/66533.jpg' },
  { name: 'あい',       img: '2021/03/67914.jpg' },
  { name: 'みな',       img: null },
  { name: 'まお',       img: '2019/12/mao_eye.jpg' },
  { name: 'りお',       img: '2019/12/rio_eye-2.jpg' },
  { name: 'みさき',     img: '2025/10/IMG_3803.jpeg' },
].map(t => ({
  ...t,
  imgUrl: t.img ? `${BASE}/wp-content/uploads/${t.img}` : null,
}));

async function uploadImage(imgUrl, key) {
  try {
    const res = await fetch(imgUrl, { headers: { Referer: BASE, 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = imgUrl.split('.').pop().toLowerCase();
    const ct = ext === 'png' ? 'image/png' : 'image/jpeg';
    const { error } = await supabase.storage.from('therapist-images').upload(`${key}.jpg`, buf, { contentType: ct, upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(`${key}.jpg`);
    return data.publicUrl;
  } catch { return null; }
}

async function main() {
  console.log(`=== Raise 登録スクリプト (DRY_RUN=${DRY_RUN}) ===`);
  console.log(`対象: ${THERAPISTS.length}名\n`);

  if (DRY_RUN) { console.log(`[DRY] Shop: ${RAISE_SHOP.name}`); }
  else {
    const { error } = await supabase.from('shops').upsert(RAISE_SHOP, { onConflict: 'id' });
    if (error) console.error('Shop error:', error.message);
    else console.log(`✅ ${RAISE_SHOP.id}`);
  }

  let ins = 0, skp = 0, err = 0;
  for (const t of THERAPISTS) {
    const tid = `${RAISE_SHOP.id}_${t.name}`;
    const { data: ex } = await supabase.from('therapists').select('id,image_url').eq('id', tid).single();
    if (ex?.image_url) { process.stdout.write('='); skp++; continue; }

    let url = null;
    if (t.imgUrl) {
      const key = `raise_${t.name.replace(/[^\w]/g, '_')}`;
      url = DRY_RUN ? t.imgUrl : await uploadImage(t.imgUrl, key);
    }

    const record = { id: tid, shop_id: RAISE_SHOP.id, name: t.name, image_url: url };
    if (!DRY_RUN) {
      const { error } = await supabase.from('therapists').upsert(record, { onConflict: 'id' });
      if (error) { console.error(`\n✗ ${t.name}`); err++; }
      else { process.stdout.write(url ? '+' : 'n'); ins++; }
    } else {
      process.stdout.write(t.imgUrl ? '+' : 'n'); ins++;
    }
    await new Promise(r => setTimeout(r, 300));
  }
  console.log(`\n\n=== 完了 ===`);
  console.log(`挿入: ${ins} / スキップ: ${skp} / エラー: ${err}`);
}

main().catch(console.error);
