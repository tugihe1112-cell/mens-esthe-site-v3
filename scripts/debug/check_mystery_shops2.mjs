/**
 * 謎ID店舗 詳細確認（第2弾）
 * 実行: node scripts/debug/check_mystery_shops2.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── 1. MOTHERS 重複確認 ──────────────────────────────────────────────────
console.log('=== MOTHERS 重複確認 ===');
const { data: mothersShops } = await supabase.from('shops')
  .select('id, name, raw_data')
  .ilike('name', '%MOTHERS%');
for (const s of (mothersShops || [])) {
  const { count } = await supabase.from('therapists').select('id', { count: 'exact', head: true }).eq('shop_id', s.id);
  console.log(`  ${s.id} | ${s.name} | ${s.raw_data?.prefecture} ${s.raw_data?.area} | ${count}名`);
}

// ─── 2. ひまわり /cast ──────────────────────────────────────────────────────
console.log('\n=== ひまわり /cast ページ ===');
try {
  const res = await fetch('https://sr-himawari.com/cast', { headers: UA, signal: AbortSignal.timeout(12000) });
  console.log(`HTTP: ${res.status}`);
  const $ = cheerio.load(await res.text());

  const therapists = [];
  $('img[src*="upload/cast"]').each((_, el) => {
    let alt = $(el).attr('alt') || '';
    const src = $(el).attr('src') || '';
    // alt: "シークレットルームヒマワリ 名前" → 最後の単語が名前
    const name = alt.replace(/シークレットルームヒマワリ\s*/i, '').replace(/sr-himawari\s*/i, '').trim();
    if (name && !therapists.find(t => t.name === name)) therapists.push({ name, src });
  });
  console.log(`キャスト: ${therapists.length}名`);
  therapists.slice(0, 10).forEach(t => console.log(`  "${t.name}" → ${t.src.slice(0, 70)}`));
} catch(e) { console.log(`❌ ${e.message}`); }

await sleep(800);

// ─── 3. Kobe Eslino /girl ─────────────────────────────────────────────────
console.log('\n=== Kobe Eslino /girl ページ ===');
try {
  const res = await fetch('https://eslino-kobe.com/girl', { headers: UA, signal: AbortSignal.timeout(12000) });
  console.log(`HTTP: ${res.status}`);
  const $ = cheerio.load(await res.text());

  const therapists = [];
  $('img[src*="/photos/"]').each((_, el) => {
    const alt = ($(el).attr('alt') || '').trim();
    const src = $(el).attr('src') || '';
    // alt: "英愛留(えある)" → 名前はカッコ前
    const name = alt.replace(/\([^)]+\)$/, '').trim();
    if (name && !/エスリノ|logo|banner/i.test(name) && !therapists.find(t => t.name === name)) {
      therapists.push({ name, alt, src });
    }
  });
  console.log(`キャスト: ${therapists.length}名`);
  therapists.slice(0, 15).forEach(t => console.log(`  "${t.name}" (alt="${t.alt}") → ${t.src.slice(0, 70)}`));
} catch(e) { console.log(`❌ ${e.message}`); }

await sleep(800);

// ─── 4. Mirajour /itemList.html ──────────────────────────────────────────
console.log('\n=== Mirajour /itemList.html ===');
try {
  const res = await fetch('https://total-beauty-salon.net/itemList.html', { headers: UA, signal: AbortSignal.timeout(12000) });
  console.log(`HTTP: ${res.status}`);
  const $ = cheerio.load(await res.text());

  // img 全件確認
  const imgs = [];
  $('img').each((_, el) => {
    const alt = ($(el).attr('alt') || '').trim();
    const src = $(el).attr('src') || '';
    if (/[ぁ-んァ-ヾ一-龯]/.test(alt) && alt.length < 15) imgs.push({ alt, src: src.slice(0,80) });
  });
  console.log(`日本語alt img: ${imgs.length}件`);
  imgs.slice(0, 10).forEach(i => console.log(`  alt="${i.alt}" src="${i.src}"`));

  // テキスト内の名前候補
  const jpTexts = new Set();
  $('*').each((_, el) => {
    const t = $(el).clone().children().remove().end().text().trim();
    if (t.length >= 2 && t.length <= 10 && /[ぁ-んァ-ヾ一-龯]/.test(t) &&
      !['キャスト', 'スケジュール', 'レビュー', '営業', '予約', 'アクセス', 'トップ', 'システム'].some(w => t.includes(w))) {
      jpTexts.add(t);
    }
  });
  console.log(`名前候補テキスト(${jpTexts.size}件): ${[...jpTexts].slice(0, 15).join('、')}`);
} catch(e) { console.log(`❌ ${e.message}`); }
