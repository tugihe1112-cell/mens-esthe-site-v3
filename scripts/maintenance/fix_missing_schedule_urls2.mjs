/**
 * schedule_url 未設定の残り店舗 - 複数パターンで自動探索
 * 実行: node scripts/maintenance/fix_missing_schedule_urls2.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const isDryRun = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

if (isDryRun) console.log('=== DRY RUN ===\n');

const SHOPS = [
  {
    id: 'miyagi_sendai_aroma_rich',
    name: 'Aroma Rich (アロマリッチ) 仙台',
    base: 'https://rich-sendai.com',
    patterns: ['/schedule/', '/schedule', '/schedules/', '/cast/', '/girls/', '/week.cgi', '/shift/'],
  },
  {
    id: '60339',
    name: 'ムーブプラス',
    base: 'https://move-plus.site',
    patterns: ['/schedule/', '/schedule', '/shift/', '/cast/', '/girls/', '/week.cgi'],
  },
];

const checkUrl = async (url) => {
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    return res.status;
  } catch {
    return null;
  }
};

for (const shop of SHOPS) {
  console.log(`\n【${shop.name}】`);
  let found = null;

  for (const pattern of shop.patterns) {
    const url = shop.base + pattern;
    const status = await checkUrl(url);
    if (status === 200) {
      console.log(`  ✅ ${url} → ${status}`);
      found = url;
      break;
    } else {
      console.log(`  ✗ ${url} → ${status ?? 'timeout'}`);
    }
  }

  if (found) {
    if (!isDryRun) {
      const { error } = await supabase
        .from('shops')
        .update({ schedule_url: found })
        .eq('id', shop.id);
      if (error) console.error(`  ERROR: ${error.message}`);
      else console.log(`  → DB更新完了: ${found}`);
    } else {
      console.log(`  [DRY] 設定予定: ${found}`);
    }
  } else {
    console.log(`  → 自動検出できず。手動確認が必要です。`);
  }
}

console.log('\n保留（手動確認）:');
console.log('  No Brand: サイトダウン中 (no-brand.jp)');
console.log('  僕のママスパ: https://higashiyama1250.wixsite.com/home');
