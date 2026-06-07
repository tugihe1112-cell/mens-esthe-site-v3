/**
 * CIEL SPA (ciel-spa.com) — 渋谷 shop & therapist 登録スクリプト
 * 画像URL: http://ciel-spa.com/photos/{lid}/main_{lid}.jpg（予測可能）
 *
 * 実行:
 *   node scripts/maintenance/process_ciel_spa.mjs --dry-run
 *   node scripts/maintenance/process_ciel_spa.mjs
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const DRY_RUN = process.argv.includes('--dry-run');
const BASE = 'http://ciel-spa.com';
const SHOP_ID = 'tokyo_shibuya_shibuya_ciel_spa';

// /girl ページから取得した全セラピスト（lid → name）
const THERAPISTS = [
  { lid: 343, name: 'まつり' },
  { lid: 342, name: 'まな' },
  { lid: 341, name: 'かな' },
  { lid: 339, name: 'あやね' },
  { lid: 338, name: 'ゆかり' },
  { lid: 336, name: 'みく' },
  { lid: 335, name: 'りこ' },
  { lid: 333, name: 'まなみ' },
  { lid: 332, name: 'きこ' },
  { lid: 329, name: 'うみか' },
  { lid: 328, name: 'りん' },
  { lid: 326, name: 'かのん' },
  { lid: 325, name: 'せな' },
  { lid: 324, name: 'なの' },
  { lid: 323, name: 'れの' },
  { lid: 322, name: 'ののん' },
  { lid: 321, name: 'もえな' },
  { lid: 320, name: 'にいな' },
  { lid: 318, name: 'みら' },
  { lid: 317, name: 'みお' },
  { lid: 316, name: 'すずね' },
  { lid: 315, name: 'みか' },
  { lid: 312, name: 'ひより' },
  { lid: 311, name: 'なな' },
  { lid: 308, name: 'ゆあ' },
  { lid: 305, name: 'めいさ' },
  { lid: 303, name: 'れおな' },
  { lid: 301, name: 'ひなの' },
  { lid: 299, name: 'かりん' },
  { lid: 295, name: 'りな' },
  { lid: 293, name: 'れな' },
  { lid: 292, name: 'あお' },
  { lid: 291, name: 'らら' },
  { lid: 290, name: 'じゅんな' },
  { lid: 289, name: 'ねいろ' },
  { lid: 288, name: 'みな' },
  { lid: 273, name: 'さくら' },
  { lid: 272, name: 'ここ' },
  { lid: 270, name: 'おみ' },
  { lid: 268, name: 'れん' },
  { lid: 266, name: 'ゆずか' },
  { lid: 265, name: 'もあ' },
  { lid: 261, name: 'みふゆ' },
  { lid: 258, name: 'みのり' },
  { lid: 256, name: 'しのん' },
  { lid: 255, name: 'ほのか' },
  { lid: 254, name: 'ちよ' },
  { lid: 253, name: 'こと' },
  { lid: 252, name: 'あむ' },
  { lid: 249, name: 'きょう' },
  { lid: 248, name: 'あんな' },
  { lid: 247, name: 'れい' },
  { lid: 245, name: 'まろん' },
  { lid: 241, name: 'りく' },
  { lid: 240, name: 'あきほ' },
  { lid: 239, name: 'ひなた' },
  { lid: 238, name: 'あやな' },
  { lid: 235, name: 'えりさ' },
  { lid: 232, name: 'かこ' },
  { lid: 231, name: 'ゆい' },
  { lid: 230, name: 'りさ' },
  { lid: 229, name: 'ゆゆ' },
  { lid: 226, name: 'さえ' },
  { lid: 225, name: 'ななさ' },
  { lid: 218, name: 'かおる' },
  { lid: 217, name: 'るな' },
  { lid: 216, name: 'つばさ' },
  { lid: 213, name: 'ももこ' },
  { lid: 212, name: 'まゆ' },
  { lid: 211, name: 'みい' },
  { lid: 210, name: 'あやか' },
  { lid: 209, name: 'さと' },
  { lid: 208, name: 'うみ' },
  { lid: 206, name: 'ゆいか' },
  { lid: 204, name: 'のん' },
  { lid: 203, name: 'のの' },
  { lid: 200, name: 'きき' },
  { lid: 199, name: 'らな' },
  { lid: 198, name: 'なお' },
  { lid: 197, name: 'みみ' },
  { lid: 196, name: 'もも' },
  { lid: 194, name: 'ならか' },
  { lid: 191, name: 'ゆうり' },
  { lid: 190, name: 'しょう' },
  { lid: 189, name: 'ここみ' },
  { lid: 188, name: 'ことり' },
  { lid: 187, name: 'こあら' },
  { lid: 183, name: 'せいか' },
  { lid: 179, name: 'なぎさ' },
  { lid: 177, name: 'はる' },
  { lid: 175, name: 'あん' },
  { lid: 172, name: 'みやび' },
  { lid: 171, name: 'ふみか' },
  { lid: 170, name: 'めめ' },
  { lid: 169, name: 'かなこ' },
  { lid: 165, name: 'ありさ' },
  { lid: 163, name: 'ひめ' },
  { lid: 161, name: 'はるき' },
  { lid: 160, name: 'るる' },
  { lid: 159, name: 'かほ' },
  { lid: 158, name: 'りせ' },
  { lid: 157, name: 'ちさき' },
  { lid: 156, name: 'あかり' },
  { lid: 152, name: 'あき' },
  { lid: 151, name: 'みり' },
  { lid: 148, name: 'みき' },
  { lid: 147, name: 'みこと' },
  { lid: 146, name: 'みりあ' },
  { lid: 145, name: 'まりな' },
  { lid: 143, name: 'やよい' },
  { lid: 140, name: 'なみ' },
  { lid: 137, name: 'あゆみ' },
  { lid: 135, name: 'みあ' },
  { lid: 134, name: 'みなみ' },
  { lid: 133, name: 'あおい' },
  { lid: 132, name: 'るい' },
  { lid: 124, name: 'じゅり' },
  { lid: 120, name: 'もえ' },
  { lid: 119, name: 'らん' },
  { lid: 115, name: 'れいな' },
  { lid: 113, name: 'ゆみ' },
  { lid: 112, name: 'みひろ' },
];

async function uploadImage(imageUrl, lid) {
  try {
    const res = await fetch(imageUrl, {
      headers: { Referer: BASE, 'User-Agent': 'Mozilla/5.0' }
    });
    if (!res.ok) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    const fileName = `cielspa_${lid}.jpg`;

    const { error } = await supabase.storage
      .from('therapist-images')
      .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: true });

    if (error) { console.error(`  storage error:`, error.message); return null; }

    const { data } = supabase.storage.from('therapist-images').getPublicUrl(fileName);
    return data.publicUrl;
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log(`=== CIEL SPA 登録スクリプト (DRY_RUN=${DRY_RUN}) ===`);
  console.log(`対象: ${THERAPISTS.length}名\n`);

  // 1. shop 登録
  const shopData = {
    id: SHOP_ID,
    name: 'CIEL SPA (シエルスパ)',
    website_url: `${BASE}/`,
    schedule_url: `${BASE}/schedule`,
    image_url: 'http://ciel-spa.com/banners/therapist.jpg',
    raw_data: { prefecture: '東京都', area: '渋谷' },
  };

  if (!DRY_RUN) {
    const { error } = await supabase.from('shops').upsert(shopData, { onConflict: 'id' });
    if (error) console.error('Shop upsert error:', error.message);
    else console.log(`✅ Shop: ${SHOP_ID}`);
  } else {
    console.log(`[DRY] Shop: ${shopData.name}`);
  }

  // 2. therapists 登録
  let inserted = 0, skipped = 0, errors = 0;

  for (const t of THERAPISTS) {
    const therapistId = `${SHOP_ID}_${t.name}`;

    const { data: existing } = await supabase
      .from('therapists').select('id, image_url').eq('id', therapistId).single();

    if (existing?.image_url) {
      process.stdout.write(`= `);
      skipped++;
      continue;
    }

    const imageUrl = `${BASE}/photos/${t.lid}/main_${t.lid}.jpg`;
    let storageUrl = null;

    if (!DRY_RUN) {
      storageUrl = await uploadImage(imageUrl, t.lid);
    } else {
      storageUrl = imageUrl;
    }

    const record = {
      id: therapistId,
      shop_id: SHOP_ID,
      name: t.name,
      image_url: storageUrl,
    };

    if (!DRY_RUN) {
      const { error } = await supabase.from('therapists').upsert(record, { onConflict: 'id' });
      if (error) { console.error(`\n✗ ${t.name}:`, error.message); errors++; }
      else { process.stdout.write(`+`); inserted++; }
    } else {
      process.stdout.write(`+`);
      inserted++;
    }

    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n\n=== 完了 ===`);
  console.log(`挿入: ${inserted} / スキップ: ${skipped} / エラー: ${errors}`);
}

main().catch(console.error);
