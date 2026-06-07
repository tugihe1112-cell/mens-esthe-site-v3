/**
 * 新宿・品川・高田馬場・荻窪 DB登録チェック
 * 実行: node scripts/debug/check_missing_shinjuku_etc.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const CHECKS = [
  // 新宿 TOP10
  { area: '新宿1位',  name: 'Tokyo Panic (トウキョウパニック)', kw: 'パニック' },
  { area: '新宿2位',  name: 'CorCaroli (コルカロリ)',           kw: 'コルカロリ' },
  { area: '新宿3位',  name: 'AROMA more (アロマモア)',          kw: 'アロマモア' },
  { area: '新宿4位',  name: 'トキョプラ',                       kw: 'トキョプラ' },
  { area: '新宿5位',  name: '玉楼',                             kw: '玉楼' },
  { area: '新宿6位',  name: 'Peach Next (ピーチネクスト)',       kw: 'ピーチ' },
  { area: '新宿7位',  name: '小悪魔Spa Tokyo',                  kw: '小悪魔' },
  { area: '新宿8位',  name: 'Aroma Jewels (アロマジュエルズ)',   kw: 'ジュエルズ' },
  { area: '新宿9位',  name: 'Aroma Charm (アロマチャーム)',      kw: 'チャーム' },
  { area: '新宿10位', name: '東京メンズエステ',                 kw: '東京メンズエステ' },
  // 品川・大井町 TOP10
  { area: '品川1位',  name: 'RheaSpa (レアスパ)',               kw: 'レアスパ' },
  { area: '品川2位',  name: 'ARIA (アリア) 品川',               kw: 'アリア' },
  { area: '品川3位',  name: 'SPA LOUNGE (スパラウンジ)',         kw: 'スパラウンジ' },
  { area: '品川4位',  name: 'メンエス大井町',                   kw: 'メンエス大井町' },
  { area: '品川5位',  name: 'Rose Aroma Spa (ローズアロマスパ)', kw: 'ローズアロマスパ' },
  { area: '品川6位',  name: '昭和リフレッシュ館',               kw: '昭和リフレッシュ' },
  { area: '品川7位',  name: 'HANA SPA',                         kw: 'HANA SPA' },
  { area: '品川8位',  name: 'Mの扉',                            kw: 'Mの扉' },
  { area: '品川9位',  name: 'むちむちお姉さん 大井町',           kw: 'むちむち' },
  { area: '品川10位', name: 'SPA Secret House',                 kw: 'シークレットハウス' },
  // 高田馬場 TOP10
  { area: '高田馬場1位',  name: 'COZY (コーズィー)',            kw: 'コーズィー' },
  { area: '高田馬場2位',  name: 'GRAND CHARIOT (グランシャリオ)', kw: 'シャリオ' },
  { area: '高田馬場3位',  name: 'Aroma Mrs. (アロマミセス)',     kw: 'アロマミセス' },
  { area: '高田馬場4位',  name: 'AROMA more 高田馬場',          kw: 'アロマモア' },
  { area: '高田馬場5位',  name: 'Lynx (リンクス) 高田馬場',     kw: 'リンクス' },
  { area: '高田馬場6位',  name: 'R,s SPA (アールズスパ)',        kw: 'アールズスパ' },
  { area: '高田馬場7位',  name: '高田馬場ナースクリニック',      kw: 'ナースクリニック' },
  { area: '高田馬場8位',  name: 'ぐらどるスパ',                 kw: 'ぐらどるスパ' },
  { area: '高田馬場9位',  name: 'a l\'aise SK (アレイズSK)',     kw: 'アレイズ' },
  { area: '高田馬場10位', name: 'evergreen (エバーグリーン)',     kw: 'エバーグリーン' },
  // 荻窪 TOP10
  { area: '荻窪1位',  name: 'Ogi Spa (オギスパ)',               kw: 'オギスパ' },
  { area: '荻窪2位',  name: 'a l\'aise SK 荻窪',                kw: 'アレイズ' },
  { area: '荻窪3位',  name: 'Yorimichi (よりみち)',              kw: 'よりみち' },
  { area: '荻窪4位',  name: 'Casablanca (カサブランカ)',         kw: 'カサブランカ' },
  { area: '荻窪5位',  name: '熟的',                             kw: '熟的' },
  { area: '荻窪6位',  name: 'Natural SPA (ナチュラルスパ)',      kw: 'ナチュラルスパ' },
  { area: '荻窪7位',  name: 'JJ (ジェイジェイ)',                kw: 'JJ' },
  { area: '荻窪8位',  name: 'CREST SPA 荻窪',                   kw: 'クレストスパ' },
  { area: '荻窪9位',  name: 'SENZSPA (センズスパ) 阿佐ケ谷',    kw: 'センズスパ' },
  { area: '荻窪10位', name: 'Jewelry (ジュエリー)',              kw: 'ジュエリー' },
];

async function main() {
  console.log('=== 新宿・品川・高田馬場・荻窪 DB登録チェック ===\n');
  const missing = [];
  let prevArea = '';

  for (const c of CHECKS) {
    const areaName = c.area.replace(/\d+位$/, '');
    if (areaName !== prevArea) { console.log(`\n--- ${areaName} ---`); prevArea = areaName; }

    const { data } = await supabase.from('shops').select('id,name').ilike('name', `%${c.kw}%`).limit(3);
    if (data?.length) {
      // セラピスト数も確認
      const { count } = await supabase.from('therapists').select('*', { count: 'exact', head: true }).eq('shop_id', data[0].id);
      console.log(`✅ ${c.area} ${c.name} (${count ?? '?'}名)`);
    } else {
      missing.push(c);
      console.log(`❌ ${c.area} ${c.name} ← 未登録`);
    }
  }

  console.log(`\n${'='.repeat(40)}`);
  console.log(`未登録: ${missing.length}件`);
  const byArea = {};
  missing.forEach(c => {
    const a = c.area.replace(/\d+位$/, '');
    if (!byArea[a]) byArea[a] = [];
    byArea[a].push(`${c.area}: ${c.name}`);
  });
  Object.entries(byArea).forEach(([area, items]) => {
    console.log(`\n【${area}】`);
    items.forEach(i => console.log(`  ${i}`));
  });
}
main().catch(console.error);
