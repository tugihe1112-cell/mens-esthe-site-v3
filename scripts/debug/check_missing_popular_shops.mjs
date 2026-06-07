/**
 * 人気ランキング上位店舗のDB未登録チェック
 * 実行: node scripts/debug/check_missing_popular_shops.mjs
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// mens-mg.com ランキング上位の店舗リスト（エリア・順位・公式URL付き）
const POPULAR_SHOPS = [
  // === 新宿 (2026-03-27更新) ===
  { rank: '新宿1位', name: 'Tokyo Panic (トウキョウパニック)',  url: null },
  { rank: '新宿2位', name: 'CorCaroli (コルカロリ)',           url: null },
  { rank: '新宿3位', name: 'AROMA more (アロマモア)',          url: 'https://aroma-more.com/' },
  { rank: '新宿4位', name: 'トキョプラ',                       url: null },
  { rank: '新宿5位', name: '玉楼',                             url: null },
  { rank: '新宿6位', name: 'Peach Next (ピーチネクスト)',       url: null },
  { rank: '新宿7位', name: '小悪魔Spa Tokyo',                  url: 'https://mens-esthe-aroma.site/' },
  { rank: '新宿8位', name: 'Aroma Charm (アロマチャーム)',      url: null },
  { rank: '新宿9位', name: 'Aroma Jewels (アロマジュエルズ)',   url: null },
  { rank: '新宿10位', name: '東京メンズエステ',                url: null },

  // === 渋谷 (2026-04-29更新) ===
  { rank: '渋谷1位', name: 'AROMA TIAMO (アロマティアーモ) 渋谷', url: 'https://aroma-tiamo.com/' },
  { rank: '渋谷2位', name: 'NAOMI SPA (ナオミスパ)',           url: null },
  { rank: '渋谷3位', name: 'A5 SPA',                          url: null },
  { rank: '渋谷4位', name: 'S活',                             url: null },
  { rank: '渋谷5位', name: 'RioSPA (リオスパ)',                url: null },
  { rank: '渋谷6位', name: 'mirrors spa (ミラーズスパ)',        url: null },
  { rank: '渋谷7位', name: 'SPA Real (レアル)',                url: null },
  { rank: '渋谷8位', name: '大人の隠れ家',                     url: null },
  { rank: '渋谷9位', name: 'CIEL SPA (シエルスパ)',            url: null },
  { rank: '渋谷10位', name: 'ANAICHI (あないち)',              url: null },
];

// DB上の名前で部分一致検索するキーワード
const SEARCH_KEYWORDS = [
  { rank: '新宿1位',  kw: 'パニック' },
  { rank: '新宿2位',  kw: 'カロリ' },
  { rank: '新宿3位',  kw: 'アロマモア' },
  { rank: '新宿4位',  kw: 'トキョプラ' },
  { rank: '新宿5位',  kw: '玉楼' },
  { rank: '新宿6位',  kw: 'ピーチ' },
  { rank: '新宿7位',  kw: '小悪魔' },
  { rank: '新宿8位',  kw: 'アロマチャーム' },
  { rank: '新宿9位',  kw: 'ジュエル' },
  { rank: '新宿10位', kw: '東京メンズ' },
  { rank: '渋谷1位',  kw: 'ティアーモ' },
  { rank: '渋谷2位',  kw: 'ナオミ' },
  { rank: '渋谷3位',  kw: 'A5' },
  { rank: '渋谷4位',  kw: 'S活' },
  { rank: '渋谷5位',  kw: 'リオ' },
  { rank: '渋谷6位',  kw: 'ミラーズ' },
  { rank: '渋谷7位',  kw: 'レアル' },
  { rank: '渋谷8位',  kw: '隠れ家' },
  { rank: '渋谷9位',  kw: 'シエル' },
  { rank: '渋谷10位', kw: 'あないち' },
];

async function main() {
  console.log('=== 人気ランキング上位店舗 DB登録チェック ===\n');

  const missing = [];
  const found = [];

  for (const item of SEARCH_KEYWORDS) {
    const shop = POPULAR_SHOPS.find(s => s.rank === item.rank);

    // 名前で検索
    const { data: byName } = await supabase
      .from('shops')
      .select('id, name, website_url')
      .ilike('name', `%${item.kw}%`)
      .limit(3);

    // website_urlでも検索
    let byUrl = [];
    if (shop?.url) {
      const domain = shop.url.replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '').split('/')[0];
      const { data } = await supabase
        .from('shops')
        .select('id, name, website_url')
        .ilike('website_url', `%${domain}%`);
      byUrl = data || [];
    }

    const hits = [...(byName || []), ...byUrl];
    const unique = [...new Map(hits.map(s => [s.id, s])).values()];

    if (unique.length > 0) {
      found.push({ rank: item.rank, name: shop.name, dbShops: unique });
      console.log(`✅ ${item.rank} ${shop.name}`);
      unique.forEach(s => console.log(`   → DB: ${s.id} / ${s.name}`));
    } else {
      missing.push(shop);
      console.log(`❌ ${item.rank} ${shop.name} ← 未登録`);
    }
  }

  console.log('\n=============================');
  console.log(`✅ DB登録済み: ${found.length}件`);
  console.log(`❌ DB未登録:   ${missing.length}件`);
  console.log('\n--- 未登録リスト ---');
  missing.forEach(s => console.log(`  ${s.rank}: ${s.name}`));
}

main().catch(console.error);
