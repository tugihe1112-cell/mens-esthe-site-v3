/**
 * 池袋・五反田ランキング上位店のDB登録チェック
 * 実行: node scripts/debug/check_ikebukuro_gotanda.mjs
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const CHECKS = [
  // 池袋
  { rank: '池袋1位',  kw: 'フィオーレ' },
  { rank: '池袋2位',  kw: 'フェアリー' },
  { rank: '池袋3位',  kw: 'エターナル' },
  { rank: '池袋4位',  kw: 'リンクス' },
  { rank: '池袋5位',  kw: 'コルカロリ' },
  { rank: '池袋6位',  kw: 'アネモネ' },
  { rank: '池袋7位',  kw: 'OTONATIC' },
  { rank: '池袋8位',  kw: 'カシェット' },
  { rank: '池袋9位',  kw: 'ラブランド' },
  { rank: '池袋10位', kw: 'ocochi' },
  // 五反田
  { rank: '五反田1位',  kw: 'リラックス' },
  { rank: '五反田2位',  kw: 'アンナ' },
  { rank: '五反田3位',  kw: '王様' },
  { rank: '五反田4位',  kw: 'ハーフ' },
  { rank: '五反田5位',  kw: 'A5' },
  { rank: '五反田6位',  kw: 'リンクス' },
  { rank: '五反田7位',  kw: 'ラグタイム' },
  { rank: '五反田8位',  kw: 'Aroma ABC' },
  { rank: '五反田9位',  kw: 'レインズ' },
  { rank: '五反田10位', kw: 'ダリア' },
];

const NAMES = {
  '池袋1位': 'FioreSpa (フィオーレスパ)',
  '池袋2位': 'Tokyo Fairy Land (東京フェアリーランド)',
  '池袋3位': 'Eternal (エターナル)',
  '池袋4位': 'Lynx (リンクス)',
  '池袋5位': 'CorCaroli 要町ルーム',
  '池袋6位': 'Anemone (アネモネ)',
  '池袋7位': 'OTONATIC',
  '池袋8位': 'Cachette (カシェット)',
  '池袋9位': 'LOVE LAND (ラブランド)',
  '池袋10位': 'cocochi (ココチ)',
  '五反田1位': 'RELAX (リラックス)',
  '五反田2位': 'ANNA (アンナ)',
  '五反田3位': 'エステの王様 五反田店',
  '五反田4位': 'THE HALF 五反田ルーム',
  '五反田5位': 'A5 SPA 五反田ルーム',
  '五反田6位': 'Lynx 五反田店',
  '五反田7位': 'LuxuryTime (ラグタイム) 五反田',
  '五反田8位': 'Aroma ABC',
  '五反田9位': 'RainsRapt (レインズラプト)',
  '五反田10位': 'DAHLIA (ダリア)',
};

async function main() {
  console.log('=== 池袋・五反田 DB登録チェック ===\n');
  const missing = [], found = [];

  for (const c of CHECKS) {
    const { data } = await supabase.from('shops').select('id, name').ilike('name', `%${c.kw}%`).limit(3);
    if (data?.length) {
      found.push(c.rank);
      console.log(`✅ ${c.rank} ${NAMES[c.rank]}`);
      data.forEach(s => console.log(`   → ${s.id} / ${s.name}`));
    } else {
      missing.push(c.rank);
      console.log(`❌ ${c.rank} ${NAMES[c.rank]} ← 未登録`);
    }
  }

  console.log(`\n登録済み: ${found.length} / 未登録: ${missing.length}`);
  console.log('未登録:', missing.map(r => `${r} ${NAMES[r]}`).join('\n       '));
}

main().catch(console.error);
