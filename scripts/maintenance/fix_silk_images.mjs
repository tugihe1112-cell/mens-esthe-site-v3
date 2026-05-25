/**
 * Silk (シルク) セラピスト写真修正
 * alt="〇〇さんの写真" + background-image パターン
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const isDryRun = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BASE = 'http://www.ms-silk.tokyo';
const SHOP_ID = 'tokyo_shibuya_silk';

// サイトからデータ取得
const res = await fetch(`${BASE}/staff/`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
const html = await res.text();

const sitePairs = [...html.matchAll(/style="background-image:\s*url\(([^)]+)\)"[^>]*alt="([^"]+)"/gi)]
  .map(m => ({
    img: BASE + m[1].replace(/['"]/g, ''),
    // "〇〇さんの写真" → "〇〇"
    name: m[2].trim().replace(/さんの写真$/, '').trim()
  }));

console.log(`サイトから取得: ${sitePairs.length}名\n`);

// DBのセラピスト取得
const { data: therapists } = await supabase
  .from('therapists')
  .select('id, name, image_url')
  .eq('shop_id', SHOP_ID);

let updated = 0, notFound = 0, skipped = 0;

for (const { name, img } of sitePairs) {
  // DB名と照合（完全一致 or スペース除去）
  const match = therapists?.find(t =>
    t.name === name ||
    t.name?.replace(/\s/g, '') === name.replace(/\s/g, '')
  );

  if (!match) {
    console.log(`? DB未登録: ${name}`);
    notFound++;
    continue;
  }

  // spacer または null の場合のみ更新
  const isSpacer = match.image_url?.includes('spacer');
  if (match.image_url && !isSpacer) {
    console.log(`= スキップ（既に写真あり）: ${name}`);
    skipped++;
    continue;
  }

  console.log(`${isDryRun ? '[DRY]' : '✅'} ${name} → ${img}`);
  if (!isDryRun) {
    const { error } = await supabase
      .from('therapists')
      .update({ image_url: img })
      .eq('id', match.id);
    if (error) console.error(`  ERROR: ${error.message}`);
  }
  updated++;
}

console.log(`\n更新: ${updated}件, 未照合: ${notFound}件, スキップ: ${skipped}件`);
