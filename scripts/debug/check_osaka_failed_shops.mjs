/**
 * 大阪 Phase1 失敗店舗の調査スクリプト
 * 実行: node scripts/debug/check_osaka_failed_shops.mjs
 */
import fs from 'fs';
import * as cheerio from 'cheerio';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
const h = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` };
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));

// C'est la 美 の実際のDB IDを確認
console.log('=== C\'est la 美 の実際のDB ID確認 ===');
const r = await fetch(`${supabaseUrl}/rest/v1/shops?name=like.*C%27est*&select=id,name,website_url`, { headers: h });
const shops = await r.json();
const r2 = await fetch(`${supabaseUrl}/rest/v1/shops?name=like.*セラヴィ*&select=id,name,website_url`, { headers: h });
const shops2 = await r2.json();
[...shops, ...shops2].forEach(s => console.log(`  id: ${s.id}`));

// moto_photos失敗4店舗 + rookie_cms失敗3店舗のURL調査
const FAILED = [
  // moto_photos
  { name: 'Mrs.美witch',    base: 'https://mrs-b-witch.com',              type: 'moto' },
  { name: 'Preseine',       base: 'https://www.esthe-sakai.jp',           type: 'moto' },
  { name: 'Mrs.Emmy',       base: 'https://salon-emmy.com',               type: 'moto' },
  { name: 'ハマるSPA',      base: 'https://hamaru-spa.com',               type: 'moto' },
  // rookie_cms
  { name: '癒刻',           base: 'https://yukoku-esthe.com',             type: 'rookie' },
  { name: 'SPA Mona',       base: 'https://menesthe-higashiosak-mona.com', type: 'rookie' },
  { name: '新感覚Mエステ',  base: 'https://www.shinkankaku.com',          type: 'rookie' },
];

const PATHS = ['/therapist/', '/cast/', '/staff/', '/ladies/', '/girl/', '/member/', '/'];

for (const shop of FAILED) {
  console.log(`\n=== [${shop.type}] ${shop.name} ===`);
  for (const path of PATHS) {
    const url = shop.base.replace(/\/+$/, '') + path;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) });
      if (!res.ok) { process.stdout.write(`.`); continue; }
      const html = await res.text();
      const $ = cheerio.load(html);

      // 画像パターン検出
      const patterns = {
        moto:        $('img[src*="/photos/"][src*="/moto_"]').length,
        raw_photos:  $('img[src*="/photos/"][src*="/raw_"]').length,
        images_staff: $('img[src*="images_staff"]').length,
        wcms:        $('img[src*="/wcms/"]').length + $('img[data-original*="/wcms/"]').length,
        defcon:      html.includes('def/con?p=') ? 1 : 0,
        upload_cast: html.includes('upload/cast/thumb_') ? 1 : 0,
        wp_content:  $('img[src*="wp-content"]').length,
        any_img:     $('img').length,
      };
      const found = Object.entries(patterns).filter(([k, v]) => v > 0).map(([k, v]) => `${k}:${v}`).join(', ');
      if (found) {
        console.log(`  ✅ ${path} → ${found}`);
        // 名前サンプル
        if (patterns.moto > 0) {
          $('img[src*="/photos/"][src*="/moto_"]').slice(0, 3).each((_, el) => {
            console.log(`     alt="${$(el).attr('alt')}" src="${$(el).attr('src')?.slice(0, 60)}"`);
          });
        }
        if (patterns.upload_cast > 0 || patterns.defcon > 0) {
          // castIdと名前のサンプル
          $('[data-p1*="upload/cast/thumb_"]').slice(0, 3).each((_, el) => {
            const id = $(el).attr('data-p1')?.match(/thumb_(\d+)/)?.[1];
            console.log(`     castId=${id}`);
          });
        }
        break; // パスが見つかったら次の店舗へ
      }
    } catch(e) {
      process.stdout.write('x');
    }
    await sleep(300);
  }
  await sleep(800);
}
console.log('\n\n完了');
