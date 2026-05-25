/**
 * Tigger (旧Jesse) サイト構造確認
 * 実行: node scripts/debug/debug_tigger.mjs
 */
import * as cheerio from 'cheerio';

const SITE = 'https://tigger-esthe.com';
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

async function run() {
  // ── therapist ページ ──────────────────────────────────────────
  console.log('=== /therapist ページ ===');
  const res = await fetch(`${SITE}/therapist`, { headers: ua });
  const $ = cheerio.load(await res.text());
  console.log(`HTTP: ${res.status}`);

  // img 総数
  const allImgs = $('img');
  console.log(`img 総数: ${allImgs.length}`);

  // imgsrv / S3 / CDN 画像
  console.log('\n=== サムネイル候補img (先頭10) ===');
  $('img').slice(0, 10).each((i, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || '';
    const alt = $(el).attr('alt') || '';
    console.log(`  [${i}] src="${src.slice(0, 80)}" alt="${alt.slice(0, 30)}"`);
  });

  // /therapist/ID リンク
  console.log('\n=== /therapist/ID リンク ===');
  const castLinks = new Set();
  $('a[href*="/therapist/"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (/\/therapist\/\d+/.test(href)) castLinks.add(href);
  });
  console.log(`件数: ${castLinks.size}`);
  [...castLinks].slice(0, 5).forEach(l => console.log(`  ${l}`));

  // li / article 構造
  console.log('\n=== li/article 先頭5 ===');
  $('li:has(img), article:has(img)').slice(0, 5).each((i, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim().slice(0, 100);
    const img = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src') || '';
    const href = $(el).find('a').first().attr('href') || '';
    console.log(`  [${i}] href="${href}" img="${img.slice(0, 60)}" text="${text}"`);
  });

  // ルーム・店舗名
  console.log('\n=== ルーム/店舗名候補 ===');
  $('[class*="room"],[class*="shop"],[class*="branch"],[class*="area"]').slice(0, 6).each((i, el) => {
    const cls = $(el).attr('class') || '';
    const text = $(el).text().replace(/\s+/g, ' ').trim().slice(0, 60);
    if (text) console.log(`  cls="${cls.slice(0, 40)}" "${text}"`);
  });

  // name/cast 系クラス
  console.log('\n=== name/cast クラス (先頭6) ===');
  $('[class*="name"],[class*="cast"],[class*="therapist"],[class*="staff"]').slice(0, 6).each((i, el) => {
    const cls = $(el).attr('class') || '';
    const text = $(el).text().replace(/\s+/g, ' ').trim().slice(0, 60);
    if (text) console.log(`  cls="${cls.slice(0, 40)}" "${text}"`);
  });

  // ロゴ
  console.log('\n=== ロゴ候補 ===');
  $('img[src*="logo"], header img, .logo img, #logo img').slice(0, 3).each((i, el) => {
    console.log(`  ${$(el).attr('src') || ''}`);
  });

  // ── schedule ページ ───────────────────────────────────────────
  console.log('\n=== /schedule ページ ===');
  const sRes = await fetch(`${SITE}/schedule`, { headers: ua });
  const s$ = cheerio.load(await sRes.text());
  console.log(`HTTP: ${sRes.status}`);
  console.log(`img 総数: ${s$('img').length}`);
  s$('img').slice(0, 5).each((i, el) => {
    const src = s$(el).attr('src') || s$(el).attr('data-src') || '';
    console.log(`  [${i}] ${src.slice(0, 80)}`);
  });
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
