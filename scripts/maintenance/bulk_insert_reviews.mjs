/**
 * クチコミ バルクインサート スクリプト
 * 実行: node scripts/maintenance/bulk_insert_reviews.mjs [--dry-run]
 *
 * REVIEWS 配列にデータを追加して実行するだけ。
 * 1000件単位でバッチ処理するので数千件でも問題なし。
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const isDryRun = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

if (isDryRun) console.log('=== DRY RUN ===\n');

// ============================================================
// ここにクチコミデータを追加していく
// ============================================================
const REVIEWS = [
  {
    // --- 必須 ---
    shop_id: 'tokyo_toshima_ikebukuro_aromamore',   // shops.id
    shop_name: 'AROMA more (アロマモア)',
    rating: 4.8,
    content: `【入店】\n駅近の雑居ビルで隠れ家感があります。受付の対応も丁寧でした。\n\n【ご対面】\n写真通りの美人さん。身長高めでスタイル抜群。\n\n【施術】\nオイルマッサージの技術が高く、力加減も絶妙。密着タイムも最高でした。\n\n【総評】\n文句なしのリピート確定。また来ます。`,

    // --- 任意（あれば詳細になる）---
    therapist_id: 'tokyo_toshima_ikebukuro_aromamore_さな',  // therapists.id
    therapist_name: 'さな',
    user_name: 'ゴロンまる',
    user_id: null,   // 会員IDがあれば。なければ null でOK
    course: '90分 19,000円',
    detailed_ratings: {
      cleanliness: 5,
      looks: 5,
      style: 5,
      service: 5,
      massage: 4,
      intimacy: 5,
    },
    tags: ['美人系', 'スレンダー', 'お姉さん系', '巨乳', '高身長'],
    created_at: '2024-02-13T18:00:00Z',  // 省略すると自動で現在時刻
  },

  // ↓ ここに追加していく
  // {
  //   shop_id: '...',
  //   shop_name: '...',
  //   rating: 4.5,
  //   content: '...',
  //   therapist_name: '...',
  //   user_name: '...',
  //   course: '...',
  //   detailed_ratings: { cleanliness:5, looks:5, style:5, service:5, massage:5, intimacy:5 },
  //   tags: [],
  // },
];

// ============================================================
// 以下は変更不要
// ============================================================

// IDを自動生成してバッチ処理
const BATCH_SIZE = 1000;

const withIds = REVIEWS.map((r, i) => ({
  ...r,
  id: `r_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`,
  user_id: r.user_id || 'admin',  // null/未設定の場合は 'admin' をデフォルトに
}));

console.log(`投入予定: ${withIds.length}件`);

if (isDryRun) {
  console.log('\n[DRY RUN] サンプル（1件目）:');
  console.log(JSON.stringify(withIds[0], null, 2));
  process.exit(0);
}

let inserted = 0;
let errors = 0;

for (let i = 0; i < withIds.length; i += BATCH_SIZE) {
  const batch = withIds.slice(i, i + BATCH_SIZE);
  const { error } = await supabase.from('reviews').insert(batch);

  if (error) {
    console.error(`❌ バッチ ${Math.floor(i / BATCH_SIZE) + 1} エラー:`, error.message);
    errors++;
  } else {
    inserted += batch.length;
    console.log(`✅ ${inserted}件 挿入完了`);
  }
}

console.log(`\n完了: ${inserted}件成功 / ${errors}件エラー`);
