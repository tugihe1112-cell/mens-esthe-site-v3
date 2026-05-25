/**
 * 竜宮城 旧百万石 (人形町店) セラピスト登録スクリプト
 * WordPress系サイト: img[src*="/wp-content/uploads/"] + alt=名前
 * 88名 (写真あり)
 *
 * 対象 shop_id: tokyo_chuo_ningyocho_ryugujo
 * セラピストページ: https://esthe-ryugujo.com/cast/
 * スケジュール: https://esthe-ryugujo.com/schedule/
 *
 * 実行: node scripts/maintenance/process_ryugujo.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const SHOP_ID = 'tokyo_chuo_ningyocho_ryugujo';
const BASE = 'https://esthe-ryugujo.com';

if (DRY_RUN) console.log('[DRY RUN]\n');

// ---- shop情報更新（image_url + schedule_url）----
const SHOP_UPDATE = {
  image_url: `${BASE}/wp-content/uploads/2024/06/mainvisual.jpg`,
  schedule_url: `${BASE}/schedule/`,
};
console.log('=== shop情報更新 ===');
console.log(JSON.stringify(SHOP_UPDATE));
if (!DRY_RUN) {
  const { error } = await supabase.from('shops').update(SHOP_UPDATE).eq('id', SHOP_ID);
  if (error) console.error(`❌ ${error.message}`);
  else       console.log('✅ shop情報更新完了');
}

// ---- セラピスト取得 ----
console.log('\n=== セラピスト取得 ===');
const res = await fetch(`${BASE}/cast/`, { headers: UA, signal: AbortSignal.timeout(15000) });
if (!res.ok) { console.error(`❌ HTTP ${res.status}`); process.exit(1); }
const html = await res.text();
const $ = cheerio.load(html);

const therapists = [];
const seen = new Set();

$('img[src*="/wp-content/uploads/"]').each((_, el) => {
  const name = $(el).attr('alt')?.trim() || '';
  if (!name || seen.has(name)) return;
  // ノイズ除外
  if (/竜宮城|LINE|Twitter|logo|banner|icon|recruit|access|schedule|price/i.test(name)) return;
  if (/セラピスト|ダブル|トリプル|新規割|スタート割|キャンペーン|割引|コース/i.test(name)) return;
  if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return;
  if (name.length > 15) return;
  seen.add(name);
  const imgPath = $(el).attr('src') || '';
  const imgUrl = imgPath.startsWith('http') ? imgPath.split('?')[0] : `${BASE}${imgPath.split('?')[0]}`;
  therapists.push({ name, imgUrl });
});

console.log(`取得: ${therapists.length}名`);

if (DRY_RUN) {
  therapists.forEach((t, i) => console.log(`  [${i + 1}] ${t.name} → ${t.imgUrl}`));
  process.exit(0);
}

// ---- DB登録 ----
const { count: existing } = await supabase
  .from('therapists').select('id', { count: 'exact', head: true }).eq('shop_id', SHOP_ID);
console.log(`既存: ${existing}名`);

let inserted = 0, errors = 0;
for (const t of therapists) {
  const id = `${SHOP_ID}_${t.name}`;
  const { error } = await supabase.from('therapists').upsert({
    id,
    shop_id: SHOP_ID,
    name: t.name,
    image_url: t.imgUrl,
  }, { onConflict: 'id' });

  if (error) { console.error(`❌ ${t.name}: ${error.message}`); errors++; }
  else        { console.log(`✅ ${t.name}`); inserted++; }
}

console.log(`\n完了: 挿入/更新 ${inserted}名, エラー ${errors}名`);
