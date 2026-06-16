// http:// の画像URLを https:// に一括アップグレード（混合コンテンツ解消）
// PSI「HTTPSが使用されていません」対策。shops・therapists 両テーブルを対象。
//
// 実行: node scripts/maintenance/fix_http_images_to_https.mjs [--dry-run]
//
// ※ shops/therapists の UPDATE はRLSで anon key だとサイレント無効になるため
//    SUPABASE_SERVICE_ROLE_KEY を使用（.env に設定済みの想定）。

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SERVICE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ .env に VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が必要です');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const DRY = process.argv.includes('--dry-run');

async function fixTable(table) {
  // image_url が http:// で始まるものだけ取得（https:// はマッチしない）
  const { data, error } = await supabase
    .from(table)
    .select('id, name, image_url')
    .like('image_url', 'http://%');
  if (error) { console.error(`❌ ${table} 取得エラー:`, error.message); return; }

  console.log(`\n=== ${table}: http:// 画像 ${data.length} 件 ===`);
  let ok = 0, fail = 0;
  for (const row of data) {
    const fixed = row.image_url.replace(/^http:\/\//, 'https://');
    if (DRY) {
      console.log(`[dry] ${row.id} (${row.name || ''})\n   ${row.image_url}\n →  ${fixed}`);
      continue;
    }
    const { error: uErr } = await supabase.from(table).update({ image_url: fixed }).eq('id', row.id);
    if (uErr) { fail++; console.error(`❌ ${row.id}: ${uErr.message}`); }
    else { ok++; console.log(`✅ ${row.id} (${row.name || ''})`); }
  }
  if (!DRY) console.log(`→ ${table}: 更新 ${ok} / 失敗 ${fail}`);
}

(async () => {
  console.log(DRY ? '*** DRY RUN（DB変更なし）***' : '*** 本番実行 ***');
  await fixTable('shops');
  await fixTable('therapists');
  console.log('\n完了。');
})();
