/**
 * Zexterior /therapist.php の構造確認
 * 新規7名（皇名 飛鳥・二宮 萌沙 等）の画像URL探索
 * 実行: node scripts/debug/check_zexterior_therapist_php.mjs
 */
import * as cheerio from 'cheerio';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const BASE = 'https://zexterior-aroma.com';
const TARGETS = ['皇名 飛鳥', '二宮 萌沙', '荒木 絵里', '坂井 都', '蒼井 瑠菜', '久宝 由奈', 'にこる'];

async function fetchHtml(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Referer: BASE + '/' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { ok: false, status: res.status, text: '' };
    return { ok: true, status: 200, text: await res.text() };
  } catch (e) {
    return { ok: false, status: 0, text: '', error: e.message };
  }
}

// /therapist.php 取得
console.log(`${BASE}/therapist.php 取得中...`);
const r = await fetchHtml(`${BASE}/therapist.php`);

if (!r.ok) {
  console.log(`失敗: ${r.status} ${r.error || ''}`);
  process.exit(1);
}

console.log(`取得成功: ${r.text.length}byte`);
const $ = cheerio.load(r.text);

// images_staff パターン全件
const staffImgs = [];
$('img[src*="images_staff"], img[data-src*="images_staff"], img[data-original*="images_staff"]').each((_, el) => {
  const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-original') || '';
  const alt = ($(el).attr('alt') || '').trim();
  staffImgs.push({ alt, src });
});
console.log(`\nimages_staff 画像: ${staffImgs.length}件`);
staffImgs.forEach(i => console.log(`  alt="${i.alt}" src="${i.src.slice(-60)}"`));

// background-image パターン
const bgImgs = [];
$('[style*="images_staff"]').each((_, el) => {
  const style = $(el).attr('style') || '';
  const m = style.match(/url\(['"]?([^'")\s]*images_staff[^'")\s]*)['"]?\)/);
  if (m) {
    const text = $(el).closest('li, div, article').find('.name, h3, h2, dd, .txt').first().text().trim().slice(0, 20);
    bgImgs.push({ url: m[1], text });
  }
});
console.log(`\nbackground-image(images_staff): ${bgImgs.length}件`);
bgImgs.slice(0, 10).forEach(b => console.log(`  "${b.text}" → ${b.url.slice(-60)}`));

// 対象名前の存在確認と周辺HTML
console.log('\n【対象名前の検索】');
for (const name of TARGETS) {
  const idx = r.text.indexOf(name);
  if (idx >= 0) {
    const ctx = r.text.slice(Math.max(0, idx - 200), idx + name.length + 300).replace(/\n/g, ' ');
    console.log(`\n✅ "${name}" 発見:`);
    console.log(`  ${ctx.slice(0, 400)}`);
  } else {
    console.log(`❓ "${name}" → 見つからず`);
  }
}

// ページ全体のimg一覧（images_staff 以外も）
console.log('\n【全img一覧（先頭30件）】');
$('img').slice(0, 30).each((_, el) => {
  const src = $(el).attr('src') || $(el).attr('data-src') || '';
  const alt = $(el).attr('alt') || '';
  console.log(`  alt="${alt.slice(0,20)}" src="${src.slice(-60)}"`);
});

// ページ内のリンク（追加ページがないか確認）
console.log('\n【ページ内リンク（cast/therapist/staff含む）】');
$('a[href]').each((_, el) => {
  const href = $(el).attr('href') || '';
  if (/therapist|cast|staff|girl|member|page/i.test(href)) {
    console.log(`  ${href}`);
  }
});

// データがJSで注入されている場合の確認
const scriptMatches = r.text.match(/images_staff\/(\d+)\/[^"'\s]+/g) || [];
console.log(`\n【scriptタグ内のimages_staff URL: ${scriptMatches.length}件】`);
scriptMatches.slice(0, 20).forEach(m => console.log(`  ${m}`));

console.log('\n完了');
