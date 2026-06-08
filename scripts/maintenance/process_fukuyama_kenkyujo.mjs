/**
 * 福山メンズエステ研究所 セラピスト登録 (広島8位・福山)
 * 63名 / 名前のみ（画像なし・サイト構造上取得不可）
 * 実行: node scripts/maintenance/process_fukuyama_kenkyujo.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const SHOP_ID = 'hiroshima_fukuyama_mensesthe_kenkyujo';

// li.staff-name から取得したユニーク名（画像取得不可）
const NAMES = [
  '麗子', '那月', '奈緒', '紬', 'もも', '慶', '真皇', '桃佳', '莉子', '茉奈',
  '葵', '美月', '美羽', 'Uno', '純', '由湖', '優木', '多愛', '菖蒲', '言織',
  '七瀬', '琴乃', '芙和里', '香織', '舞花', '友奈', '癒しの女神カレン',
  '颯', '華奈', '雅', '那波', '日菜', '桜', '茉白', '灯里', 'レイ',
  '保健室の百合先生', '愛実', '陽葵', 'みやの', 'なよ竹かぐや', '吉沢ゆい',
  '百合', '桜子', '翠', '優里奈', '雪乃', '茉莉', '凛', '椿', '萌',
  '明日海', '渚', '聖愛', '美紅', '蓬', '海咲', '千尋', '京香', '響',
  '千聖', '紀香', '瑠海',
];

const { data: shopData } = await supabase.from('shops').select('id,name').eq('id', SHOP_ID);
if (!shopData?.length) { console.error(`${SHOP_ID} not found in DB`); process.exit(1); }
console.log(`shop: ${shopData[0].name} (${SHOP_ID})`);

const { count } = await supabase.from('therapists').select('id', { count: 'exact' }).eq('shop_id', SHOP_ID);
console.log(`既存: ${count}件\n`);
if (count > 0 && !process.argv.includes('--force')) { console.log('既登録あり。--force で再実行'); process.exit(0); }

if (DRY_RUN) {
  NAMES.forEach(n => console.log(`  [dry] ${n} (名前のみ)`));
  console.log(`\n(dry-run) 計 ${NAMES.length}名`);
  process.exit(0);
}

let added = 0, failed = 0;
for (const name of NAMES) {
  const { error } = await supabase.from('therapists').insert({
    id: `${SHOP_ID}_${name}`,
    shop_id: SHOP_ID,
    name,
    image_url: null,
  });
  if (!error) { added++; process.stdout.write('n'); }
  else { failed++; console.log(`\n  ! insert失敗 ${name}: ${error.message}`); }
}
process.stdout.write('\n');
console.log(`\n✅ 登録: ${added}名 / 失敗: ${failed}名`);
