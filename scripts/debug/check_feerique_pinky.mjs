/**
 * Feerique・ピンキーグラッツェ 正しいURLで構造確認
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };

const targets = [
  { name: 'Feerique /therapist',   url: 'https://aroma-feerique.com/therapist' },
  { name: 'Feerique TOP',          url: 'https://aroma-feerique.com' },
  { name: 'ピンキー /staff/',       url: 'http://www.pinky-grazie.com/staff/' },
  { name: 'ピンキー /schedule/',    url: 'http://www.pinky-grazie.com/schedule/' },
  { name: 'ピンキー TOP',           url: 'http://www.pinky-grazie.com' },
];

for (const t of targets) {
  console.log(`\n--- ${t.name} ---`);
  try {
    const res = await fetch(t.url, { headers: ua, signal: AbortSignal.timeout(12000) });
    console.log(`HTTP: ${res.status}`);
    if (res.status !== 200) continue;
    const html = await res.text();
    const $ = cheerio.load(html);
    const imgCount = $('img').length;
    console.log(`img総数: ${imgCount}件`);
    if (imgCount === 0) { console.log('→ JS描画'); continue; }

    // パターン確認
    for (const kw of ['images_staff','cast','staff','photo','therapist']) {
      const n = $(`img[src*="${kw}"]`).length;
      if (n > 0) console.log(`  img[src*="${kw}"]: ${n}件`);
    }
    for (const kw of ['さんの写真','セラピスト']) {
      const n = $(`img[alt*="${kw}"]`).length;
      if (n > 0) console.log(`  img[alt*="${kw}"]: ${n}件`);
    }
    if ($('[style*="background-image"]').length > 3) console.log(`  background-image: ${$('[style*="background-image"]').length}件`);

    // サンプル画像
    let shown = 0;
    $('img').each((_, el) => {
      if (shown >= 4) return;
      const src = $(el).attr('src') || '';
      const alt = $(el).attr('alt') || '';
      if (/logo|header|footer|banner|icon|LINE|loading|noimage/i.test(src + alt)) return;
      if (!src) return;
      console.log(`  img: alt="${alt.slice(0,20)}" | ${src.slice(0, 70)}`);
      shown++;
    });
  } catch(e) { console.log(`❌ ${e.message}`); }
}
