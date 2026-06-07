/**
 * 星月（笹塚ルーム）登録スクリプト
 * shop + therapists 54名 + Supabase Storage画像アップロード
 * 実行: node scripts/maintenance/process_hoshizuki_sasazuka.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const isDryRun = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');

const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const SHOP_ID = 'tokyo_shibuya_sasazuka_hoshizuki';
const BASE_IMG = 'https://hoshi-zuki.com/manage/image/up/';
const SHOP_IMG = 'https://hoshi-zuki.com/images/logo_mv.jpg';
const BUCKET = 'therapist-images';

const SHOP = {
  id: SHOP_ID,
  name: '星月 (笹塚ルーム)',
  website_url: 'https://hoshi-zuki.com',
  schedule_url: 'https://hoshi-zuki.com/schedule.html',
  image_url: SHOP_IMG,
  phone_number: '080-6104-4571',
  business_hours: '11:00 - 翌5:00',
  price_system: '60分 14,000円 / 70分 19,000円（仰向け） / 90分 19,000円 / 120分 24,000円 / 150分 29,000円 / 180分 34,000円 ※指名料1,000円',
  raw_data: {
    prefecture: '東京都',
    city: '渋谷区',
    area: '笹塚',
    address: '東京都渋谷区笹塚１丁目（笹塚駅徒歩5分）',
  },
};

const THERAPISTS = [
  { name: 'なみ',     age: 24, file: '20260421122044_550400000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'ゆう',     age: 23, file: '20241022171250_cast_thumb_0_w500xh750.jpg' },
  { name: 'さやか',   age: 22, file: '20241022172249_cast_thumb_0_w500xh750.jpg' },
  { name: 'まや',     age: 25, file: '20241022175522_cast_thumb_0_w500xh750.jpg' },
  { name: 'かなえ',   age: 21, file: '20241022181145_cast_thumb_0_w500xh750.jpg' },
  { name: 'まな',     age: 22, file: '20241022181450_cast_thumb_0_w500xh750.jpg' },
  { name: 'あずさ',   age: 24, file: '20241023210219_cast_thumb_0_w500xh750.jpg' },
  { name: 'のぞみ',   age: 26, file: '20241023213136_cast_thumb_0_w500xh750.jpg' },
  { name: 'まり',     age: 25, file: '20241023213630_cast_thumb_0_w500xh750.jpg' },
  { name: 'はるな',   age: 19, file: '20241026203532_cast_thumb_0_w500xh750.jpg' },
  { name: 'なな',     age: 23, file: '20241208220741_1071500000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'えりか',   age: 23, file: '20241216145208_7151600000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'もも',     age: 28, file: '20241219203359_6781200000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'りり',     age: 28, file: '20241221204716_4432500000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'あんな',   age: 22, file: '20241229220531_7862000000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'せり',     age: 22, file: '20241230164119_9575700000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'まい',     age: 25, file: '20250107113820_1792600000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'うらら',   age: 22, file: '20250209131329_1235000000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'みな',     age: 27, file: '20250224165638_6510900000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'なぎ',     age: 22, file: '20250220043931_1671800000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'みか',     age: 18, file: '20250301050402_4601400000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'まりあ',   age: 25, file: '20250310194654_8331600000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'あんり',   age: 22, file: '20250314011558_5804100000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'ひなた',   age: 24, file: '20250323160019_4761600000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'ゆな',     age: 22, file: '20250326023414_440200000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'ひめか',   age: 23, file: '20250328200640_7486200000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'ゆみ',     age: 27, file: '20250503181112_7446400000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'まりな',   age: 27, file: '20250803134829_5028200000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'ゆい',     age: 27, file: '20250806225528_2558200000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'みう',     age: 21, file: '20250831182003_8057000000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'ゆいな',   age: 24, file: '20250910043757_3478100000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'さや',     age: 23, file: '20251029123838_831900000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'りさ',     age: 24, file: '20251110214242_1598600000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'ひな',     age: 24, file: '20251206102449_1872100000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'さとみ',   age: 27, file: '20251215100605_2366900000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'あすか',   age: 19, file: '20251217220651_9189000000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: '天音 ほの', age: 22, file: '20251220203328_1883800000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'りあ',     age: 25, file: '20251229140500_7028500000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'さく',     age: 20, file: '20260104213733_9329700000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'しおん',   age: 19, file: '20260120233952_7154700000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'ゆず',     age: 20, file: '20260228052148_3229400000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'めい',     age: 24, file: '20260226174350_8024200000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'ももな',   age: 23, file: '20260303204224_5109700000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'はづき',   age: 28, file: '20260310035733_8032100000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'のあ',     age: 20, file: '20260316045024_5685600000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'ゆきね',   age: 28, file: '20260320040227_8217400000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'かりな',   age: 20, file: '20260408221353_8619100000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'せいら',   age: 27, file: '20260413234704_3729500000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'れいな',   age: 24, file: '20260420182750_7215700000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'みら',     age: 23, file: '20260421211130_2535600000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'しん',     age: 29, file: '20260511134155_9057300000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'みなみ',   age: 25, file: '20260512155101_9470200000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'るな',     age: 22, file: '20260517083712_1634000000_cast_subphoto_img_url_0_w500xh750.jpg' },
  { name: 'ゆり',     age: 22, file: '20260517160641_8565400000_cast_subphoto_img_url_0_w500xh750.jpg' },
];

async function uploadImage(filename, originalUrl) {
  const storagePath = `hoshizuki_${filename}`;
  // 既存確認
  const { data: existing } = await supabase.storage.from(BUCKET).list('', { search: storagePath });
  if (existing?.some(f => f.name === storagePath)) {
    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    return publicUrl;
  }
  // fetch & upload
  const res = await fetch(originalUrl, { headers: { Referer: 'https://hoshi-zuki.com/' } });
  if (!res.ok) return null;
  const buf = await res.arrayBuffer();
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buf, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) { console.error(`  upload error: ${error.message}`); return null; }
  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return publicUrl;
}

async function main() {
  console.log(`${isDryRun ? '[DRY-RUN] ' : ''}星月 笹塚ルーム 登録開始`);

  // --- 1. Shop upsert ---
  console.log(`\n[SHOP] ${SHOP.name}`);
  if (!isDryRun) {
    const { error } = await supabase.from('shops').upsert(SHOP);
    if (error) { console.error('  shop error:', error.message); return; }
    console.log('  → OK');
  } else {
    console.log('  → (dry-run skip)');
  }

  // --- 2. Therapists ---
  console.log(`\n[THERAPISTS] ${THERAPISTS.length}名`);
  let ok = 0, skip = 0, fail = 0;

  for (const t of THERAPISTS) {
    const therapistId = `${SHOP_ID}_${t.name}`;
    const imgUrl = BASE_IMG + t.file;

    if (isDryRun) {
      console.log(`  [dry] ${t.name}(${t.age}) → ${therapistId}`);
      continue;
    }

    // 既存チェック
    const { data: existing } = await supabase.from('therapists').select('id,image_url').eq('id', therapistId).single();
    if (existing) {
      process.stdout.write(`  = ${t.name} (既存)\n`);
      skip++;
      continue;
    }

    // 画像アップロード
    process.stdout.write(`  + ${t.name}(${t.age}) 画像アップロード中...`);
    const storedUrl = await uploadImage(t.file, imgUrl);
    process.stdout.write(storedUrl ? ' OK\n' : ' 失敗(null登録)\n');

    const { error } = await supabase.from('therapists').insert({
      id: therapistId,
      shop_id: SHOP_ID,
      name: t.name,
      image_url: storedUrl,
      raw_data: { age: t.age },
    });

    if (error) { console.error(`  ! insert error: ${error.message}`); fail++; }
    else ok++;

    await new Promise(r => setTimeout(r, 300)); // rate limit
  }

  console.log(`\n完了: 登録${ok}件 / スキップ${skip}件 / 失敗${fail}件`);
}

main().catch(console.error);
