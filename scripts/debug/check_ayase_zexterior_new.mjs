/**
 * 大森あやせ・斎藤ひかる の urasanesu.com 掲載確認
 * + Zexterior 新規7名（皇名 飛鳥・二宮 萌沙 等）の画像URL調査
 * 実行: node scripts/debug/check_ayase_zexterior_new.mjs
 */
import * as cheerio from 'cheerio';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchHtml(url, referer) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Referer: referer || url },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return { ok: false, status: res.status, text: '' };
    return { ok: true, status: 200, text: await res.text() };
  } catch (e) {
    return { ok: false, status: 0, text: '', error: e.message };
  }
}

// ─── UraSanEsu 系サイトの全セラピスト確認 ──────────────────────
console.log('='.repeat(60));
console.log('【urasanesu.com / shimoesu.com 全ページ調査】');
console.log('='.repeat(60));

const TARGET_NAMES = ['大森あやせ', '斎藤ひかる'];

for (const baseUrl of ['https://urasanesu.com', 'https://shimoesu.com', 'http://hataesu.com']) {
  console.log(`\n── ${baseUrl} ──`);
  const tryPaths = ['/', '/therapist/', '/cast/', '/staff/', '/girls/'];
  for (const path of tryPaths) {
    const r = await fetchHtml(baseUrl + path, baseUrl + '/');
    if (!r.ok) { console.log(`  ${path} → ${r.status}`); continue; }

    const $ = cheerio.load(r.text);
    // therapist_img パターン
    const imgs = [];
    $('img[src*="therapist_img"]').each((_, el) => {
      const src = $(el).attr('src') || '';
      const alt = ($(el).attr('alt') || '').trim();
      imgs.push({ src, alt });
    });
    console.log(`  ${path} → OK (${r.text.length}byte) therapist_img:${imgs.length}件`);

    // 対象名前がHTMLに含まれるか
    for (const name of TARGET_NAMES) {
      if (r.text.includes(name)) {
        const idx = r.text.indexOf(name);
        const ctx = r.text.slice(Math.max(0, idx - 100), idx + name.length + 150).replace(/\n/g, ' ');
        console.log(`  ✅ "${name}" 発見: ...${ctx.slice(0, 200)}...`);
      }
    }

    // 全therapist_img を表示（最大20件）
    if (imgs.length > 0) {
      console.log(`  therapist_img一覧（先頭20件）:`);
      imgs.slice(0, 20).forEach(i => console.log(`    alt="${i.alt}" src="${i.src.slice(-50)}"`));
    }
    await sleep(300);
  }
}

// ─── Zexterior 全ページ調査 ─────────────────────────────────────
console.log('\n' + '='.repeat(60));
console.log('【Zexterior 新規7名の調査】');
console.log('='.repeat(60));

const ZEX_TARGETS = ['皇名 飛鳥', '二宮 萌沙', '荒木 絵里', '坂井 都', '蒼井 瑠菜', '久宝 由奈', 'にこる'];
const ZEX_BASE = 'https://zexterior-aroma.com';

const zexPaths = ['/', '/cast/', '/cast', '/cast_list/', '/member/', '/therapist/', '/girls/', '/staff/', '/new/', '/girl/'];

for (const path of zexPaths) {
  const r = await fetchHtml(ZEX_BASE + path, ZEX_BASE + '/');
  if (!r.ok) { console.log(`${path} → ${r.status}`); continue; }

  const $ = cheerio.load(r.text);
  const staffImgs = [];
  $('img[src*="images_staff"], img[data-src*="images_staff"], img[data-original*="images_staff"]').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-original') || '';
    const alt = ($(el).attr('alt') || '').trim();
    if (alt && /[ぁ-んァ-ヾ一-龯]/.test(alt)) staffImgs.push({ alt, src: src.slice(-50) });
  });

  // 対象名前の存在確認
  const found = ZEX_TARGETS.filter(n => r.text.includes(n));
  console.log(`\n${path} → OK (${r.text.length}byte) images_staff:${staffImgs.length}件 hit:${found.join(',') || 'なし'}`);

  if (staffImgs.length > 0 && staffImgs.length <= 30) {
    staffImgs.forEach(i => console.log(`  alt="${i.alt}" src="...${i.src}"`));
  }

  // 見つかった対象名前の周辺HTML
  for (const name of ZEX_TARGETS) {
    if (r.text.includes(name)) {
      const idx = r.text.indexOf(name);
      const ctx = r.text.slice(Math.max(0, idx - 150), idx + name.length + 150).replace(/\n/g, ' ');
      console.log(`  ✅ "${name}": ...${ctx.slice(0, 250)}...`);
    }
  }
  await sleep(400);
}

// ─── Zexterior サイトマップで追加ページ確認 ─────────────────────
console.log('\n── Zexterior sitemap.xml ──');
const sitemapR = await fetchHtml(ZEX_BASE + '/sitemap.xml', ZEX_BASE + '/');
if (sitemapR.ok) {
  const urls = sitemapR.text.match(/<loc>([^<]+)<\/loc>/g)?.map(m => m.replace(/<\/?loc>/g, '')) || [];
  console.log(`サイトマップURL: ${urls.length}件`);
  urls.slice(0, 20).forEach(u => console.log(`  ${u}`));
} else {
  console.log(`sitemap.xml → ${sitemapR.status}`);
}

console.log('\n完了');
