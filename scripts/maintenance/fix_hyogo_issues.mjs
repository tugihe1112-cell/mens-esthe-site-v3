/**
 * 兵庫店舗 問題修正
 * 1. 10ct RESORT: 誤ったセラピスト削除
 * 2. KOBE QUEEN: 店舗画像を別候補でリトライ
 * 3. ミセスムーンR / 神戸エスリノ のサイト構造調査
 *
 * 実行: node scripts/maintenance/fix_hyogo_issues.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const ua = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

async function fetchHtml(url) {
  const res = await fetch(url, { headers: ua, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function uploadShopLogo(imageUrl, shopId) {
  try {
    const res = await fetch(imageUrl, { headers: { 'User-Agent': ua['User-Agent'] }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) { console.log(`  HTTP ${res.status}: ${imageUrl}`); return null; }
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) { console.log(`  NG: ${contentType}`); return null; }
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 512) { console.log(`  NG: サイズ小 ${buffer.length}bytes`); return null; }
    const ext = imageUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
    const safeId = shopId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${safeId}.${ext}`;
    const { error } = await supabase.storage.from('shop-logos')
      .upload(fileName, buffer, { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('shop-logos').getPublicUrl(fileName);
    return publicUrl;
  } catch (e) { console.log(`  エラー: ${e.message}`); return null; }
}

// ============================================================
// 1. 10ct RESORT: 誤ったセラピスト削除
// ============================================================
console.log('=== 1. 10ct RESORT 誤データ削除 ===');
const { data: wrongTherapists } = await supabase.from('therapists')
  .select('id, name')
  .eq('shop_id', 'hyogo_sannomiya_10ct_resort');

console.log('現在のセラピスト:', JSON.stringify(wrongTherapists));

if (wrongTherapists && wrongTherapists.length > 0) {
  const idsToDelete = wrongTherapists.map(t => t.id);
  const { error } = await supabase.from('therapists').delete().in('id', idsToDelete);
  console.log(error ? `❌ 削除失敗: ${error.message}` : `✅ ${idsToDelete.length}名削除完了`);
} else {
  console.log('セラピストなし（すでにクリーン）');
}

// ============================================================
// 2. KOBE QUEEN: 店舗画像リトライ
// ============================================================
console.log('\n=== 2. KOBE QUEEN 店舗画像 ===');
const queenHtml = await fetchHtml('https://kobe-queen.net/').catch(e => { console.log('取得失敗:', e.message); return ''; });
if (queenHtml) {
  const $ = cheerio.load(queenHtml);
  const ogImg = $('meta[property="og:image"]').attr('content');
  console.log('OGP image:', ogImg);

  // 全画像URLを列挙
  const imgs = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || '';
    if (src) imgs.push({ src, alt: $(el).attr('alt') || '' });
  });
  console.log('画像一覧 (先頭10件):');
  imgs.slice(0, 10).forEach(i => console.log(`  [${i.alt}] ${i.src}`));

  // OGP画像を試す
  if (ogImg) {
    const fullOgp = ogImg.startsWith('http') ? ogImg : new URL(ogImg, 'https://kobe-queen.net/').href;
    console.log('\nOGP画像でアップロード試行:', fullOgp);
    const stored = await uploadShopLogo(fullOgp, 'hyogo_sannomiya_kobe_queen');
    if (stored) {
      const { error } = await supabase.from('shops').update({ image_url: stored }).eq('id', 'hyogo_sannomiya_kobe_queen');
      console.log(error ? `❌ DB更新失敗: ${error.message}` : `✅ 店舗画像設置: ${stored}`);
    } else {
      // フォールバック: 最初の画像を試す
      for (const img of imgs.slice(0, 5)) {
        if (!img.src) continue;
        const fullSrc = img.src.startsWith('http') ? img.src : new URL(img.src, 'https://kobe-queen.net/').href;
        console.log('フォールバック試行:', fullSrc);
        const s = await uploadShopLogo(fullSrc, 'hyogo_sannomiya_kobe_queen');
        if (s) {
          const { error } = await supabase.from('shops').update({ image_url: s }).eq('id', 'hyogo_sannomiya_kobe_queen');
          console.log(error ? `❌ DB更新失敗` : `✅ 店舗画像設置: ${s}`);
          break;
        }
      }
    }
  }
}

// ============================================================
// 3. ミセスムーンR (wcms) サイト構造調査
// ============================================================
console.log('\n=== 3. ミセスムーンR サイト構造 ===');
const moonHtml = await fetchHtml('https://moor-kobe.jp/').catch(e => { console.log('取得失敗:', e.message); return ''; });
if (moonHtml) {
  const $ = cheerio.load(moonHtml);
  // キャストページへのリンクを探す
  const links = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim();
    if (/cast|girl|lady|セラピスト|在籍|staff|member/i.test(href + text)) {
      links.push({ href, text: text.slice(0, 20) });
    }
  });
  console.log('キャスト関連リンク:', JSON.stringify(links.slice(0, 10)));

  // wcmsのキャストブロックを探す
  const wcmsBlocks = $('div.member_info, li.member_item, div[class*="cast_profile"], div[class*="cast"], .cast').length;
  console.log('wcmsキャストブロック数:', wcmsBlocks);

  // 全imgのsrcを確認
  const imgs2 = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt') || '';
    if (src) imgs2.push(`[${alt}] ${src}`);
  });
  console.log('画像 (先頭15件):');
  imgs2.slice(0, 15).forEach(i => console.log(' ', i));
}

// ============================================================
// 4. 神戸エスリノ (men-es) サイト構造調査
// ============================================================
console.log('\n=== 4. 神戸エスリノ サイト構造 ===');
const eslinoHtml = await fetchHtml('https://eslino-kobe.com/').catch(e => { console.log('取得失敗:', e.message); return ''; });
if (eslinoHtml) {
  const $ = cheerio.load(eslinoHtml);
  // men-esのキャストリストを探す
  const castList = $('div.cast_list li, ul.cast li').length;
  console.log('cast_list 要素数:', castList);

  // キャストページリンク
  const links2 = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim();
    if (/cast|girl|lady|セラピスト|在籍|staff/i.test(href + text)) {
      links2.push({ href, text: text.slice(0, 20) });
    }
  });
  console.log('キャスト関連リンク:', JSON.stringify(links2.slice(0, 10)));

  // 全imgリスト
  const imgs3 = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt') || '';
    if (src && /cast|girl|staff|lady|photo|pic/i.test(src)) imgs3.push(`[${alt}] ${src}`);
  });
  console.log('キャスト系画像:', imgs3.slice(0, 10));
}

console.log('\n完了');
