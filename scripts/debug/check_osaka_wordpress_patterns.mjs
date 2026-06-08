/**
 * 大阪 wordpress 31店舗 HTML構造調査
 * 各店舗で使われているCMSパターンを特定する
 * 実行: node scripts/debug/check_osaka_wordpress_patterns.mjs
 */
import fs from 'fs';
import * as cheerio from 'cheerio';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const detection = JSON.parse(fs.readFileSync('./osaka_cms_detection.json', 'utf-8'));
const wpShops = detection.details.filter(d => d.cms === 'wordpress');

console.log(`WordPress 31店舗 調査\n`);

const CAST_PATHS = ['/cast/', '/therapist/', '/staff/', '/ladies/', '/girl/', '/member/', '/'];

for (const shop of wpShops) {
  console.log(`\n=== ${shop.name} ===`);

  let found = false;
  for (const path of CAST_PATHS) {
    const url = shop.url.replace(/\/+$/, '').replace(/\/top$/, '') + path;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000) });
      if (!res.ok) { process.stdout.write('.'); continue; }
      const html = await res.text();
      const $ = cheerio.load(html);

      // パターン検出
      const wpCount = $('img[src*="wp-content/uploads"]').length;
      const photosCount = $('img[src*="/photos/"]').length;
      const staffCount = $('img[src*="images_staff"]').length;
      const defconCount = html.includes('def/con?p=') ? 1 : 0;
      const castmainCount = $('img[src*="cast/main"], img[src*="cast/thumb"]').length;
      const imgsTotal = $('img').length;

      if (wpCount + photosCount + staffCount + defconCount + castmainCount > 0) {
        console.log(`  ✅ ${path}: wp=${wpCount} photos=${photosCount} staff=${staffCount} defcon=${defconCount} cast=${castmainCount} (total img: ${imgsTotal})`);

        // サンプル名を表示
        if (wpCount > 0) {
          let names = 0;
          $('img[src*="wp-content/uploads"]').each((_, el) => {
            if (names >= 3) return;
            const alt = $(el).attr('alt') || '';
            if (alt && alt.length < 15 && /[ぁ-んァ-ヾ一-龯a-zA-Z]/.test(alt)) {
              console.log(`     alt: "${alt}" src: ${$(el).attr('src')?.slice(-40)}`);
              names++;
            }
          });
        }
        if (photosCount > 0) {
          $('img[src*="/photos/"]').slice(0, 3).each((_, el) => {
            console.log(`     photos: alt="${$(el).attr('alt')}" src=${$(el).attr('src')?.slice(-40)}`);
          });
        }
        found = true;
        break;
      } else if (imgsTotal > 5) {
        // 何か画像はあるが既知パターンでない
        // alt付き画像をサンプル表示
        const sampledImgs = [];
        $('img[alt]').each((_, el) => {
          if (sampledImgs.length >= 3) return;
          const alt = $(el).attr('alt') || '';
          const src = $(el).attr('src') || '';
          if (alt && alt.length > 1 && alt.length < 20 && /[ぁ-んァ-ヾ一-龯a-zA-Z]/.test(alt) && !src.includes('logo') && !src.includes('banner')) {
            sampledImgs.push({ alt, src: src.slice(-40) });
          }
        });
        if (sampledImgs.length > 0) {
          console.log(`  ⚠️ ${path}: img=${imgsTotal} (既知パターンなし)`);
          sampledImgs.forEach(i => console.log(`     alt: "${i.alt}" src: ${i.src}`));
          found = true;
          break;
        }
      }
    } catch(e) {
      process.stdout.write('x');
    }
    await sleep(300);
  }

  if (!found) console.log(`  ❌ キャストページ未検出`);
  await sleep(600);
}
console.log('\n完了');
