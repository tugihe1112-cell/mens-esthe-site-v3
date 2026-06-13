/**
 * check_duplicate_images.mjs
 *
 * 「被り写真バグ」全店舗スキャン
 *
 * 同一 shop_id 内で異なる名前のセラピストが同じ image_url を持つケースを検出。
 * DB は変更しない（確認専用）。
 *
 * 使い方:
 *   node scripts/debug/check_duplicate_images.mjs
 *   node scripts/debug/check_duplicate_images.mjs | grep "被り"   # 件数だけ見る
 *
 * 修正が必要なケースが見つかったら:
 *   対象 shop_id 専用の fix スクリプトを作成して null 化する。
 *   （fix_koakuma_duplicate_images.mjs を参考に）
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');

const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// Storage URL かどうか（azuetkuzzmshqfbrhqmf.supabase.co/storage/）
const isStorageUrl = (url) => url && url.includes('supabase.co/storage/');

async function main() {
  console.log('=== 被り写真バグ 全店舗スキャン ===\n');
  console.log('取得中...');

  // 全セラピスト（image_url あり）を取得 — ページネーション対応
  let all = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('therapists')
      .select('id, name, shop_id, image_url')
      .not('image_url', 'is', null)
      .range(from, from + PAGE - 1);
    if (error) { console.error(error); process.exit(1); }
    all = all.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  console.log(`合計: ${all.length} 名（image_url あり）\n`);

  // Storage URL のみ対象（外部CDNの同一URLは別途管理されているため除外）
  const storageOnly = all.filter(t => isStorageUrl(t.image_url));
  console.log(`Storage URL 対象: ${storageOnly.length} 名\n`);

  // shop_id × image_url でグループ化
  const urlMap = {};
  for (const t of storageOnly) {
    const key = `${t.shop_id}::${t.image_url}`;
    if (!urlMap[key]) urlMap[key] = [];
    urlMap[key].push(t);
  }

  // 2名以上が同じURLを持つグループを抽出
  const dupes = Object.values(urlMap).filter(g => g.length > 1);

  if (dupes.length === 0) {
    console.log('✅ 被り写真は検出されませんでした。');
    return;
  }

  // shop_id ごとに集計
  const byShop = {};
  for (const group of dupes) {
    const sid = group[0].shop_id;
    if (!byShop[sid]) byShop[sid] = { groups: 0, therapists: 0 };
    byShop[sid].groups++;
    byShop[sid].therapists += group.length;
  }

  console.log(`⚠️  被り写真グループ: ${dupes.length} 件（${dupes.reduce((s, g) => s + g.length, 0)} 名に影響）\n`);

  // 店舗別サマリー
  console.log('【店舗別サマリー】');
  for (const [shopId, stats] of Object.entries(byShop)) {
    console.log(`  ${shopId}`);
    console.log(`    被りグループ: ${stats.groups} 件 / 影響セラピスト: ${stats.therapists} 名`);
  }

  // 詳細
  console.log('\n【詳細】');
  for (const group of dupes) {
    const names = group.map(t => t.name).join('  /  ');
    console.log(`  [${group[0].shop_id}]`);
    console.log(`    名前: ${names}`);
    console.log(`    URL:  ...${group[0].image_url.slice(-50)}`);
  }

  console.log('\n修正方法: fix_koakuma_duplicate_images.mjs を参考に shop_id 専用 fix スクリプトを作成して null 化する。');
}

main();
