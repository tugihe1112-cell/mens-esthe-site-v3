/**
 * mens-mg.com の東京主要エリアランキングとDBを照合
 * 未登録の人気店を特定する
 *
 * 実行: node scripts/debug/check_tokyo_rankings.mjs
 */

import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const AREAS = [
  { name: '渋谷',     area: '1200' },
  { name: '新宿',     area: '0800' },
  { name: '池袋',     area: '0100' },
  { name: '五反田',   area: '1700' },
  { name: '銀座',     area: '0500' },
  { name: '麻布十番・六本木', area: '1600' },
  { name: '秋葉原',   area: '0300' },
  { name: '上野',     area: '0200' },
  { name: '中目黒',   area: '1500' },
  { name: '新橋',     area: '0600' },
  { name: '高田馬場', area: '0700' },
  { name: '三軒茶屋', area: '1300' },
  { name: '目黒',     area: '1750' },
  { name: '恵比寿',   area: '1400' },
  { name: '品川・大井町', area: '1800' },
  { name: '蒲田・大森', area: '1850' },
  { name: '中野',     area: '2200' },
  { name: '荻窪',     area: '2220' },
  { name: '錦糸町',   area: '2100' },
  { name: '北千住',   area: '2000' },
  { name: '赤羽',     area: '1900' },
  { name: '下北沢',   area: '3900' },
  { name: '吉祥寺',   area: '2250' },
];

// DBの全店舗名を取得
const { data: shops } = await supabase.from('shops').select('id, name, website_url, raw_data');
const norm = (s) => s?.replace(/[～〜・\s　（）()【】「」]/g, '').toLowerCase() || '';
const shopNorms = shops.map(s => ({ ...s, norm: norm(s.name) }));

function findInDB(rankName) {
  const n = norm(rankName);
  // 部分一致（DB名がランキング名を含む、またはその逆）
  return shopNorms.find(s => s.norm.includes(n.slice(0, 8)) || n.includes(s.norm.slice(0, 8)));
}

async function fetchRanking(area) {
  const res = await fetch(`https://mens-mg.com/ranking_area.php?area=${area}`, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await res.text();
  const $ = cheerio.load(html);
  const shops = [];
  const seen = new Set();
  $('a[href*="shop.php"]').each((_, el) => {
    const name = $(el).text().trim().replace(/[～〜]/g, '').trim();
    const id = $(el).attr('href')?.match(/id=(\d+)/)?.[1];
    if (id && name && !name.includes('詳細') && !name.includes('ランキング') && !name.includes('NEW') && !seen.has(id)) {
      seen.add(id);
      shops.push({ rank: shops.length + 1, name, id });
    }
  });
  return shops.slice(0, 10); // 上位10件
}

console.log('=== 東京 人気エリア 未登録店チェック ===\n');

const missing = [];

for (const areaInfo of AREAS) {
  try {
    const ranking = await fetchRanking(areaInfo.area);
    const notFound = ranking.filter(r => !findInDB(r.name));

    if (notFound.length > 0) {
      console.log(`\n【${areaInfo.name}】未登録: ${notFound.length}件`);
      notFound.forEach(r => {
        console.log(`  ${r.rank}位 ${r.name} → https://mens-mg.com/shop.php?id=${r.id}`);
        missing.push({ area: areaInfo.name, ...r });
      });
    } else {
      console.log(`【${areaInfo.name}】✅ TOP10全て登録済み`);
    }

    await new Promise(r => setTimeout(r, 500)); // レート制限対策
  } catch (e) {
    console.log(`【${areaInfo.name}】エラー: ${e.message}`);
  }
}

console.log(`\n\n=== 未登録合計: ${missing.length}件 ===`);
missing.forEach(m => console.log(`  [${m.area}] ${m.rank}位 ${m.name}`));
