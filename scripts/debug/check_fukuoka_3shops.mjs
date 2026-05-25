/**
 * 福岡 URL既知3店舗の構造確認
 * 実行: node scripts/debug/check_fukuoka_3shops.mjs
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };

const shops = [
  { name: '博多人妻さん',  staffUrl: 'https://hakatahitozuma.com/therapist/', scheduleUrl: 'https://hakatahitozuma.com/schedule/' },
  { name: 'Request',     staffUrl: 'https://aroma-request.com/therapist/', scheduleUrl: 'https://aroma-request.com/schedule/' },
  { name: 'ピンキーグラッツェ', staffUrl: 'http://www.pinky-grazie.com/therapist.html', scheduleUrl: 'http://www.pinky-grazie.com/schedule.html' },
];

for (const shop of shops) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`=== ${shop.name} ===`);
  try {
    const res = await fetch(shop.staffUrl, { headers: ua, signal: AbortSignal.timeout(12000) });
    const html = await res.text();
    const $ = cheerio.load(html);

    const ogImg = $('meta[property="og:image"]').attr('content') || '（なし）';
    console.log(`og:image: ${ogImg}`);

    // よくあるパターンを一括チェック
    const patterns = [
      { sel: 'img[alt*="さんの写真"]', label: 'さんの写真' },
      { sel: 'img[src*="images_staff"]', label: 'images_staff' },
      { sel: 'img[src*="/photos/"]', label: '/photos/' },
      { sel: 'img[src*="cast"]', label: 'cast' },
      { sel: 'img[src*="staff"]', label: 'staff' },
      { sel: 'img[src*="therapist"]', label: 'therapist' },
    ];
    for (const p of patterns) {
      const count = $(p.sel).length;
      if (count > 0) console.log(`  [${p.label}]: ${count}件`);
    }

    console.log('全img 先頭6件:');
    $('img').slice(0, 6).each((i, el) => {
      const src = $(el).attr('src') || '';
      const alt = $(el).attr('alt') || '';
      if (/logo|header|footer|banner|icon|LINE|recruit/i.test(src + alt)) return;
      console.log(`  [${i}] alt="${alt}" | ${src.slice(0, 70)}`);
    });

    // background-image チェック
    const bgCount = $('[style*="background-image"]').length;
    if (bgCount > 0) console.log(`  background-image要素: ${bgCount}件`);

  } catch (e) {
    console.log(`  ❌ 取得失敗: ${e.message}`);
    // トップページで試す
    const base = new URL(shop.staffUrl).origin;
    try {
      const r2 = await fetch(base, { headers: ua, signal: AbortSignal.timeout(10000) });
      const h2 = await r2.text();
      const $2 = cheerio.load(h2);
      console.log(`  トップのog:image: ${$2('meta[property="og:image"]').attr('content') || '（なし）'}`);
    } catch {}
  }
}
