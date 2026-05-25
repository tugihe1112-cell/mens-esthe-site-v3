/**
 * 宮城県 セラピスト一括登録スクリプト
 *
 * 対象店舗 (6店舗):
 *   miyagi_sendai_pulunt        - Pulunt        girls_box + /photos/
 *   miyagi_sendai_arena_spa     - Arena SPA     c-panel   + /photos/
 *   miyagi_sendai_platonic_spa  - Platonic SPA  c-panel   + /photos/
 *   miyagi_sendai_shizuku_spa   - SHIZUKU SPA   c-panel   + /photos/
 *   miyagi_sendai_aroma_rich    - Aroma Rich    ap2hp CDN /therapist/
 *   miyagi_sendai_onetime       - ONE time      img[alt^="ONE Time "] 名前のみ
 *
 * スキップ:
 *   miyagi_sendai_cuaura    → 403 Forbidden（サイト停止中）
 *   miyagi_sendai_aroma_no5 → Wix JS描画のため別途対応
 *
 * 実行例:
 *   node scripts/maintenance/process_miyagi_therapists.mjs --dry-run
 *   node scripts/maintenance/process_miyagi_therapists.mjs
 *   node scripts/maintenance/process_miyagi_therapists.mjs --shop=miyagi_sendai_pulunt
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const shopArg = args.find(a => a.startsWith('--shop='));
const SHOP_FILTER = shopArg ? shopArg.split('=')[1] : null;

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };

if (DRY_RUN) console.log('[DRY RUN モード]\n');
if (SHOP_FILTER) console.log(`[対象絞り込み: ${SHOP_FILTER}]\n`);

// ---- ノイズ判定 ----
const isNoise = (name) => {
  if (!name || name.length === 0) return true;
  if (name.length > 12) return true;
  if (/募集|求人|NEW|banner|logo|icon|schedule/i.test(name)) return true;
  if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return true; // 日本語なし
  return false;
};

// ---- HTML取得 ----
const fetchHtml = async (url) => {
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
};

// ---- パターン1: girls_box + /photos/ (Pulunt) ----
const parseGirlsBox = ($, BASE) => {
  const result = [];
  $('div.girls_box').each((_, el) => {
    const img = $(el).find('img').first();
    const name = img.attr('alt')?.trim() || '';
    const imgPath = img.attr('src') || '';
    const imgUrl = imgPath.startsWith('http') ? imgPath : `${BASE}${imgPath}`;
    if (isNoise(name)) return;
    result.push({ name, imgUrl });
  });
  return result;
};

// ---- パターン2: c-panel + /photos/ (Arena SPA, Platonic SPA, SHIZUKU SPA) ----
const parseCPanel = ($, BASE) => {
  const result = [];
  $('div.c-panel').each((_, el) => {
    const img = $(el).find('img').first();
    const name = img.attr('alt')?.trim() || '';
    const imgPath = img.attr('src') || '';
    const imgUrl = imgPath.startsWith('http') ? imgPath : `${BASE}${imgPath}`;
    if (isNoise(name)) return;
    result.push({ name, imgUrl });
  });
  return result;
};

// ---- パターン3: ap2hp CDN /therapist/ (Aroma Rich) ----
const parseAp2hp = ($) => {
  const result = [];
  $('img[src*="/therapist/"]').each((_, el) => {
    const name = $(el).attr('alt')?.trim() || '';
    const imgUrl = $(el).attr('src') || '';
    if (!name || name.length === 0) return;
    if (/banner|logo|icon/i.test(name)) return;
    result.push({ name, imgUrl });
  });
  return result;
};

// ---- パターン4: ONE time (img[alt^="ONE Time "]) 名前のみ・写真なし ----
const parseOneTime = ($) => {
  const result = [];
  const seen = new Set();
  $('img[alt^="ONE Time "]').each((_, el) => {
    const alt = $(el).attr('alt') || '';
    const name = alt.replace(/^ONE Time\s+/, '').trim();
    if (!name || seen.has(name)) return;
    seen.add(name);
    result.push({ name, imgUrl: null });
  });
  return result;
};

// ---- 店舗定義 ----
const SHOPS = [
  {
    id: 'miyagi_sendai_pulunt',
    label: 'Pulunt (プルント)',
    url: 'https://pulunt.net/girl',
    parse: (html) => parseGirlsBox(cheerio.load(html), 'https://pulunt.net'),
  },
  {
    id: 'miyagi_sendai_arena_spa',
    label: 'ARENA SPA (アリーナスパ)',
    url: 'https://arena-spa.com/s/girl',
    parse: (html) => parseCPanel(cheerio.load(html), 'https://arena-spa.com'),
  },
  {
    id: 'miyagi_sendai_platonic_spa',
    label: 'Platonic SPA (プラトニックスパ)',
    url: 'https://platonic-spa.com/girl',
    parse: (html) => parseCPanel(cheerio.load(html), 'https://platonic-spa.com'),
  },
  {
    id: 'miyagi_sendai_shizuku_spa',
    label: 'SHIZUKU SPA (雫スパ)',
    url: 'https://shizuku-spa.com/girl',
    parse: (html) => parseCPanel(cheerio.load(html), 'https://shizuku-spa.com'),
  },
  {
    id: 'miyagi_sendai_aroma_rich',
    label: 'Aroma Rich (アロマリッチ)',
    url: 'https://rich-sendai.com/',
    parse: (html) => parseAp2hp(cheerio.load(html)),
  },
  {
    id: 'miyagi_sendai_onetime',
    label: 'ONE time (ワンタイム)',
    url: 'https://onetime-sendai.com/cast/',
    parse: (html) => parseOneTime(cheerio.load(html)),
  },
];

// ---- メイン処理 ----
let totalInserted = 0, totalErrors = 0;

for (const shop of SHOPS) {
  if (SHOP_FILTER && shop.id !== SHOP_FILTER) continue;

  console.log(`\n=== ${shop.label} ===`);

  let html;
  try {
    html = await fetchHtml(shop.url);
  } catch (e) {
    console.error(`❌ 取得失敗: ${e.message}`);
    continue;
  }

  const therapists = shop.parse(html);
  console.log(`取得: ${therapists.length}名`);

  if (DRY_RUN) {
    therapists.forEach((t, i) =>
      console.log(`  [${i + 1}] ${t.name} → ${t.imgUrl || '(画像なし)'}`)
    );
    continue;
  }

  // 既存確認
  const { count: existing } = await supabase
    .from('therapists').select('id', { count: 'exact', head: true }).eq('shop_id', shop.id);
  console.log(`既存: ${existing}名`);

  let inserted = 0, errors = 0;
  for (const t of therapists) {
    const id = `${shop.id}_${t.name}`;
    const { error } = await supabase.from('therapists').upsert({
      id,
      shop_id: shop.id,
      name: t.name,
      image_url: t.imgUrl || null,
    }, { onConflict: 'id' });

    if (error) { console.error(`❌ ${t.name}: ${error.message}`); errors++; }
    else        { console.log(`✅ ${t.name}`); inserted++; }
  }

  console.log(`完了: 挿入/更新 ${inserted}名, エラー ${errors}名`);
  totalInserted += inserted;
  totalErrors += errors;
}

if (!SHOP_FILTER) {
  console.log(`\n===== 全体完了 =====`);
  console.log(`合計 挿入/更新: ${totalInserted}名, エラー: ${totalErrors}名`);
}
