/**
 * Louis (ルイス) 上野 登録スクリプト (37名)
 * imgsrv.jp/shop/57/lady/{hash}.jpg パターン
 * alt: 【上野メンズエステ Louis（ルイス）】名前
 *
 * 実行:
 *   node scripts/maintenance/process_louis.mjs --dry-run
 *   node scripts/maintenance/process_louis.mjs
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const DRY_RUN = process.argv.includes('--dry-run');
const BASE = 'https://ueno-louis.com';

const LOUIS_SHOP = {
  id: 'tokyo_taito_ueno_louis',
  name: 'Louis (ルイス)',
  website_url: `${BASE}/`,
  schedule_url: `${BASE}/schedule/`,
  image_url: 'https://imgsrv.jp/shop/57/parts/og-image.png',
  raw_data: { prefecture: '東京都', area: '上野' },
};

// imgsrv.jp CDN、37名（nowprinting 2名は null）
// hash をファイル名に使用（ユニーク）
const THERAPISTS = [
  { name: 'りりか',    hash: '20f08cdd1fc200c6dd' },
  { name: 'もえ',      hash: '797db710a25781b1c2' },
  { name: '橘 あずさ', hash: 'b367249ea90cdc8991' },
  { name: 'アリス',    hash: '52600c03af299cb9a6' },
  { name: 'あこ',      hash: '1d444f0dd6dbd162e8' },
  { name: 'まみ',      hash: 'd0a96620342ec5d5da' },
  { name: 'ゆい',      hash: 'a5133df5df180b4ffa' },
  { name: 'あきら',    hash: 'c241754edd69a5f9f1' },
  { name: 'りこ',      hash: '7dc6de4d0ffccd6bbb' },
  { name: 'ちあき',    hash: 'b3858c6dd25211ca43' },
  { name: 'もも',      hash: '48406bcb3f3bf02fc6' },
  { name: 'みれい',    hash: '631770ec83b2c30aae' },
  { name: 'みさき',    hash: null },               // nowprinting
  { name: 'あい',      hash: 'a0884036ce76726e2b' },
  { name: 'りな',      hash: '4ad92724c45e33f3d8' },
  { name: '五条',      hash: '4475ee0f1d13c90965' },
  { name: 'いと',      hash: 'a132b8ea818a1b6fad' },
  { name: 'るか',      hash: '9d17b57f27010c5142' },
  { name: 'かの',      hash: null },               // nowprinting
  { name: 'あみ',      hash: '9abbc5ff6651823207' },
  { name: 'かおり',    hash: 'f144d37e9c33921053' },
  { name: '礼奈',      hash: '905ab87e39d2fa7015' },
  { name: 'ゆま',      hash: '9e33fc7855747d62ec' },
  { name: 'れおな',    hash: '96a41dbe0501953b6d' },
  { name: 'まどか',    hash: '67d1783cdee392c540' },
  { name: 'みなみ',    hash: '977f8228653268efd5' },
  { name: 'まいか',    hash: '13b3a253c9d8d33b79' },
  { name: 'エレン',    hash: 'a3a64d27937b593eab' },
  { name: 'まりあ',    hash: '9d1db467bd53ee5d9d' },
  { name: '美羽',      hash: 'd3012234b4de744c70' },
  { name: 'すず',      hash: '0d148eda03867fefa1' },
  { name: 'ふゆ',      hash: '8d6acdd60d1281b38a' },
  { name: 'ふみか',    hash: '5bbaa3586a1bb90da9' },
  { name: 'さくら',    hash: 'da1acf350f218f55c5' },
  { name: 'りのん',    hash: 'bed67d7209f1b44fde' },
  { name: 'そら',      hash: 'd09807c90c4d96ad5c' },
  { name: 'らる',      hash: 'e00110210a97d98f75' },
].map(t => ({
  ...t,
  imgUrl: t.hash ? `https://imgsrv.jp/shop/57/lady/${t.hash}.jpg` : null,
}));

async function uploadImage(imgUrl, key) {
  try {
    const res = await fetch(imgUrl, { headers: { Referer: BASE, 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const { error } = await supabase.storage.from('therapist-images').upload(`${key}.jpg`, buf, {
      contentType: 'image/jpeg', upsert: true
    });
    if (error) return null;
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(`${key}.jpg`);
    return data.publicUrl;
  } catch { return null; }
}

async function main() {
  console.log(`=== Louis 登録スクリプト (DRY_RUN=${DRY_RUN}) ===`);
  console.log(`対象: ${THERAPISTS.length}名\n`);

  if (DRY_RUN) {
    console.log(`[DRY] Shop: ${LOUIS_SHOP.name}`);
  } else {
    const { error } = await supabase.from('shops').upsert(LOUIS_SHOP, { onConflict: 'id' });
    if (error) console.error('Shop error:', error.message);
    else console.log(`✅ ${LOUIS_SHOP.id}`);
  }

  let ins = 0, skp = 0, err = 0;
  for (const t of THERAPISTS) {
    const tid = `${LOUIS_SHOP.id}_${t.name}`;
    const { data: ex } = await supabase.from('therapists').select('id,image_url').eq('id', tid).single();
    if (ex?.image_url) { process.stdout.write('='); skp++; continue; }

    let url = null;
    if (t.imgUrl) {
      const hash = t.hash;
      const key = `louis_${hash}`;
      url = DRY_RUN ? t.imgUrl : await uploadImage(t.imgUrl, key);
    }

    const record = { id: tid, shop_id: LOUIS_SHOP.id, name: t.name, image_url: url };
    if (!DRY_RUN) {
      const { error } = await supabase.from('therapists').upsert(record, { onConflict: 'id' });
      if (error) { console.error(`\n✗ ${t.name}`); err++; }
      else { process.stdout.write(url ? '+' : 'n'); ins++; }
    } else {
      process.stdout.write(t.imgUrl ? '+' : 'n'); ins++;
    }
    await new Promise(r => setTimeout(r, 250));
  }
  console.log(`\n\n=== 完了 ===`);
  console.log(`挿入: ${ins} / スキップ: ${skp} / エラー: ${err}`);
}

main().catch(console.error);
