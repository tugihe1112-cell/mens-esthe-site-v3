/**
 * 福岡 セラピスト挿入済み店舗のshop画像を公式サイトから更新
 * 実行: node scripts/maintenance/fix_fukuoka_shop_images.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

// 全福岡店舗取得
const { data: shops } = await supabase.from('shops')
  .select('id, name, image_url, website_url')
  .filter('raw_data->>prefecture', 'eq', '福岡県')
  .order('id');

// セラピスト数チェック
console.log('=== 福岡 店舗・shop画像状況 ===');
for (const s of shops) {
  const { count } = await supabase.from('therapists').select('id', { count: 'exact', head: true }).eq('shop_id', s.id);
  const imgStatus = s.image_url ? (s.image_url.includes('men-esthe.jp') ? '⚠️ men-esthe画像' : '✅ 公式画像') : '❌ なし';
  console.log(`${count > 0 ? '✅' : '  '} ${s.name.slice(0, 25).padEnd(25)} | ${count}名 | ${imgStatus}`);
}

// 公式サイトからog:image取得して更新
console.log('\n=== 公式サイトから shop画像取得 ===');
for (const s of shops) {
  if (!s.website_url) continue;
  // すでに公式画像が入っている場合はスキップ
  if (s.image_url && !s.image_url.includes('men-esthe.jp')) {
    console.log(`スキップ（公式画像設定済み）: ${s.name}`);
    continue;
  }

  try {
    const res = await fetch(s.website_url, { headers: ua, signal: AbortSignal.timeout(10000) });
    if (!res.ok) { console.log(`❌ ${s.name}: HTTP ${res.status}`); continue; }
    const html = await res.text();
    const $ = cheerio.load(html);

    const ogImg = $('meta[property="og:image"]').attr('content') || '';
    const logoImg = $('img[src*="logo"], img[src*="header"]').first().attr('src') || '';

    let newImg = ogImg;
    if (!newImg && logoImg) {
      newImg = logoImg.startsWith('http') ? logoImg : new URL(logoImg, s.website_url).href;
    }

    if (!newImg) { console.log(`⚠️ ${s.name}: 画像見つからず`); continue; }

    console.log(`${s.name}: ${newImg.slice(0, 70)}`);
    if (!DRY_RUN) {
      const { error } = await supabase.from('shops').update({ image_url: newImg }).eq('id', s.id);
      if (!error) console.log(`  ✅ 更新完了`);
      else console.log(`  ❌ ${error.message}`);
    } else {
      console.log(`  [DRY] 更新予定`);
    }
  } catch(e) {
    console.log(`❌ ${s.name}: ${e.message}`);
  }
  await sleep(300);
}

console.log('\n完了');
