/**
 * men-esthe.jp 福岡エリアの店舗一覧取得 + DBの店名と照合
 * 実行: node scripts/debug/check_menesthe_fukuoka2.mjs
 */
import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const BASE = 'https://men-esthe.jp';
const sleep = ms => new Promise(r => setTimeout(r, ms));

// 福岡エリアID
const areas = [
  { id: 82, name: '福岡・博多' },
  { id: 84, name: '北九州(黒崎・小倉)' },
  { id: 135, name: '雑餉隈・南福岡' },
];

// men-esthe.jpの全福岡店舗を収集
const menestheShops = [];

for (const area of areas) {
  console.log(`\n=== ${area.name} (id=${area.id}) ===`);
  const res = await fetch(`${BASE}/area.php?id=${area.id}`, { headers: ua, signal: AbortSignal.timeout(12000) });
  const html = await res.text();
  const $ = cheerio.load(html);

  $('a[href*="salon.php?id="]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const name = $(el).text().trim().replace(/\s+/g, ' ');
    if (!name || name.length < 2) return;
    const id = href.match(/id=(\d+)/)?.[1];
    if (!id || menestheShops.find(s => s.id === id)) return;
    menestheShops.push({ id, name, area: area.name, url: `${BASE}/salon.php?id=${id}` });
    console.log(`  ${name} → salon.php?id=${id}`);
  });

  await sleep(500);
}

console.log(`\nmen-esthe.jp 福岡店舗合計: ${menestheShops.length}件`);

// DBの福岡店舗を取得
const { data: dbShops } = await supabase.from('shops')
  .select('id, name, website_url')
  .filter('raw_data->>prefecture', 'eq', '福岡県');

console.log(`DB 福岡店舗: ${dbShops?.length}件`);

// 店名照合（部分一致）
console.log('\n=== 名前マッチング結果 ===');
for (const db of dbShops) {
  const dbNameClean = db.name.replace(/[（）()【】\s　]/g, '').toLowerCase();
  const matched = menestheShops.filter(m => {
    const mClean = m.name.replace(/[（）()【】\s　]/g, '').toLowerCase();
    return mClean.includes(dbNameClean) || dbNameClean.includes(mClean) ||
           // 英語名・カタカナ名の部分一致
           dbNameClean.split(/[・\s]/).some(part => part.length > 2 && mClean.includes(part));
  });

  if (matched.length > 0) {
    console.log(`\n✅ DB: "${db.name}"`);
    matched.forEach(m => console.log(`   → men-esthe: "${m.name}" | ${m.url}`));
  } else {
    console.log(`❌ DB: "${db.name}" → マッチなし`);
  }
}

// men-esthe.jpにあってDBにない店舗
console.log('\n=== men-esthe.jpのみ（DB未登録の可能性）===');
for (const m of menestheShops) {
  const mClean = m.name.replace(/[（）()【】\s　]/g, '').toLowerCase();
  const hasMatch = dbShops.some(db => {
    const dbClean = db.name.replace(/[（）()【】\s　]/g, '').toLowerCase();
    return dbClean.includes(mClean) || mClean.includes(dbClean);
  });
  if (!hasMatch) console.log(`  "${m.name}" | ${m.url}`);
}
