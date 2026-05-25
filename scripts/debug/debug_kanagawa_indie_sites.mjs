/**
 * 神奈川独自サイト4店のセラピストページ構造確認
 * 実行: node scripts/debug/debug_kanagawa_indie_sites.mjs
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

const TARGETS = [
  { id: 'kanagawa_musashikosugi_royce',   url: 'https://aromaroyce.com/staff.php' },
  { id: 'kanagawa_yokohama_liora',         url: 'https://liora2024.com/girl' },
  { id: 'kanagawa_yokohama_guarigione',    url: 'https://www.spa-g.net/therapist.html' },
  { id: 'kanagawa_fujisawa_pepe_spa',      url: 'https://www.pepespa.com/staff/' },
];

async function analyze({ id, url }) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[${id}]  ${url}`);
  let html, $;
  try {
    const res = await fetch(url, { headers: ua });
    html = await res.text();
    $ = cheerio.load(html);
    console.log(`HTTP: ${res.status}  img総数: ${$('img').length}`);
  } catch (e) {
    console.log(`❌ ${e.message}`); return;
  }

  // img 先頭10件
  console.log('--- img src 先頭8件 ---');
  $('img').slice(0, 8).each((i, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || '';
    const alt = $(el).attr('alt') || '';
    if (src) console.log(`  [${i}] src="${src.slice(0,70)}" alt="${alt.slice(0,30)}"`);
  });

  // li/article:has(img) 先頭5件
  console.log('--- li/article:has(img) ---');
  $('li:has(img), article:has(img)').slice(0, 5).each((i, el) => {
    const img = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src') || '';
    const alt = $(el).find('img').first().attr('alt') || '';
    const text = $(el).text().replace(/\s+/g, ' ').trim().slice(0, 100);
    console.log(`  [${i}] img="${img.slice(0,60)}" alt="${alt.slice(0,30)}"`);
    console.log(`       text="${text}"`);
  });

  // name/cast クラス
  console.log('--- name/cast/staff 系クラス ---');
  $('[class*="name"],[class*="cast"],[class*="staff"],[class*="girl"],[class*="therapist"],[class*="member"]').slice(0, 6).each((i, el) => {
    const cls = ($(el).attr('class') || '').slice(0, 50);
    const text = $(el).text().replace(/\s+/g, ' ').trim().slice(0, 80);
    if (text) console.log(`  cls="${cls}" text="${text}"`);
  });

  // ロゴ候補
  const logos = [];
  $('img[src*="logo"], header img, .header img, .logo img').each((_, el) => {
    const s = $(el).attr('src') || '';
    if (s) logos.push(s);
  });
  if (logos.length) console.log(`ロゴ候補: ${logos.slice(0,2).join(' | ')}`);
}

async function run() {
  for (const t of TARGETS) await analyze(t);
  console.log('\n完了');
}
run().catch(e => console.error('❌', e.message));
