/**
 * 銀座一兆 (ginza-itcho.com) — shop & therapist 登録スクリプト
 *
 * 実行:
 *   node scripts/maintenance/process_ginzaitcho.mjs --dry-run
 *   node scripts/maintenance/process_ginzaitcho.mjs
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const DRY_RUN = process.argv.includes('--dry-run');
const BASE = 'https://ginza-itcho.com';
const SHOP_ID = 'tokyo_chuo_ginza_itcho';

// staff.php から取得した全セラピスト (sid=20「本日の受付時間」はノイズのため除外)
const THERAPISTS = [
  { sid: 91, name: '新藤' },
  { sid: 90, name: '桃瀬' },
  { sid: 88, name: '八神' },
  { sid: 87, name: '嘉山' },
  { sid: 86, name: '二宮' },
  { sid: 82, name: '中田' },
  { sid: 80, name: '高市' },
  { sid: 76, name: '日高' },
  { sid: 78, name: '紀井' },
  { sid: 75, name: '道本' },
  { sid: 70, name: '一色' },
  { sid: 68, name: '小松' },
  { sid: 67, name: '野間口' },
  { sid: 62, name: '蓮水' },
  { sid: 60, name: '江國' },
  { sid: 52, name: '加門' },
  { sid: 51, name: '平子' },
  { sid: 49, name: '出羽' },
  { sid: 42, name: '武藤' },
  { sid: 37, name: '天海' },
  { sid: 30, name: '元宮' },
  { sid: 23, name: '青波' },
  { sid: 14, name: '春木' },
];

// プロフィールページから画像URLを取得
async function fetchImageUrl(sid) {
  try {
    const res = await fetch(`${BASE}/profile.php?sid=${sid}`, {
      headers: { Referer: BASE, 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await res.text();
    // パターン: /images_staff/{sid}/{filename}.jpeg
    const match = html.match(/images_staff\/\d+\/([^"'\s]+\.(jpe?g|png|webp))/i);
    if (match) return `${BASE}/images_staff/${sid}/${match[1]}`;
    return null;
  } catch (e) {
    console.error(`  fetchImageUrl error (sid=${sid}):`, e.message);
    return null;
  }
}

// 画像を Supabase Storage にアップロード
async function uploadImage(imageUrl, sid) {
  try {
    const res = await fetch(imageUrl, {
      headers: { Referer: BASE, 'User-Agent': 'Mozilla/5.0' }
    });
    if (!res.ok) { console.error(`  fetch failed: ${res.status} ${imageUrl}`); return null; }

    const buffer = Buffer.from(await res.arrayBuffer());
    const basename = imageUrl.split('/').pop();
    const ext = basename.split('.').pop().toLowerCase();
    const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    // ファイル名: ginzaitcho_{sid}_{basename} (日本語を除去)
    const safeBasename = basename.replace(/[^\w.-]/g, '_');
    const fileName = `ginzaitcho_${sid}_${safeBasename}`;

    const { error } = await supabase.storage
      .from('therapist-images')
      .upload(fileName, buffer, { contentType, upsert: true });

    if (error) { console.error(`  storage upload error:`, error.message); return null; }

    const { data } = supabase.storage.from('therapist-images').getPublicUrl(fileName);
    return data.publicUrl;
  } catch (e) {
    console.error(`  uploadImage error:`, e.message);
    return null;
  }
}

async function main() {
  console.log(`=== 銀座一兆 登録スクリプト (DRY_RUN=${DRY_RUN}) ===\n`);

  // 1. shop 登録
  const shopData = {
    id: SHOP_ID,
    name: '銀座一兆 (ギンザイッチョウ)',
    website_url: `${BASE}/`,
    schedule_url: `${BASE}/schedule.php`,
    image_url: `${BASE}/images/mainvisual_01.jpg`,
    raw_data: { prefecture: '東京都', area: '銀座' },
  };

  if (!DRY_RUN) {
    const { error } = await supabase.from('shops').upsert(shopData, { onConflict: 'id' });
    if (error) console.error('Shop upsert error:', error.message);
    else console.log(`✅ Shop created: ${SHOP_ID}`);
  } else {
    console.log(`[DRY] Shop: ${JSON.stringify(shopData, null, 2)}`);
  }

  // 2. therapists 登録
  let inserted = 0, updated = 0, skipped = 0, errors = 0;

  for (const t of THERAPISTS) {
    const therapistId = `${SHOP_ID}_${t.name}`;

    // 既存チェック
    const { data: existing } = await supabase
      .from('therapists').select('id, image_url').eq('id', therapistId).single();

    if (existing?.image_url) {
      console.log(`= ${t.name} (既存・画像あり、スキップ)`);
      skipped++;
      continue;
    }

    // プロフィールページから画像URL取得
    process.stdout.write(`  Fetching ${t.name} (sid=${t.sid})... `);
    const imageUrl = await fetchImageUrl(t.sid);
    process.stdout.write(imageUrl ? `found\n` : `no image\n`);

    let storageUrl = null;
    if (imageUrl) {
      if (!DRY_RUN) {
        storageUrl = await uploadImage(imageUrl, t.sid);
        if (storageUrl) process.stdout.write(`    → uploaded ✓\n`);
      } else {
        console.log(`    [DRY] Would upload: ${imageUrl}`);
        storageUrl = imageUrl;
      }
    }

    const record = {
      id: therapistId,
      shop_id: SHOP_ID,
      name: t.name,
      image_url: storageUrl,
    };

    if (!DRY_RUN) {
      const { error } = await supabase.from('therapists').upsert(record, { onConflict: 'id' });
      if (error) { console.error(`  ✗ ${t.name}:`, error.message); errors++; }
      else {
        console.log(`  + ${t.name} → ${storageUrl ? '📷' : '(画像なし)'}`);
        existing ? updated++ : inserted++;
      }
    } else {
      console.log(`  [DRY] + ${t.name}: ${storageUrl ?? 'null'}`);
      inserted++;
    }

    await new Promise(r => setTimeout(r, 600)); // サーバー負荷対策
  }

  console.log(`\n=== 完了 ===`);
  console.log(`挿入: ${inserted} / 更新: ${updated} / スキップ: ${skipped} / エラー: ${errors}`);
}

main().catch(console.error);
