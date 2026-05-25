/**
 * 福岡6店舗 公式サイトのセラピストページ構造確認
 * 実行: node scripts/debug/check_fukuoka_official_sites.mjs
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const shops = [
  { name: 'MOTHERS',    base: 'https://mothers-hakata.com',   staffPaths: ['/therapist/', '/cast/', '/staff/', '/therapist.php', '/staff.php'] },
  { name: 'Feerique',   base: 'https://aroma-feerique.com',   staffPaths: ['/therapist/', '/cast/', '/staff/', '/therapist.php', '/staff.php'] },
  { name: '博多人妻さん', base: 'https://hakatahitozuma.com',  staffPaths: ['/therapist/', '/cast/', '/staff/', '/staff.php', '/therapist.php'] },
  { name: 'Lion Heart', base: 'http://lion-heart.pwchp.com',  staffPaths: ['/therapist/', '/cast/', '/staff/', '/therapist.php', '/staff.php'] },
  { name: 'Request',    base: 'https://request-hakata.com',   staffPaths: ['/therapist/', '/cast/', '/staff/', '/therapist.php', '/staff.php'] },
  { name: 'ピンキーグラッツェ', base: 'http://www.pinky-grazie.com', staffPaths: ['/therapist.html', '/cast.html', '/staff.html', '/therapist/', '/staff.php'] },
];

for (const shop of shops) {
  console.log(`\n${'='.repeat(50)}\n=== ${shop.name} ===`);

  for (const path of shop.staffPaths) {
    const url = shop.base + path;
    try {
      const res = await fetch(url, { headers: ua, signal: AbortSignal.timeout(10000) });
      if (res.status !== 200) continue;
      const html = await res.text();
      const $ = cheerio.load(html);
      const imgTotal = $('img').length;
      if (imgTotal === 0) { console.log(`  ${path} → HTTP200 img:0 (JS描画)`); continue; }

      console.log(`  ✅ ${path} → HTTP200 img:${imgTotal}件`);

      // セラピスト系パターン
      const patterns = [
        ['img[src*="images_staff"]', 'images_staff'],
        ['img[src*="cast"]', 'cast'],
        ['img[src*="staff"]', 'staff'],
        ['img[src*="photo"]', 'photo'],
        ['img[src*="therapist"]', 'therapist'],
        ['img[alt*="さんの写真"]', 'さんの写真'],
      ];
      for (const [sel, label] of patterns) {
        const n = $(sel).length;
        if (n > 0) console.log(`    [${label}]: ${n}件`);
      }
      if ($('[style*="background-image"]').length > 3) {
        console.log(`    [background-image]: ${$('[style*="background-image"]').length}件`);
      }

      // サンプル画像
      let shown = 0;
      $('img').each((_, el) => {
        if (shown >= 3) return;
        const src = $(el).attr('src') || '';
        const alt = $(el).attr('alt') || '';
        if (/logo|header|footer|banner|icon|LINE|loading|noimage/i.test(src + alt)) return;
        if (!src) return;
        console.log(`    img: alt="${alt.slice(0,20)}" | ${src.slice(0, 60)}`);
        shown++;
      });
      break; // 最初に見つかったページだけ表示
    } catch { /* skip */ }
  }
  await sleep(400);
}
