/**
 * スペーサー画像汎用修正スクリプト
 * Silkと同じパターン: alt="〇〇さんの写真" + style="background-image: url(...)"
 *
 * 対象サイトで使われるCMSパターン:
 *   <img src="spacer300x450.png" alt="名前さんの写真" style="background-image: url(/images/xxx.jpg)">
 *
 * 使用法:
 *   node scripts/maintenance/fix_spacer_images_generic.mjs [--dry-run]
 *   node scripts/maintenance/fix_spacer_images_generic.mjs --shop=shop_id [--dry-run]
 *   node scripts/maintenance/fix_spacer_images_generic.mjs --all [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const isDryRun = process.argv.includes('--dry-run');
const targetShop = process.argv.find(a => a.startsWith('--shop='))?.replace('--shop=', '');
const doAll = process.argv.includes('--all');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// --- 店舗設定テーブル ---
// BASE: サイトのベースURL（画像URLがパス形式の場合に付加）
// staffPath: スタッフ一覧ページのパス
// nameMode: 名前抽出モード ('sanno'=「さんの写真」除去, 'alt'=altそのまま, 'custom'=カスタム関数)
// altFilter: altに含まれるべき文字列（省略時は"さんの写真"）
// customName: カスタム名前抽出関数 (altを受け取りnameを返す)
const SHOP_CONFIGS = [
  // --- PEPE SPA グループ ---
  {
    shopIdPattern: 'pepe_spa',  // shop_idにこの文字列を含む全店舗
    base: 'https://pepe-spa.com',
    staffPath: '/staff/',
    nameMode: 'sanno',
  },
  // --- Eren グループ ---
  {
    shopIdPattern: 'eren',
    base: null, // website_urlから動的取得
    staffPath: '/staff/',
    nameMode: 'sanno',
  },
  // --- AR TOKYO ---
  {
    shopId: 'tokyo_chiyoda_akihabara_ar_tokyo',
    base: null,
    staffPath: '/staff/',
    nameMode: 'sanno',
  },
  // --- Deep Black ---
  {
    shopId: 'tokyo_arakawa_nippori_deep_black',
    base: null,
    staffPath: '/staff/',
    nameMode: 'sanno',
  },
  // --- Syalulu ---
  {
    shopId: 'tokyo_fuchu_syalulu',
    base: null,
    staffPath: '/staff/',
    nameMode: 'sanno',
  },
  // --- Tokyo Esthe Club ---
  {
    shopIdPattern: 'tokyo_esthe_club',
    base: null,
    staffPath: '/staff/',
    nameMode: 'sanno',
  },
  // --- Everything ---
  {
    shopId: 'tokyo_meguro_meguro_everything',
    base: null,
    staffPath: '/staff/',
    nameMode: 'sanno',
  },
  // --- 天開のSPA ---
  {
    shopId: 'tokyo_meguro_nakameguro_tenkai_no_spa',
    base: null,
    staffPath: '/staff/',
    nameMode: 'sanno',
  },
  // --- Gladol Spa ---
  {
    shopId: 'tokyo_tachikawa_tachikawa_gladol-spa',
    base: null,
    staffPath: '/staff/',
    nameMode: 'sanno',
  },
  // --- Oneroom ---
  {
    shopId: 'tokyo_shinjuku_higashishinjuku_oneroom',
    base: null,
    staffPath: '/staff/',
    nameMode: 'sanno',
  },
];

// spacer画像を持つ全店舗取得
const { data: spacerTherapists } = await supabase
  .from('therapists')
  .select('shop_id')
  .ilike('image_url', '%spacer%');

const spacerShopIds = [...new Set(spacerTherapists.map(t => t.shop_id))];

// 処理対象店舗を決定
let targetShopIds = [];
if (targetShop) {
  targetShopIds = [targetShop];
} else if (doAll) {
  targetShopIds = spacerShopIds;
} else {
  console.log('使用法:');
  console.log('  node fix_spacer_images_generic.mjs --shop=<shop_id> [--dry-run]');
  console.log('  node fix_spacer_images_generic.mjs --all [--dry-run]');
  console.log('\nspacer画像を持つ店舗一覧:');
  const { data: shops } = await supabase
    .from('shops')
    .select('id, name, website_url')
    .in('id', spacerShopIds);
  const countByShop = {};
  for (const t of spacerTherapists) countByShop[t.shop_id] = (countByShop[t.shop_id] || 0) + 1;
  shops.sort((a, b) => (countByShop[b.id] || 0) - (countByShop[a.id] || 0));
  for (const s of shops) {
    console.log(`  ${s.id} (${countByShop[s.id]}名) - ${s.website_url || 'URLなし'}`);
  }
  process.exit(0);
}

// 店舗情報を取得
const { data: allShops } = await supabase
  .from('shops')
  .select('id, name, website_url')
  .in('id', targetShopIds);

let totalUpdated = 0, totalNotFound = 0, totalSkipped = 0, totalError = 0;

for (const shop of allShops) {
  const baseUrl = shop.website_url?.replace(/\/$/, '');
  if (!baseUrl) {
    console.log(`\n[${shop.id}] URLなし → スキップ`);
    continue;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`[${shop.id}] ${shop.name}`);

  // スタッフページを試行
  let html = null;
  let usedBase = baseUrl;
  const PATHS = ['/staff/', '/cast/', '/therapist/', '/girls/'];

  for (const path of PATHS) {
    try {
      const r = await fetch(baseUrl + path, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(10000),
      });
      if (r.ok) {
        html = await r.text();
        console.log(`  → ${path} 取得成功 (${html.length} chars)`);
        break;
      }
    } catch (e) {
      // 次を試す
    }
  }

  if (!html) {
    console.log('  → スタッフページ取得失敗');
    continue;
  }

  const $ = cheerio.load(html);

  // background-image + "さんの写真" パターンで抽出
  // 複数の要素パターンに対応
  const sitePairs = [];

  // パターン1: img[alt*="さんの写真"][style*="background-image"]
  $('img[alt*="さんの写真"][style*="background-image"]').each((_, el) => {
    const style = $(el).attr('style') || '';
    const alt = $(el).attr('alt') || '';
    const imgPath = style.match(/url\(['"]?([^'")\s]+)['"]?\)/)?.[1];
    if (!imgPath) return;
    const imgUrl = imgPath.startsWith('http') ? imgPath : `${usedBase}${imgPath}`;
    const name = alt.replace(/さんの写真$/, '').replace(/\([^()]*\)/g, '').replace(/（[^（）]*）/g, '').trim();
    if (name) sitePairs.push({ name, img: imgUrl });
  });

  // パターン2: img[src*="spacer"][alt*="さんの写真"] (styleはなく、親要素にbackground-image)
  if (sitePairs.length === 0) {
    $('img[src*="spacer"][alt*="さんの写真"]').each((_, el) => {
      const alt = $(el).attr('alt') || '';
      // 親要素のstyleを探す
      let parentEl = $(el).parent();
      let imgPath = null;
      for (let i = 0; i < 5; i++) {
        const style = parentEl.attr('style') || '';
        const match = style.match(/url\(['"]?([^'")\s]+)['"]?\)/);
        if (match) { imgPath = match[1]; break; }
        parentEl = parentEl.parent();
      }
      if (!imgPath) return;
      const imgUrl = imgPath.startsWith('http') ? imgPath : `${usedBase}${imgPath}`;
      const name = alt.replace(/さんの写真$/, '').replace(/\([^()]*\)/g, '').replace(/（[^（）]*）/g, '').trim();
      if (name) sitePairs.push({ name, img: imgUrl });
    });
  }

  console.log(`  サイトから取得: ${sitePairs.length}名`);
  if (sitePairs.length === 0) {
    console.log('  → "さんの写真"パターンが見つかりません。別途調査が必要です。');
    continue;
  }

  // DBのセラピスト取得（spacer画像のもの）
  const { data: therapists } = await supabase
    .from('therapists')
    .select('id, name, image_url')
    .eq('shop_id', shop.id)
    .ilike('image_url', '%spacer%');

  let updated = 0, notFound = 0, skipped = 0;

  for (const { name, img } of sitePairs) {
    const match = therapists?.find(t =>
      t.name === name ||
      t.name?.replace(/\s/g, '') === name.replace(/\s/g, '') ||
      t.name?.replace(/　/g, '') === name.replace(/　/g, '')
    );

    if (!match) {
      // DB未登録の場合は新規追加を検討
      const { data: existing } = await supabase
        .from('therapists')
        .select('id')
        .eq('shop_id', shop.id)
        .eq('name', name)
        .single();

      if (existing) {
        console.log(`  = スキップ（既に写真あり）: ${name}`);
        skipped++;
      } else {
        console.log(`  ? DB未登録: ${name} → ${img}`);
        notFound++;
        if (!isDryRun) {
          const newId = `${shop.id}_${name}`;
          const { error } = await supabase.from('therapists').insert({
            id: newId, shop_id: shop.id, name, image_url: img
          });
          if (error) console.error(`    INSERT ERROR: ${error.message}`);
          else { console.log(`    ✅ 新規追加`); updated++; }
        }
      }
      continue;
    }

    console.log(`  ${isDryRun ? '[DRY]' : '✅'} ${name} → ${img}`);
    if (!isDryRun) {
      const { error } = await supabase
        .from('therapists')
        .update({ image_url: img })
        .eq('id', match.id);
      if (error) { console.error(`    ERROR: ${error.message}`); totalError++; }
    }
    updated++;
  }

  console.log(`  更新: ${updated}件, 未照合: ${notFound}件, スキップ: ${skipped}件`);
  totalUpdated += updated;
  totalNotFound += notFound;
  totalSkipped += skipped;
}

console.log(`\n${'='.repeat(60)}`);
console.log(`合計 更新: ${totalUpdated}件, 未照合: ${totalNotFound}件, スキップ: ${totalSkipped}件, エラー: ${totalError}件`);
