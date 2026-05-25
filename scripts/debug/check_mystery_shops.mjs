/**
 * 謎IDの店舗 & むちすぱ 確認
 * 実行: node scripts/debug/check_mystery_shops.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── 1. 謎IDのshops情報を確認 ───────────────────────────────────────────────
console.log('=== 謎ID shops データ確認 ===\n');
const mysteryIds = ['1076', '1189_1', '1189_2', '1207_1', '60026', 'muchispa_minamiurawa'];
const { data: shops } = await supabase.from('shops')
  .select('id, name, raw_data, group_id, website_url')
  .in('id', mysteryIds);

for (const s of (shops || [])) {
  console.log(`[${s.id}]`);
  console.log(`  name: ${s.name}`);
  console.log(`  website_url: ${s.website_url || '(なし)'}`);
  console.log(`  group_id: ${s.group_id || '(なし)'}`);
  console.log(`  prefecture: ${s.raw_data?.prefecture || '(なし)'}`);
  console.log(`  area: ${s.raw_data?.area || '(なし)'}`);
  console.log(`  city: ${s.raw_data?.city || '(なし)'}`);
  console.log();
}

// ─── 2. 各サイトのキャストページ確認 ──────────────────────────────────────
const targets = [
  { label: 'ひまわり (1076)', url: 'https://sr-himawari.com/' },
  { label: 'Kobe Eslino (1189)', url: 'https://eslino-kobe.com/' },
  { label: 'MOTHERS 博多 (1207)', url: 'https://mothers-hakata.com' },
  { label: 'Mirajour (60026)', url: 'https://total-beauty-salon.net/' },
  { label: 'むちすぱ', url: 'https://muchispa.com/' },
];

for (const { label, url } of targets) {
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`【${label}】 ${url}`);
  try {
    const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(12000) });
    console.log(`HTTP: ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    // cast/staff系リンク
    const links = [];
    $('a').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim().slice(0, 20);
      if (/cast|staff|girl|therapist|セラピスト|キャスト|スタッフ/i.test(href + text)) {
        links.push(`${text} → ${href}`);
      }
    });
    console.log(`cast/staff系リンク: ${links.slice(0, 5).join(' / ') || '(なし)'}`);

    // img パターン確認
    const imgSrcs = [];
    $('img').each((_, el) => {
      const src = $(el).attr('src') || '';
      const alt = $(el).attr('alt') || '';
      if (!src.includes('logo') && !src.includes('banner') && !src.includes('.svg')) {
        imgSrcs.push(`alt="${alt.slice(0,15)}" ${src.slice(0,70)}`);
      }
    });
    console.log(`img サンプル: ${imgSrcs.slice(0, 4).join(' | ')}`);

    // 日本語テキスト（名前候補）
    const jpTexts = new Set();
    $('*').each((_, el) => {
      const t = $(el).clone().children().remove().end().text().trim();
      if (t.length >= 2 && t.length <= 10 && /[ぁ-んァ-ヾ一-龯]/.test(t) &&
        !['エステ', 'メンズ', '予約', '料金', 'コース', '求人', 'アクセス', 'トップ'].some(w => t.includes(w))) {
        jpTexts.add(t);
      }
    });
    console.log(`名前っぽいテキスト(${jpTexts.size}件): ${[...jpTexts].slice(0,10).join('、')}`);
  } catch(e) { console.log(`❌ ${e.message}`); }
  await sleep(800);
}
