/**
 * 京都府 全店舗セラピスト登録スクリプト
 * 実行: node scripts/maintenance/process_kyoto_therapists.mjs [--dry-run]
 */
import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

async function fetchHtml(url, referer) {
  const headers = { 'User-Agent': UA };
  if (referer) headers['Referer'] = referer;
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
  return res.text();
}

// ──────────────────────────────────────────────
// 各店舗のセラピスト取得関数
// ──────────────────────────────────────────────

// ARROW京都 (Crayonsite)
async function getArrowKyoto() {
  const html = await fetchHtml('https://www.arrowkyoto.com/p/9/');
  const $ = cheerio.load(html);
  const result = [];
  $('*').each((_, el) => {
    const $el = $(el);
    if ($el.children().length === 0) {
      const text = $el.text().trim().replace(/[❤️💕♡♥]/g, '').trim();
      if (text.length >= 2 && text.length <= 8 && /[ぁ-んァ-ヾ一-龯]/.test(text)) {
        const parent = $el.closest('div,li,section,article');
        const imgSrc = parent.find('img[src*="crayonimg"], img[src*="e-shops"]').first().attr('src');
        if (imgSrc && !result.find(t => t.name === text)) {
          result.push({ name: text, image_url: imgSrc });
        }
      }
    }
  });
  return result;
}

// WINKLE (WordPress portfolio-post)
async function getWinkle() {
  const html = await fetchHtml('https://kyoto-winkle.com/therapist-2/');
  const $ = cheerio.load(html);
  const result = [];
  $('.portfolio-post').each((_, block) => {
    const $block = $(block);
    const imgSrc = $block.find('img[src*="wp-content/uploads"]').first().attr('src');
    // 最初の日本語テキスト要素を名前とする
    let name = null;
    $block.find('*').each((_, el) => {
      if (name) return;
      const $el = $(el);
      if ($el.children().length === 0) {
        const t = $el.text().trim();
        if (/[ぁ-んァ-ヾ一-龯]/.test(t) && t.length < 20 && !/(Age|Tall|cm|kg)/.test(t)) {
          name = t.replace(/\s+/g,' ').trim();
        }
      }
    });
    if (name && /[ぁ-んァ-ヾ一-龯]/.test(name) && imgSrc) {
      result.push({ name, image_url: imgSrc });
    }
  });
  return result;
}

// ゆりかご京都 (WordPress therapistbox)
async function getYurikago() {
  const html = await fetchHtml('https://yurikago-kyoto.com/therapist/');
  const $ = cheerio.load(html);
  const result = [];
  $('.therapistbox').each((_, block) => {
    const $block = $(block);
    const rawName = $block.find('.therapist_name').first().text().trim();
    const imgSrc = $block.find('img[src*="wp-content"]').first().attr('src');
    const name = rawName
      .replace(/（[^）]*）/g, '').replace(/\([^)]*\)/g, '')
      .replace(/\s*\d+\/\d+\s*/g, '').replace(/デビュー.*/,'').replace(/延期.*/,'')
      .trim();
    if (name.length >= 2 && /[ぁ-んァ-ヾ一-龯]/.test(name)) {
      result.push({ name, image_url: imgSrc || null });
    }
  });
  return result;
}

// Mrs.Flower Spa (/pic/girl/ パターン)
async function getFlowerSpa() {
  const html = await fetchHtml('https://flowerspa-kyoto.com/girllist');
  const $ = cheerio.load(html);
  const result = [];
  $('img[src*="/pic/girl/"]').each((_, el) => {
    const alt = $(el).attr('alt') || '';
    const src = $(el).attr('src') || '';
    const name = alt.replace(/～[^～]*～/g, '').trim();
    if (name.length >= 1 && /[ぁ-んァ-ヾ一-龯]/.test(name) && !result.find(t => t.name === name)) {
      result.push({ name, image_url: src });
    }
  });
  return result;
}

// ONLY (images_staff パターン)
async function getOnly() {
  const html = await fetchHtml('https://only-kyoto.net/staff.php', 'https://only-kyoto.net/');
  const $ = cheerio.load(html);
  const result = [];
  $('img[src*="images_staff"]').each((_, el) => {
    const name = ($(el).attr('alt') || '').trim().replace(/\s+/g,' ');
    const src = $(el).attr('src') || '';
    if (name.length >= 2 && /[ぁ-んァ-ヾ一-龯]/.test(name) && !result.find(t => t.name === name)) {
      result.push({ name, image_url: src });
    }
  });
  return result;
}

// Kiyoの部屋 (/upload/cast/thumb_ パターン)
async function getKiyo() {
  const html = await fetchHtml('https://mens-kiyo.com/cast/');
  const $ = cheerio.load(html);
  const result = [];
  $('img[alt*="Kiyoの部屋"]').each((_, el) => {
    const name = ($(el).attr('alt') || '').replace('Kiyoの部屋','').trim();
    const src = ($(el).attr('src') || '').split('?')[0];
    if (name.length >= 2 && /[ぁ-んァ-ヾ一-龯]/.test(name) && !name.includes('セラピスト') && !result.find(t=>t.name===name)) {
      result.push({ name, image_url: src });
    }
  });
  return result;
}

// Ti.ana (images_staff パターン)
async function getTiana() {
  const html = await fetchHtml('https://tiana-esthe.com/staff.php', 'https://tiana-esthe.com/');
  const $ = cheerio.load(html);
  const result = [];
  $('img[src*="images_staff"]').each((_, el) => {
    const name = ($(el).attr('alt') || '').trim().replace(/\s+/g,' ');
    const src = $(el).attr('src') || '';
    if (name.length >= 2 && /[ぁ-んァ-ヾ一-龯]/.test(name) && !result.find(t=>t.name===name)) {
      result.push({ name, image_url: src });
    }
  });
  return result;
}

