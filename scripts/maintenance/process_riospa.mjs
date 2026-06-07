/**
 * RioSPA (riospa.tokyo) — 渋谷 shop & therapist 登録スクリプト
 * 画像URL: 各プロフィールページから取得（ランダムhash形式）
 *
 * 実行:
 *   node scripts/maintenance/process_riospa.mjs --dry-run
 *   node scripts/maintenance/process_riospa.mjs
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const DRY_RUN = process.argv.includes('--dry-run');
const BASE = 'https://www.riospa.tokyo';
const SHOP_ID = 'tokyo_shibuya_shibuya_riospa';

// therapist.html から取得した全セラピスト（no → name）
// プロモ枠（昼割・深夜割・新人割・脱毛コース等）は除外済み
const THERAPISTS = [
  { no: 11,  name: '七瀬るな' },
  { no: 65,  name: '若林しの' },
  { no: 158, name: '藤乃かな' },
  { no: 156, name: '葵井まこ' },
  { no: 90,  name: '成瀬みなみ' },
  { no: 97,  name: '花咲みゆ' },
  { no: 88,  name: '椿姫わかな' },
  { no: 13,  name: '三上まい' },
  { no: 169, name: '平瀬あいり' },
  { no: 127, name: '雪乃あずさ' },
  { no: 144, name: '相沢ノア' },
  { no: 69,  name: '黒崎あいら' },
  { no: 143, name: '一ノ瀬はづき' },
  { no: 47,  name: '望月りん' },
  { no: 32,  name: '白藤もも' },
  { no: 146, name: '胡桃ひな' },
  { no: 102, name: '葉月れん' },
  { no: 8,   name: '音瀬りの' },
  { no: 64,  name: '大原ひまり' },
  { no: 24,  name: '美月アリス' },
  { no: 165, name: '橘かほ' },
  { no: 122, name: '夏目すず' },
  { no: 108, name: '神楽あき' },
  { no: 147, name: '月城ゆい' },
  { no: 5,   name: '宝城すみれ' },
  { no: 12,  name: '宮城もえ' },
  { no: 154, name: '七海あいな' },
  { no: 41,  name: '川瀬みつき' },
  { no: 113, name: '小倉ゆな' },
  { no: 161, name: '綾瀬はるな' },
  { no: 132, name: '白星ラム' },
  { no: 9,   name: '夢咲みれい' },
  { no: 92,  name: '桃園あむ' },
  { no: 81,  name: '如月なぎさ' },
  { no: 75,  name: '一咲しずく' },
  { no: 34,  name: '西村ほのか' },
  { no: 48,  name: '春崎まな' },
  { no: 153, name: '高橋しほ' },
  { no: 166, name: '大空かりん' },
  { no: 60,  name: '鈴宮まり' },
  { no: 157, name: '明日花ゆあ' },
  { no: 30,  name: '御笠そら' },
  { no: 74,  name: '水城まりん' },
  { no: 155, name: '伊藤あかね' },
  { no: 55,  name: '冬月リア' },
  { no: 139, name: '朝日なゆ' },
  { no: 3,   name: '一条みゆ' },
  { no: 145, name: '赤木まや' },
  { no: 76,  name: '横田るな' },
  { no: 33,  name: '桐谷せな' },
  { no: 83,  name: '雅あかり' },
  { no: 77,  name: '向井りいさ' },
  { no: 38,  name: '木之本さくら' },
  { no: 79,  name: '星宮なつ' },
  { no: 63,  name: '星セイラ' },
];

// プロフィールページから画像URLを取得
async function fetchImageUrl(no) {
  try {
    const res = await fetch(`${BASE}/staff.html?no=${no}`, {
      headers: { Referer: BASE, 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await res.text();
    // パターン: <img src="/images/cast/{hash}.jpg"
    const match = html.match(/images\/cast\/([A-Za-z0-9]+)\.(jpe?g|png|webp)/i);
    if (match) return `${BASE}/images/cast/${match[1]}.${match[2]}`;
    return null;
  } catch (e) {
    return null;
  }
}

async function uploadImage(imageUrl, no) {
  try {
    const res = await fetch(imageUrl, {
      headers: { Referer: BASE, 'User-Agent': 'Mozilla/5.0' }
    });
    if (!res.ok) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    const hash = imageUrl.split('/').pop().split('.')[0];
    const fileName = `riospa_${no}_${hash}.jpg`;

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
  console.log(`=== RioSPA 登録スクリプト (DRY_RUN=${DRY_RUN}) ===`);
  console.log(`対象: ${THERAPISTS.length}名\n`);

  // 1. shop 登録
  const shopData = {
    id: SHOP_ID,
    name: 'RioSPA (リオスパ)',
    website_url: `${BASE}/`,
    schedule_url: `${BASE}/schedule.html`,
    image_url: `${BASE}/images/ogp.jpg`,
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
      process.stdout.write(`=`);
      skipped++;
      continue;
    }

    // プロフィールページから画像URL取得
    const imageUrl = await fetchImageUrl(t.no);
    let storageUrl = null;

    if (!DRY_RUN && imageUrl) {
      storageUrl = await uploadImage(imageUrl, t.no);
    } else if (DRY_RUN) {
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
      else { process.stdout.write(storageUrl ? '+' : 'n'); inserted++; }
    } else {
      process.stdout.write(imageUrl ? '+' : 'n');
      inserted++;
    }

    await new Promise(r => setTimeout(r, 600)); // プロフィールページfetch + Storageアップロードで余裕を持つ
  }

  console.log(`\n\n=== 完了 ===`);
  console.log(`挿入: ${inserted} / スキップ: ${skipped} / エラー: ${errors}`);
  console.log('凡例: + 画像あり / n 画像なし / = スキップ');
}

main().catch(console.error);
