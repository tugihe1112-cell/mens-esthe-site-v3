/**
 * 熟的〜美熟女スパ〜 登録スクリプト
 *   - 荻窪5位 12名 WordPress wp-content
 *   - shop_id: tokyo_suginami_ogikubo_jukuteki
 *
 * 実行:
 *   node scripts/maintenance/process_jukuteki.mjs --dry-run
 *   node scripts/maintenance/process_jukuteki.mjs
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const DRY_RUN = process.argv.includes('--dry-run');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
const REFERER = 'https://tokyo-spa.com/';
const SHOP_ID = 'tokyo_suginami_ogikubo_jukuteki';

const THERAPISTS = [
  {name:'村上璃奈', src:'https://tokyo-spa.com/wp-content/uploads/2025/09/IMG_7720.jpeg',      key:'jukuteki_IMG_7720'},
  {name:'伊吹芽衣', src:'https://tokyo-spa.com/wp-content/uploads/2026/03/IMG_2160.jpeg',      key:'jukuteki_IMG_2160'},
  {name:'黒崎あず', src:'https://tokyo-spa.com/wp-content/uploads/2026/05/IMG_3583.jpeg',      key:'jukuteki_IMG_3583'},
  {name:'白咲碧',   src:'https://tokyo-spa.com/wp-content/uploads/2026/01/%E7%99%BD%E5%92%B2%E7%A2%A7-2.jpg', key:'jukuteki_shirasaki_ao'},
  {name:'妃あいり', src:'https://tokyo-spa.com/wp-content/uploads/2024/06/IMG_5039.jpeg',      key:'jukuteki_IMG_5039'},
  {name:'藤原美月', src:'https://tokyo-spa.com/wp-content/uploads/2026/05/C46DE13C-0181-4C3C-ACEA-CFD4FFEEEFB3-6735-00000199E87A4447.jpeg', key:'jukuteki_C46DE13C'},
  {name:'結城えり', src:'https://tokyo-spa.com/wp-content/uploads/2026/03/IMG_2029.jpeg',      key:'jukuteki_IMG_2029'},
  {name:'百瀬りん', src:'https://tokyo-spa.com/wp-content/uploads/2026/06/IMG_4319.jpeg',      key:'jukuteki_IMG_4319'},
  {name:'大場えみ', src:'https://tokyo-spa.com/wp-content/uploads/2025/05/3EE96710-7EAC-4599-BBF5-CF1180E76F15-26809-0000065633B120CF.jpeg', key:'jukuteki_3EE96710'},
  {name:'黒木みすず',src:'https://tokyo-spa.com/wp-content/uploads/2026/03/FF00F85B-7570-44F1-8C1C-EB4CCFE2EE47-13671-000003D2E46E2CD7.jpeg', key:'jukuteki_FF00F85B'},
  {name:'喜瀬光',   src:'https://tokyo-spa.com/wp-content/uploads/2026/03/9BFC3011-3EF4-476C-BD2D-42ECBE16C043-32135-00000826810447BD.jpeg', key:'jukuteki_9BFC3011'},
  {name:'鈴原ふじ乃',src:'https://tokyo-spa.com/wp-content/uploads/2025/01/9352CF61-5C5E-4A63-9CB2-F5AAA8F8D6C8-59068-0000181D1FD3C87C.jpeg', key:'jukuteki_9352CF61'},
];

async function uploadImage(src, key) {
  try {
    const res = await fetch(src, { headers: { 'User-Agent': UA, 'Referer': REFERER } });
    if (!res.ok) { process.stdout.write('!'); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = src.split('?')[0].toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    const { error } = await supabase.storage.from('therapist-images').upload(`${key}.jpg`, buf, { contentType: ext, upsert: true });
    if (error) { process.stdout.write('E'); return null; }
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(`${key}.jpg`);
    return data.publicUrl;
  } catch { process.stdout.write('!'); return null; }
}

async function main() {
  console.log(`=== 熟的 登録 (DRY_RUN=${DRY_RUN}) ===\n`);

  // shop登録
  const shop = {
    id: SHOP_ID,
    name: '熟的 (じゅくてき)',
    website_url: 'https://tokyo-spa.com/',
    schedule_url: 'https://tokyo-spa.com/schedule/',
    image_url: 'https://tokyo-spa.com/wp-content/uploads/2024/02/jyukuteki.png',
    raw_data: { prefecture: '東京都', area: '荻窪' },
  };

  if (!DRY_RUN) {
    const { error } = await supabase.from('shops').upsert(shop, { onConflict: 'id' });
    if (error) console.error('Shop error:', error.message);
    else console.log('✅ shop登録完了');
  } else {
    console.log('[DRY] shop:', SHOP_ID);
  }

  // セラピスト登録
  let ins = 0, skp = 0, err = 0;
  for (const t of THERAPISTS) {
    const tid = `${SHOP_ID}_${t.name}`;
    const { data: ex } = await supabase.from('therapists').select('id,image_url').eq('id', tid).single();
    if (ex?.image_url) { process.stdout.write('='); skp++; continue; }

    if (DRY_RUN) { process.stdout.write('+'); ins++; continue; }

    const url = await uploadImage(t.src, t.key);
    const { error } = await supabase.from('therapists').upsert(
      { id: tid, shop_id: SHOP_ID, name: t.name, image_url: url },
      { onConflict: 'id' }
    );
    if (error) { err++; process.stdout.write('x'); }
    else { process.stdout.write(url ? '+' : 'n'); ins++; }
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`\n挿入:${ins} スキップ:${skp} エラー:${err}`);
  console.log('\n=== 完了 ===');
}
main().catch(console.error);
