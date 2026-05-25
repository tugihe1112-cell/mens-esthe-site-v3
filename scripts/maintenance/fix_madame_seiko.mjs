/**
 * MADAME聖子: schedule_url設定 + セラピスト取得
 * 実行: node scripts/maintenance/fix_madame_seiko.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const SHOP_ID = 'aichi_shinsakae_madame_seiko';
const BASE = 'https://madame-seiko.com';
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

// /top を取得（年齢確認通過後のコンテンツ）
const res = await fetch(`${BASE}/top`, { headers: ua, signal: AbortSignal.timeout(12000) });
const html = await res.text();
const $ = cheerio.load(html);

// schedule_url設定
if (!DRY_RUN) {
  const { error } = await supabase.from('shops').update({ schedule_url: `${BASE}/schedule` }).eq('id', SHOP_ID);
  console.log(error ? `❌ schedule_url更新失敗: ${error.message}` : `✅ schedule_url: ${BASE}/schedule`);
} else {
  console.log(`[DRY] schedule_url: ${BASE}/schedule`);
}

// セラピスト取得: profile?lid=xxx リンクから名前と年齢を抽出
const therapists = [];
const seen = new Set();

$('a[href*="profile?lid="]').each((_, el) => {
  const href = $(el).attr('href') || '';
  const text = $(el).text().trim().replace(/\s+/g, ' ');
  // "さよこ(43)" 形式
  const m = text.match(/^([ぁ-んァ-ヾ一-龯々a-zA-Z]{1,12})\s*[（(](\d{2,3})[）)]/);
  if (!m) return;
  const name = m[1].trim();
  const age = parseInt(m[2]);
  if (seen.has(name)) return;
  seen.add(name);

  // 画像: 親要素から探す
  const $parent = $(el);
  const imgSrc = $parent.find('img').attr('src') || $parent.closest('li,div,.item').find('img').attr('src') || '';
  const absImg = imgSrc ? (imgSrc.startsWith('http') ? imgSrc : new URL(imgSrc, BASE).href) : '';
  // ノーイメージ系を除外
  const finalImg = /no.image|noimage|dummy|placeholder/i.test(absImg) ? '' : absImg;

  therapists.push({ name, age, imgSrc: finalImg });
});

console.log(`\nセラピスト取得: ${therapists.length}名`);
therapists.slice(0, 5).forEach(t => console.log(`  ${t.name}(${t.age}) ${t.imgSrc ? '📷' : '（画像なし）'}`));
if (therapists.length > 5) console.log(`  ...他${therapists.length - 5}名`);

if (DRY_RUN || therapists.length === 0) {
  console.log(therapists.length === 0 ? '\n⚠️ セラピスト0名のため終了' : '\n[DRY] 本実行でDB更新されます');
  process.exit(0);
}

// 既存削除 → 新規挿入
const { count } = await supabase.from('therapists').select('id', { count: 'exact', head: true }).eq('shop_id', SHOP_ID);
if (count > 0) {
  await supabase.from('therapists').delete().eq('shop_id', SHOP_ID);
  console.log(`\n既存${count}名削除`);
}

let inserted = 0;
process.stdout.write('挿入中: ');
for (const t of therapists) {
  const tid = `${SHOP_ID}_${t.name}`;
  const { error } = await supabase.from('therapists').upsert({
    id: tid, shop_id: SHOP_ID, name: t.name,
    age: t.age || null,
    image_url: t.imgSrc || null,
  });
  if (!error) { inserted++; process.stdout.write('.'); }
  else process.stdout.write('x');
  await sleep(80);
}
console.log(`\n✅ ${inserted}/${therapists.length}名挿入`);
console.log('\n完了');
