/**
 * Mrs Crystal 名前修正（括弧処理バグ修正版）
 * 実行: node scripts/maintenance/fix_mrscrystal_names.mjs [--dry-run]
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

const SHOP_ID = 'aichi_tsurumai_mrs_crystal';
const BASE = 'http://www.mrs-crystal.com';

const res = await fetch(`${BASE}/staff/`, { headers: ua, signal: AbortSignal.timeout(12000) });
const html = await res.text();
const $ = cheerio.load(html);

const therapists = [];
const seen = new Set();

$('img[alt*="さんの写真"]').each((_, el) => {
  const alt = $(el).attr('alt') || '';
  let name = alt.replace(/さんの写真$/, '');

  // ネストされた括弧を繰り返し除去（例: "舞(新人)(4(月)~7(木)一宮)" → "舞"）
  for (let i = 0; i < 5; i++) {
    name = name.replace(/\([^()]*\)/g, '');
  }
  name = name.trim();

  if (!name || name.length < 1 || seen.has(name)) return;
  if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return;
  seen.add(name);
  therapists.push({ name });
});

console.log(`取得: ${therapists.length}名`);
therapists.slice(0, 10).forEach(t => console.log(`  ${t.name}`));
if (therapists.length > 10) console.log(`  ...他${therapists.length - 10}名`);

if (DRY_RUN) { console.log('\n[DRY] 完了'); process.exit(0); }

// 全削除 → 再挿入
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
    id: tid, shop_id: SHOP_ID, name: t.name, image_url: null,
  });
  if (!error) { inserted++; process.stdout.write('.'); }
  else process.stdout.write('x');
  await sleep(50);
}
console.log(`\n✅ ${inserted}/${therapists.length}名挿入`);