// SPADE (/upload/cast/ パターン)
async function getSpade() {
  const html = await fetchHtml('https://esthe-spade.com/cast/');
  const $ = cheerio.load(html);
  const result = [];
  $('img[src*="/upload/cast/"]').each((_, el) => {
    const name = ($(el).attr('alt') || '').replace(/SPADE～スペード～\s*/,'').trim();
    const src = ($(el).attr('src') || '').split('?')[0];
    if (name.length >= 2 && /[ぁ-んァ-ヾ一-龯]/.test(name) && !result.find(t=>t.name===name)) {
      result.push({ name, image_url: src });
    }
  });
  return result;
}

// P-パラ (spacer + background-image パターン)
async function getPpara() {
  const html = await fetchHtml('https://www.p-para-kyoto.com/staff/');
  const $ = cheerio.load(html);
  const result = [];
  $('img[alt*="さんの写真"]').each((_, el) => {
    const name = ($(el).attr('alt') || '').replace('さんの写真','').trim();
    const style = $(el).attr('style') || '';
    const parentStyle = $(el).parent().attr('style') || $(el).closest('[style]').attr('style') || '';
    const imgUrl = (style + parentStyle).match(/url\(['"]?([^'")\s]+)['"]?\)/)?.[1] || null;
    const imageUrl = imgUrl ? (imgUrl.startsWith('http') ? imgUrl : `https://www.p-para-kyoto.com${imgUrl}`) : null;
    if (name.length >= 2 && /[ぁ-んァ-ヾ一-龯a-zA-Z]/.test(name) && !result.find(t=>t.name===name)) {
      result.push({ name, image_url: imageUrl });
    }
  });
  return result;
}

// FAIRY BAY (/images/therapist/ パターン)
async function getFairyBay() {
  const html = await fetchHtml('https://mensesthe-kyoto.com/therapist/');
  const $ = cheerio.load(html);
  const result = [];
  $('img[src*="/images/therapist/"]').each((_, el) => {
    const alt = $(el).attr('alt') || '';
    const name = alt.split('〜')[0].split('～')[0].replace(/｜.*$/,'').trim();
    const src = $(el).attr('src') || '';
    if (name.length >= 2 && /[ぁ-んァ-ヾ一-龯]/.test(name) && !/(セラピスト|フェアリー|FAIRY)/.test(name) && !result.find(t=>t.name===name)) {
      result.push({ name, image_url: src });
    }
  });
  return result;
}

// ──────────────────────────────────────────────
// メイン処理
// ──────────────────────────────────────────────

const SHOPS = [
  { shopId: 'kyoto_kyoto_arrow',      fn: getArrowKyoto,  label: 'ARROW京都' },
  { shopId: 'kyoto_kyoto_winkle',     fn: getWinkle,       label: 'WINKLE' },
  { shopId: 'kyoto_kyoto_yurikago',   fn: getYurikago,     label: 'ゆりかご京都' },
  { shopId: 'kyoto_kyoto_flower_spa', fn: getFlowerSpa,    label: 'Mrs.Flower Spa' },
  { shopId: 'kyoto_kyoto_only',       fn: getOnly,         label: 'ONLY' },
  { shopId: 'kyoto_kyoto_kiyo',       fn: getKiyo,         label: 'Kiyoの部屋' },
  { shopId: 'kyoto_kyoto_tiana',      fn: getTiana,        label: 'Ti.ana' },
  { shopId: 'kyoto_kyoto_spade',      fn: getSpade,        label: 'SPADE' },
  { shopId: 'kyoto_kyoto_ppara',      fn: getPpara,        label: 'P-パラ' },
  { shopId: 'kyoto_kyoto_fairy_bay',  fn: getFairyBay,     label: 'FAIRY BAY' },
];

console.log(`京都 セラピスト登録 (dry-run: ${DRY_RUN})\n`);

let totalInserted = 0, totalSkipped = 0, totalError = 0;

for (const { shopId, fn, label } of SHOPS) {
  console.log(`\n--- ${label} (${shopId}) ---`);
  let therapists = [];
  try {
    therapists = await fn();
    console.log(`  取得: ${therapists.length}名`);
  } catch(e) {
    console.error(`  ERROR fetch: ${e.message}`);
    continue;
  }

  if (therapists.length === 0) {
    console.log('  取得なし（スキップ）');
    continue;
  }

  // 既存チェック
  const { data: existing } = await supabase
    .from('therapists')
    .select('id, name')
    .eq('shop_id', shopId);
  const existingNames = new Set((existing || []).map(t => t.name.replace(/[\s　]/g,'')));

  let inserted = 0, skipped = 0;
  for (const t of therapists) {
    const normName = t.name.replace(/[\s　]/g,'');
    if (existingNames.has(normName)) { skipped++; continue; }

    const id = `${shopId}_${t.name.replace(/\s+/g,'_')}`;
    if (!DRY_RUN) {
      const { error } = await supabase.from('therapists').upsert({
        id,
        shop_id: shopId,
        name: t.name,
        image_url: t.image_url || null,
      }, { onConflict: 'id' });
      if (error) { console.error(`  ERROR insert ${t.name}: ${error.message}`); totalError++; continue; }
    }
    inserted++;
  }
  console.log(`  登録: ${inserted}名 / スキップ: ${skipped}名`);
  totalInserted += inserted;
  totalSkipped += skipped;
}

console.log(`\n============================`);
console.log(`合計 登録: ${totalInserted}名 / スキップ: ${totalSkipped}名 / エラー: ${totalError}名`);
console.log(`(dry-run: ${DRY_RUN})`);
