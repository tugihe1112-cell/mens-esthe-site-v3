/**
 * スペーサー画像 一括修正スクリプト
 * 対象: background-image + "さんの写真" パターンの全店舗（24店舗）
 *
 * 実行: node scripts/maintenance/fix_all_spacer_images.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const isDryRun = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

if (isDryRun) console.log('=== DRY RUN モード ===\n');

// --- 対象店舗リスト ---
// website_urlが同じグループは一回だけフェッチし、全店舗に適用
const SHOP_GROUPS = [
  {
    label: '天界のスパ',
    shopIds: ['tokyo_meguro_nakameguro_tenkai_no_spa'],
    url: 'https://www.tennesu.com/staff/',
  },
  {
    label: 'ar Tokyo',
    shopIds: ['tokyo_chiyoda_akihabara_ar_tokyo'],
    url: 'https://www.ms-ar.tokyo/staff/',
  },
  {
    label: 'ビコーズ',
    shopIds: ['tokyo_dispatch_because'],
    url: 'http://www.ms-because.tokyo/staff/',
  },
  {
    label: 'ぐらどるスパ',
    shopIds: ['tokyo_tachikawa_tachikawa_gladol-spa'],
    url: 'https://www.gladol-spa.tokyo/staff/',
  },
  {
    label: 'EREN（全5店舗）',
    shopIds: [
      'tokyo_setagaya_eren_kyodo',
      'tokyo_setagaya_shimokitazawa_eren',
      'tokyo_setagaya_eren_soshigaya',
      'tokyo_shibuya_eren',
      'tokyo_setagaya_eren_shimokita',
    ],
    url: 'http://www.eren.tokyo/staff/',
  },
  {
    label: 'PEPE SPA（全6店舗）',
    shopIds: [
      'kanagawa_fujisawa_pepe_spa',
      'tokyo_chofu_chofu_pepe_spa',
      'tokyo_hachioji_hachioji_pepe_spa',
      'tokyo_machida_machida_pepe_spa',
      'tokyo_ota_kamata_pepe_spa',
      'tokyo_setagaya_shimokitazawa_pepe_spa',
    ],
    url: 'https://www.pepespa.com/staff/',
  },
  {
    label: 'Deep Black',
    shopIds: ['tokyo_arakawa_nippori_deep_black'],
    url: 'https://www.deep-black.tokyo/cast/',
  },
  {
    label: 'シャルル',
    shopIds: ['tokyo_fuchu_syalulu'],
    url: 'https://www.syalulu.tokyo/staff/',
  },
  {
    label: 'Everything',
    shopIds: ['tokyo_meguro_meguro_everything'],
    url: 'https://www.every-thing.jp/staff/',
  },
  {
    label: 'ONE ROOM（全2店舗）',
    shopIds: [
      'tokyo_shinjuku_higashishinjuku_oneroom',
      'tokyo_shinjuku_shinjuku_gyoen_oneroom',
    ],
    url: 'https://www.oneroom-shinjyuku.com/staff/',
  },
  {
    label: '東京えすてクラブ（全4店舗）',
    shopIds: [
      'tokyo_meguro_gakugei_daigaku_tokyo_esthe_club',
      'tokyo_setagaya_komazawa_daigaku_tokyo_esthe_club',
      'tokyo_setagaya_sakurashinmachi_tokyo_esthe_club',
      'tokyo_setagaya_yoga_tokyo_esthe_club',
    ],
    url: 'https://www.esthe-club.tokyo/staff/',
  },
];

// ノイズ判定（セラピスト名として不適切なもの）
function isNoise(name) {
  if (!name || name.length === 0) return true;
  if (name.length > 20) return true;
  if (/割引|Twitter|Bluesky|WEB予約|早割|フリー|限定|情報予約|キャンペーン/.test(name)) return true;
  if (/[🔴🟡🟢★☆◆♦！]{2,}/.test(name)) return true; // 連続する装飾文字
  if (/^[《》【】\[\]「」『』<>]+/.test(name)) return true; // 括弧で始まる
  // 数字・英字・記号のみ（日本語なし）かつ人名らしくない
  if (!/[ぁ-んァ-ヾ一-龯]/.test(name) && !/^[A-Za-zÀ-ÿ\s゠-ヿ]+$/.test(name)) return true;
  return false;
}

// サイトのHTMLからname-image ペアを抽出
function extractPairs(html, baseUrl) {
  const $ = cheerio.load(html);
  const pairs = [];
  const seen = new Set();

  $('img[alt*="さんの写真"]').each((_, el) => {
    const alt = $(el).attr('alt') || '';
    const style = $(el).attr('style') || '';

    // background-image を自要素または親要素から探す
    let imgPath = style.match(/url\(['"]?([^'")\s]+)['"]?\)/)?.[1];
    if (!imgPath) {
      // 親要素を5段階まで探す
      let parent = $(el).parent();
      for (let i = 0; i < 5; i++) {
        const ps = parent.attr('style') || '';
        const m = ps.match(/url\(['"]?([^'")\s]+)['"]?\)/);
        if (m) { imgPath = m[1]; break; }
        parent = parent.parent();
      }
    }
    if (!imgPath) return;

    const imgUrl = imgPath.startsWith('http') ? imgPath : baseUrl + imgPath;

    // 名前: "〇〇さんの写真" → "〇〇"、余分なスペース・括弧を除去
    let name = alt
      .replace(/さんの写真$/, '')
      .replace(/\s+/g, ' ')         // 連続スペースを1つに
      .replace(/　/g, ' ')           // 全角スペースを半角に
      .trim();

    if (!name || seen.has(name)) return;
    if (isNoise(name)) return;
    seen.add(name);
    pairs.push({ name, img: imgUrl });
  });

  return pairs;
}

// 名前の正規化（照合用）- DB名の「さんの写真」サフィックスも除去
function normName(s) {
  return (s || '')
    .replace(/さんの写真$/, '')  // DBに「さんの写真」付きで登録されている場合の対応
    .replace(/\s/g, '')
    .replace(/　/g, '')
    .trim();
}

// --- メイン処理 ---
let grandTotal = { updated: 0, added: 0, notFound: 0, skipped: 0, error: 0 };

for (const group of SHOP_GROUPS) {
  console.log(`\n${'━'.repeat(60)}`);
  console.log(`【${group.label}】`);

  // サイト取得
  let html;
  try {
    const r = await fetch(group.url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    html = await r.text();
  } catch (e) {
    console.log(`  ✗ 取得失敗: ${e.message}`);
    continue;
  }

  // URLのベース部分（パスなし）
  const urlObj = new URL(group.url);
  const baseUrl = `${urlObj.protocol}//${urlObj.host}`;

  const sitePairs = extractPairs(html, baseUrl);
  console.log(`  サイトから ${sitePairs.length}名 取得`);

  // 各店舗に適用
  for (const shopId of group.shopIds) {
    console.log(`\n  [${shopId}]`);

    // DB から全セラピスト取得（写真あり含め全員）
    const { data: allTherapists } = await supabase
      .from('therapists')
      .select('id, name, image_url')
      .eq('shop_id', shopId);

    // dbMap は全員で構築（照合・スキップ判定に使う）
    const dbMap = new Map();
    for (const t of allTherapists || []) {
      dbMap.set(normName(t.name), t);
    }

    // missedInDb 用: spacer/null のもののみ（退職者判定対象）
    const therapists = (allTherapists || []).filter(t =>
      !t.image_url || t.image_url.toLowerCase().includes('spacer')
    );

    let updated = 0, added = 0, notFound = 0, skipped = 0;

    for (const { name, img } of sitePairs) {
      // 名前照合（通常 / スペース除去 / 全角スペース除去）
      const match =
        dbMap.get(normName(name)) ||
        dbMap.get(name) ||
        null;

      if (match) {
        // DB にあって spacer/null → 更新
        const isSpacer = match.image_url?.includes('spacer');
        const isNull = !match.image_url;
        if (!isSpacer && !isNull) {
          skipped++;
          continue;
        }
        // DB名に「さんの写真」が含まれていれば同時に修正
        const nameNeedsFixing = match.name?.endsWith('さんの写真');
        const updatePayload = { image_url: img };
        if (nameNeedsFixing) {
          const fixedName = match.name.replace(/さんの写真$/, '').trim();
          updatePayload.name = fixedName;
          console.log(`    ${isDryRun ? '[DRY]' : '✅'} ${match.name} → name修正+写真更新`);
        } else {
          console.log(`    ${isDryRun ? '[DRY]' : '✅'} ${name}`);
        }
        if (!isDryRun) {
          const { error } = await supabase
            .from('therapists')
            .update(updatePayload)
            .eq('id', match.id);
          if (error) { console.error(`      ERROR: ${error.message}`); grandTotal.error++; }
        }
        updated++;
      } else {
        // DB 未登録 → 新規追加
        console.log(`    ${isDryRun ? '[DRY+]' : '➕'} ${name} (新規)`);
        if (!isDryRun) {
          const newId = `${shopId}_${name}`;
          const { error } = await supabase.from('therapists').insert({
            id: newId, shop_id: shopId, name, image_url: img,
          });
          if (error) {
            // 既存IDと衝突した場合はupsert
            if (error.code === '23505') {
              const { error: e2 } = await supabase
                .from('therapists')
                .update({ image_url: img })
                .eq('id', newId);
              if (e2) console.error(`      UPSERT ERROR: ${e2.message}`);
              else { updated++; continue; }
            } else {
              console.error(`      INSERT ERROR: ${error.message}`);
              grandTotal.error++;
            }
          } else added++;
        } else {
          added++;
        }
      }
    }

    // サイトにいなくてDBにいるセラピスト（退職者）
    const siteNames = new Set(sitePairs.map(p => normName(p.name)));
    const missedInDb = (therapists || []).filter(t => !siteNames.has(normName(t.name)));
    if (missedInDb.length > 0) {
      console.log(`    ⚠ サイトに不在（退職？）: ${missedInDb.map(t => t.name).join(', ')}`);
      notFound = missedInDb.length;
    }

    console.log(`    → 更新: ${updated}件, 新規: ${added}件, 未照合: ${notFound}件, スキップ: ${skipped}件`);
    grandTotal.updated += updated;
    grandTotal.added += added;
    grandTotal.notFound += notFound;
    grandTotal.skipped += skipped;
  }
}

console.log(`\n${'━'.repeat(60)}`);
console.log(`【合計】更新: ${grandTotal.updated}件, 新規: ${grandTotal.added}件, 未照合: ${grandTotal.notFound}件, スキップ: ${grandTotal.skipped}件, エラー: ${grandTotal.error}件`);
