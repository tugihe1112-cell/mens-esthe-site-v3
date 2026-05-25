/**
 * doigt de fee 全エントリのテキスト確認
 * 実行: node scripts/debug/debug_doigt_all_entries.mjs
 */
import * as cheerio from 'cheerio';

const SITE = 'https://exe-fee.com';
const LADY_URL = `${SITE}/lady/`;
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

async function run() {
  const res = await fetch(LADY_URL, { headers: ua });
  const $ = cheerio.load(await res.text());
  console.log(`HTTP: ${res.status}`);

  // ── A. h2.elps > div.txtData > a のテキスト全件 ──────────
  console.log('\n=== h2.elps内リンクのテキスト（全件） ===');
  const nameLinks = $('h2.elps a[href*="/lady/"]');
  console.log(`総数: ${nameLinks.length}`);
  nameLinks.each((i, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text) console.log(`[${i}] "${text}"`);
  });

  // ── B. li の直接子テキスト構造（非キャンペーン候補） ─────────
  console.log('\n=== li内の全テキスト（先頭30件） ===');
  $('li:has(img[src*="imgsrv.jp"])').slice(0, 30).each((i, el) => {
    const liText = $(el).text().replace(/\s+/g, ' ').trim().slice(0, 120);
    const imgSrc = $(el).find('img[src*="imgsrv"]').first().attr('src') || '';
    const href = $(el).find('a[href*="/lady/"]').first().attr('href') || '';
    console.log(`[${i}] href="${href}" text="${liText}"`);
  });

  // ── C. 全ての 【】 テキストと出現回数 ──────────────────────
  console.log('\n=== 全【】テキスト出現回数 ===');
  const counts = {};
  $('h2.elps a[href*="/lady/"]').each((_, el) => {
    const text = $(el).text();
    const m = text.match(/【([^】]+)】/g);
    if (m) m.forEach(t => {
      counts[t] = (counts[t] || 0) + 1;
    });
  });
  Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k}: ${v}件`);
  });

  // ── D. 川崎エントリの詳細 ────────────────────────────────
  console.log('\n=== 川崎エントリ詳細 ===');
  $('h2.elps a[href*="/lady/"]').each((i, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text.includes('川崎')) {
      console.log(`  [${i}] "${text}" href="${$(el).attr('href')}"`);
    }
  });

  // ── E. 「川崎」を含む li の h2リンクテキスト確認 ─────────
  console.log('\n=== 全li内テキスト（川崎含む）===');
  $('li:has(img[src*="imgsrv.jp"])').each((i, el) => {
    const text = $(el).text();
    if (text.includes('川崎')) {
      const liText = text.replace(/\s+/g, ' ').trim().slice(0, 150);
      console.log(`  [${i}] "${liText}"`);
    }
  });
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
