/**
 * 秋葉原・上野ランキング DB登録チェック
 * 実行: node scripts/debug/check_akihabara_ueno.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const CHECKS = [
  // 秋葉原
  { rank: '秋葉原1位',  name: 'NEW+PLUS (ニュープラス)',      kw: 'プラス' },
  { rank: '秋葉原2位',  name: 'G+Style (ジースタイル)',        kw: 'スタイル' },
  { rank: '秋葉原3位',  name: 'Prispa (プリスパ)',             kw: 'プリスパ' },
  { rank: '秋葉原4位',  name: 'ar tokyo',                      kw: 'AR TOKYO' },
  { rank: '秋葉原5位',  name: 'Weal (ウィール)',                kw: 'ウィール' },
  { rank: '秋葉原6位',  name: 'Assouplir (アスプリール)',       kw: 'アスプリ' },
  { rank: '秋葉原7位',  name: '必殺あきば娘',                   kw: 'あきば娘' },
  { rank: '秋葉原8位',  name: 'AROMA AMOUR (アロマアムール)',   kw: 'アムール' },
  { rank: '秋葉原9位',  name: 'Aroma TT (アロマティーティー)', kw: 'Aroma TT' },
  { rank: '秋葉原10位', name: 'Raise (レイズ)',                 kw: 'レイズ' },
  // 上野
  { rank: '上野1位',    name: 'TOKYO LUXURY',                  kw: 'LUXURY' },
  { rank: '上野2位',    name: 'Grace Tokyo',                    kw: 'Grace' },
  { rank: '上野3位',    name: 'Beyond (ビヨンド)',              kw: 'ビヨンド' },
  { rank: '上野4位',    name: '色気あるワイフ',                 kw: '色気' },
  { rank: '上野5位',    name: 'Louis (ルイス)',                 kw: 'ルイス' },
  { rank: '上野6位',    name: 'ASOBI (アソビ)',                 kw: 'アソビ' },
  { rank: '上野7位',    name: 'らんぷ 三ノ輪店',               kw: 'らんぷ' },
  { rank: '上野8位',    name: '癒しの空間 Annex',               kw: 'ANNEX' },
  { rank: '上野9位',    name: 'ELECTRIC LODGE',                 kw: 'エレクトリック' },
  { rank: '上野10位',   name: 'Luxuary 上野店',                 kw: 'ラグジュアリー' },
];

async function main() {
  console.log('=== 秋葉原・上野 DB登録チェック ===\n');
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
