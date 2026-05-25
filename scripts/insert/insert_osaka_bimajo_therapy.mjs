/**
 * 美魔女セラピー (hananoame.com) - osaka_umeda_bimajo_therapy
 * WordPress - .staff_item セレクター、ページネーション対応
 * 実行: node scripts/insert/insert_osaka_bimajo_therapy.mjs
 */
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const SHOP_ID = 'osaka_umeda_bimajo_therapy';
const BASE_URL = 'https://hananoame.com';
const STAFF_URL = 'https://hananoame.com/staff/';

async function uploadImage(imageUrl, therapistId) {
  try {
    const res = await fetch(imageUrl, { headers: ua, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const ext = imageUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
    const fileName = `${therapistId}.${ext}`;
    const { error } = await supabase.storage.from('therapist-images')
      .upload(fileName, buffer, { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('therapist-images').getPublicUrl(fileName);
    return publicUrl;
  } catch (e) { return null; }
}

console.log(`[${SHOP_ID}] 美魔女セラピー (hananoame.com)`);

try {
  const therapists = [];
  const seen = new Set();
  let pageUrl = STAFF_URL;
  let pageNum = 1;

  while (pageUrl && pageNum <= 20) {
    console.log(`  ページ ${pageNum}: ${pageUrl}`);
    const res = await fetch(pageUrl, { headers: ua, signal: AbortSignal.timeout(12000) });
    const html = await res.text();
    const $ = cheerio.load(html);

    // 方法1: .staff_item セレクター
    let found = 0;
    $('.staff_item').each((_, el) => {
      const $el = $(el);
      const img = $el.find('.staff_img img, img').first();
      const src = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src') || '';
      if (!src || src.includes('/themes/')) return;

      const imageUrl = src.startsWith('http') ? src : BASE_URL + src;
      if (seen.has(imageUrl)) return;
      seen.add(imageUrl);

      const altName = img.attr('alt') || '';
      const tdName = $el.find('.table_td, .staff_name, .name, h3, h4').first().text().trim();
      const name = (altName || tdName).replace(/（[^）]*）/g, '').replace(/\([ぁ-ん]+\)/g, '').trim();
      if (!name || name.length < 2) return;

      const text = $el.text();
      const ageMatch = text.match(/(\d{2,3})\s*歳/) || text.match(/[（(](\d{2,3})[)）]/);
      const heightMatch = text.match(/T[.．]?\s*(\d{3})/) || text.match(/(\d{3})\s*cm/i);
      const cupMatch = text.match(/([A-J])\s*(?:カップ|cup)/i);

      therapists.push({
        name,
        imgSrc: imageUrl,
        age: ageMatch ? parseInt(ageMatch[1]) : null,
        height: heightMatch ? parseInt(heightMatch[1]) : null,
        cup: cupMatch?.[1]?.toUpperCase() || null,
      });
      found++;
    });

    // 方法2: wp-content画像を含むli/article (fallback)
    if (found === 0) {
      $('li:has(img[src*="wp-content/uploads"]), article:has(img[src*="wp-content/uploads"])').each((_, el) => {
        const $el = $(el);
        const img = $el.find('img').first();
        const src = img.attr('src') || img.attr('data-src') || '';
        if (!src || seen.has(src)) return;
        seen.add(src);

        const name = (img.attr('alt') || $el.find('.name, h3, h4').first().text()).trim()
          .replace(/（[^）]*）/g, '').replace(/\([ぁ-ん]+\)/g, '').trim();
        if (!name || name.length < 2) return;

        const text = $el.text();
        const ageMatch = text.match(/[（(](\d{2,3})[)）]/);
        const heightMatch = text.match(/T[.．]?\s*(\d{3})/) || text.match(/(\d{3})\s*cm/i);
        const cupMatch = text.match(/([A-J])\s*(?:カップ|cup)/i);

        therapists.push({
          name,
          imgSrc: src.startsWith('http') ? src : BASE_URL + src,
          age: ageMatch ? parseInt(ageMatch[1]) : null,
          height: heightMatch ? parseInt(heightMatch[1]) : null,
          cup: cupMatch?.[1]?.toUpperCase() || null,
        });
        found++;
      });
    }

    console.log(`    → ${found}名`);

    // 次ページ
    const nextLink = $('a.next, .list_pagenavi a.next, .pagenavi a[rel="next"], .wp-pagenavi a.nextpostslink').first().attr('href');
    pageUrl = (nextLink && nextLink !== pageUrl) ? nextLink : null;
    pageNum++;
  }

  const unique = [...new Map(therapists.map(t => [t.name, t])).values()];
  console.log(`\n取得合計: ${unique.length}名`);
  unique.slice(0, 5).forEach(t => console.log(`  ${t.name} (${t.age}歳, T${t.height}, ${t.cup}カップ)`));

  if (unique.length === 0) {
    console.log('❌ セラピストが取得できませんでした');
    process.exit(1);
  }

  let inserted = 0;
  for (const t of unique) {
    const therapistId = `${SHOP_ID}_${t.name.replace(/\s+/g, '_').replace(/[^\w぀-鿿ぁ-ん]/g, '')}`;
    const storedUrl = await uploadImage(t.imgSrc, therapistId);
    const { error } = await supabase.from('therapists').upsert({
      id: therapistId, shop_id: SHOP_ID, name: t.name,
      age: t.age, height: t.height, cup: t.cup,
      image_url: storedUrl || t.imgSrc || null,
    });
    if (error) console.log(`  挿入エラー: ${error.message}`);
    else { inserted++; process.stdout.write('.'); }
  }
  console.log(`\n✅ ${inserted}名挿入完了`);

} catch (e) {
  console.log(`❌ ${e.message}`);
}
