/**
 * Silk 写真衝突バグ修正
 * 正しい名前→URL対応をハードコードして再アップロード
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim();
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY'));
const BUCKET = 'therapist-images';
const BASE = 'http://www.ms-silk.tokyo/images/';
const DRY_RUN = process.argv.includes('--dry-run');

const MAP = [
  ['白石せいな', 'ml_11_1_7123.JPG'],
  ['今井かほ',   'ml_11_1_8617.JPG'],
  ['篠宮ゆかり', 'ml_11_1_10006.JPG'],
  ['一宮こころ', 'ml_11_1_7119.JPG'],
  ['浜崎あん',   'ml_11_1_8652.JPG'],
  ['一条りり',   'ml_11_1_7136.JPG'],
  ['伊藤ひかり', 'ml_11_1_9370.JPG'],
  ['北野りん',   'ml_11_1_8764.JPG'],
  ['木倉しずく', 'ml_11_1_10041.JPG'],
  ['吉岡えみ',   'ml_11_1_7804.jpeg'],
  ['井上まなみ', 'ml_11_1_10033.JPG'],
  ['森かれん',   'ml_11_1_7116.JPG'],
  ['立花しおん', 'ml_11_1_9866.JPG'],
  ['猫宮るい',   'ml_11_1_10473.jpg'],
  ['籠乃ことり', 'ml_11_1_10405.jpg'],
  ['佐藤はるみ', 'ml_11_1_9913.JPG'],
  ['宮本るな',   'ml_11_1_10376.jpeg'],
  ['綾瀬めい',   'ml_11_1_7166.JPG'],
  ['永井さつき', 'ml_11_1_7156.JPG'],
  ['秋元ちはる', 'ml_11_1_10083.JPG'],
  ['加藤らん',   'ml_11_1_8862.jpg'],
  ['小嶋あかり', 'ml_11_1_10024.JPG'],
  ['浜辺ゆあ',   'ml_11_1_10435.jpg'],
  ['秋山しほ',   'ml_11_1_10512.jpg'],
  ['桃瀬あい',   'ml_11_1_8551.JPG'],
  ['木田まりあ', 'ml_11_1_10539.jpg'],
  ['榮倉ななみ', 'ml_11_1_10057.jpg'],
  ['水原ももか', 'ml_11_1_8737.JPG'],
  ['葉山ゆうな', 'ml_11_1_7132.jpg'],
  ['中条りか',   'ml_11_1_10397.jpg'],
  ['桃井ほのか', 'ml_11_1_10545.jpg'],
];

async function uploadImage(imageUrl, fileName) {
  const res = await fetch(imageUrl, {
    headers: {
      'Referer': 'http://www.ms-silk.tokyo/',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    }
  });
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const ext = fileName.split('.').pop().toLowerCase();
  const storageFileName = `silk_${fileName.toLowerCase()}`;

  const { error } = await supabase.storage.from(BUCKET).upload(storageFileName, buffer, {
    contentType: `image/${ext === 'jpg' || ext === 'jpeg' ? 'jpeg' : ext}`,
    upsert: true,
  });
  if (error) throw new Error(`upload failed: ${error.message}`);

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storageFileName);
  return publicUrl;
}

async function main() {
  console.log(DRY_RUN ? '=== DRY RUN ===' : '=== 本実行 ===');
  let ok = 0, fail = 0;

  for (const [name, file] of MAP) {
    const imageUrl = BASE + file;
    if (DRY_RUN) {
      console.log(`[DRY] ${name} → silk_${file.toLowerCase()}`);
      continue;
    }
    try {
      const newUrl = await uploadImage(imageUrl, file);
      const { error } = await supabase
        .from('therapists')
        .update({ image_url: newUrl })
        .ilike('shop_id', '%silk%')
        .eq('name', name);
      if (error) throw error;
      console.log(`✅ ${name}`);
      ok++;
      await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      console.log(`❌ ${name}: ${e.message}`);
      fail++;
    }
  }
  console.log(`\n完了: ${ok}件成功 / ${fail}件失敗`);
}

main();
