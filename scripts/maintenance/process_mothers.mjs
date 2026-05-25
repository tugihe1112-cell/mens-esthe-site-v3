/**
 * MOTHERS (mothers-hakata.com) セラピスト登録スクリプト
 * 博多店52名 + 久留米店29名 = 計81名（募集中バナー1件除外）
 * 実行: node scripts/maintenance/process_mothers.mjs [--dry-run]
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
const BASE = 'https://mothers-hakata.com';

// ノイズ判定
const isNoise = (name) => {
  if (!name || name.length === 0) return true;
  if (name.length > 15) return true;
  if (/募集|求人|banner|logo|staff/i.test(name)) return true;
  return false;
};

// shop_id取得
const { data: shops } = await supabase
  .from('shops')
  .select('id, name')
  .filter('raw_data->>prefecture', 'eq', '福岡県')
  .ilike('website_url', '%mothers-hakata%');

const shop = shops?.[0];
if (!shop) { console.error('❌ MOTHERS shop not found'); process.exit(1); }
console.log(`✅ shop: ${shop.name} (${shop.id})`);
if (DRY_RUN) console.log('[DRY RUN]');

// セラピストページ取得
console.log('\nセラピストページ取得中...');
const res = await fetch(`${BASE}/girl`, { headers: ua, signal: AbortSignal.timeout(15000) });
if (!res.ok) { console.error(`❌ HTTP ${res.status}`); process.exit(1); }
const html = await res.text();
const $ = cheerio.load(html);

const therapists = [];
$('div.girls_box').each((_, el) => {
  const img = $(el).find('img').first();
  const name = img.attr('alt')?.trim() || '';
  const imgPath = img.attr('src') || '';
  const imgUrl = imgPath.startsWith('http') ? imgPath : `${BASE}${imgPath}`;
  const isKurume = $(el).hasClass('category-2');
  const store = isKurume ? '久留米店' : '博多店';

  if (isNoise(name)) return;
  therapists.push({ name, store, imgUrl });
});

const hakata = therapists.filter(t => t.store === '博多店');
const kurume = therapists.filter(t => t.store === '久留米店');
console.log(`取得: 博多店 ${hakata.length}名, 久留米店 ${kurume.length}名, 計 ${therapists.length}名`);

// 既存確認
const { count: existing } = await supabase
  .from('therapists').select('id', { count: 'exact', head: true }).eq('shop_id', shop.id);
console.log(`既存: ${existing}名`);

if (DRY_RUN) {
  therapists.forEach((t, i) => console.log(`  [${i + 1}] [${t.store}] ${t.name} → ${t.imgUrl}`));
  process.exit(0);
}

let inserted = 0, errors = 0;
for (const t of therapists) {
  const id = `${shop.id}_${t.name}`;
  const { error } = await supabase.from('therapists').upsert({
    id,
    shop_id: shop.id,
    name: t.name,
    image_url: t.imgUrl,
  }, { onConflict: 'id' });

  if (error) { console.error(`❌ ${t.name}: ${error.message}`); errors++; }
  else { console.log(`✅ [${t.store}] ${t.name}`); inserted++; }
}

console.log(`\n完了: 挿入/更新 ${inserted}名, エラー ${errors}名`);
