/**
 * AROMA No5 (アロマファイブ) セラピスト登録スクリプト
 * Wixサイトのため写真なし、名前のみ登録
 * 名前はWixのテキストから事前抽出済み（ゼロ幅スペース除去済み）
 *
 * 実行: node scripts/maintenance/process_aroma_no5.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

if (DRY_RUN) console.log('[DRY RUN]\n');

const SHOP_ID = 'miyagi_sendai_aroma_no5';

// ゼロ幅スペース（U+200B）を除去して正規化した名前リスト
const RAW_NAMES = [
  '常盤', '廣野', '新井', '西野', '水原', '池田', '益若',
  '花乃井(はなのい)', '磯山', '悠亜', '相武(あいぶ)', '松嶋',
  '蒼衣', '比嘉(ひが)', '重盛', '音無', '二階堂', '峰（みね）',
  '桐谷', '久保', '武井', '幸村（ゆきむら）', '早乙女', '賀喜（かき）',
];

// ゼロ幅スペース除去 + 正規化
const NAMES = RAW_NAMES.map(n => n.replace(/[​‌‍﻿]/g, '').trim()).filter(n => n.length > 0);

console.log(`登録予定: ${NAMES.length}名`);
if (DRY_RUN) {
  NAMES.forEach((n, i) => console.log(`  [${i+1}] ${n}`));
  process.exit(0);
}

// 既存確認
const { count: existing } = await supabase
  .from('therapists').select('id', { count: 'exact', head: true }).eq('shop_id', SHOP_ID);
console.log(`既存: ${existing}名`);

let inserted = 0, errors = 0;
for (const name of NAMES) {
  const id = `${SHOP_ID}_${name}`;
  const { error } = await supabase.from('therapists').upsert({
    id,
    shop_id: SHOP_ID,
    name,
    image_url: null,
  }, { onConflict: 'id' });

  if (error) { console.error(`❌ ${name}: ${error.message}`); errors++; }
  else        { console.log(`✅ ${name}`); inserted++; }
}

console.log(`\n完了: 挿入/更新 ${inserted}名, エラー ${errors}名`);
