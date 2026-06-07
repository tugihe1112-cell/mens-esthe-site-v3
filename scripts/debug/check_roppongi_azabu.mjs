/**
 * 麻布十番・六本木ランキング DB登録チェック
 * 実行: node scripts/debug/check_roppongi_azabu.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const CHECKS = [
  { rank: '1位', name: 'BELLA SPA (ベラスパ)',        kw: 'ベラスパ' },
  { rank: '2位', name: 'Carinna (カリナ)',             kw: 'カリナ' },
  { rank: '3位', name: 'THE PREMIUM SPA',              kw: 'PREMIUM' },
  { rank: '4位', name: 'Linda Spa (リンダスパ)',        kw: 'リンダ' },
  { rank: '5位', name: 'CAMERON (キャメロン)',          kw: 'キャメロン' },
  { rank: '6位', name: 'Dejavu TOKYO (デジャブ東京)',   kw: 'デジャブ' },
  { rank: '7位', name: 'Love it (ラヴィット)',          kw: 'Love it' },
  { rank: '8位', name: 'ARIA (アリア)',                 kw: 'アリア' },
  { rank: '9位', name: 'sweetrain (スウィートレイン)',  kw: 'スウィート' },
  { rank: '10位', name: 'Spa Lanikai (スパラニカイ)',   kw: 'ラニカイ' },
];

async function main() {
  console.log('=== 麻布十番・六本木 DB登録チェック ===\n');
  const missing = [];
  for (const c of CHECKS) {
    const { data } = await supabase.from('shops').select('id,name').ilike('name', `%${c.kw}%`).limit(3);
    if (data?.length) {
      console.log(`✅ ${c.rank} ${c.name}`);
      data.forEach(s => console.log(`   → ${s.id} / ${s.name}`));
    } else {
      missing.push(c);
      console.log(`❌ ${c.rank} ${c.name} ← 未登録`);
    }
  }
  console.log(`\n未登録: ${missing.length}件`);
  missing.forEach(c => console.log(`  ${c.rank}: ${c.name}`));
}
main().catch(console.error);
