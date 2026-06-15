/**
 * Fix: Fruit in the room — 10名 登録 (prof/{id}/top.jpg パターン)
 * 実行: node scripts/maintenance/fix_shizuoka_fruit.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const isDryRun = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const SHOP_ID = 'shizuoka_shizuoka_fruit_in_the_room';
const BASE_URL = 'https://www.fruitszok.com';

// 10 therapists collected from Chrome
const THERAPISTS = [
  { name: 'もえ',      profId: '89' },
  { name: '涼音',      profId: '88' },
  { name: '理加子',    profId: '87' },
  { name: '有希',      profId: '84' },
  { name: '杏奈',      profId: '83' },
  { name: 'せいら',    profId: '82' },
  { name: '美鈴',      profId: '81' },
  { name: '花',        profId: '80' },
  { name: '美紀',      profId: '77' },
  { name: '栞奈(かんな)', profId: '61' },
];

async function uploadImage(url, fileKey) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': BASE_URL + '/',
      }
    });
    if (!res.ok) {
      console.log(`  ⚠️ fetch failed: ${res.status} ${url}`);
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = url.split('.').pop().split('?')[0] || 'jpg';
    const path = `${fileKey}.${ext}`;
    const { error } = await supabase.storage
      .from('therapist-images')
      .upload(path, buf, { contentType: `image/${ext}`, upsert: true });
    if (error) {
      console.log(`  ⚠️ storage error: ${error.message}`);
      return null;
    }
    const { data: { publicUrl } } = supabase.storage.from('therapist-images').getPublicUrl(path);
    return publicUrl;
  } catch (e) {
    console.log(`  ⚠️ upload error: ${e.message}`);
    return null;
  }
}

async function main() {
  console.log(`🍑 Fruit in the room 登録 (${isDryRun ? 'DRY RUN' : '本実行'})`);

  // Check existing
  const { data: existing } = await supabase
    .from('therapists')
    .select('id, name, image_url')
    .eq('shop_id', SHOP_ID);
  const existingNames = new Set((existing || []).map(t => t.name));
  console.log(`既存: ${existingNames.size}名`);

  for (const t of THERAPISTS) {
    const imgUrl = `${BASE_URL}/prof/${t.profId}/top.jpg`;
    const fileKey = `fruit_${t.profId}`;
    const id = `${SHOP_ID}_${t.name}`;

    if (existingNames.has(t.name)) {
      console.log(`  = ${t.name} (既存スキップ)`);
      continue;
    }

    console.log(`  + ${t.name} (prof${t.profId})`);
    if (isDryRun) continue;

    const storageUrl = await uploadImage(imgUrl, fileKey);
    console.log(`    画像: ${storageUrl ? '✅' : '❌ null'}`);

    const { error } = await supabase.from('therapists').upsert({
      id,
      shop_id: SHOP_ID,
      name: t.name,
      image_url: storageUrl,
    });
    if (error) console.log(`    DBエラー: ${error.message}`);
  }

  console.log('✅ 完了');
}

main().catch(console.error);
