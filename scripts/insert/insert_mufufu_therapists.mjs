/**
 * ムフフフットケアセンター (mufufu-foot-care-center.com) セラピスト挿入
 * WordPress - /staff ページ
 * 実行: node scripts/insert/insert_mufufu_therapists.mjs
 */
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const ua = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ja,en-US;q=0.7',
};
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const SHOP_ID = 'osaka_umeda_mufufu';
const BASE_URL = 'https://mufufu-foot-care-center.com';

async function uploadImage(imageUrl, therapistId) {
  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': ua['User-Agent'], 'Referer': BASE_URL + '/' },
      signal: AbortSignal.timeout(10000)
    });
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

console.log(`[${SHOP_ID}] ムフフフットケアセンター`);

try {
  const therapists = [];
  const seen = new Set();

  // ページネーション対応
  let pageUrl = `${BASE_URL}/staff`;
  let pageNum = 1;

  while (pageUrl && pageNum <= 30) {
    console.log(`  ページ ${pageNum}: ${pageUrl}`);
    const res = await fetch(pageUrl, { headers: ua, signal: AbortSignal.timeout(15000) });
    if (!res.ok) { console.log(`  → ${res.status}`); break; }
    const html = await res.text();
    const $ = cheerio.load(html);

    let found = 0;

    // 方法1: WordPress 標準パターン - wp-content/uploads の画像 + 名前・年齢テキスト
    // 各 article / .staff-item / li を探索
    const containers = $('article, .staff-item, .cast-item, .therapist-item, li:has(img[src*="wp-content"])');
    containers.each((_, el) => {
      const $el = $(el);
      const img = $el.find('img').first();
      const src = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src') || '';
      if (!src || seen.has(src)) return;

      const text = $el.text().replace(/\s+/g, ' ').trim();
      const nameMatch = text.match(/([ぁ-んァ-ヾ一-龯]{2,8}(?:[\s　][ぁ-んァ-ヾ一-龯]{1,6})?)\s*[（(](\d{2,3})[)）]/)
        || (img.attr('alt') || '').match(/([ぁ-んァ-ヾ一-龯]{2,8})/);
      if (!nameMatch) return;

      const name = nameMatch[1].trim();
      if (name.length < 2 || /ムフフ|フット|セラピー|募集|求人/.test(name)) return;
      seen.add(src);

      const ageMatch = text.match(/[（(](\d{2,3})[)）]/);
      const heightMatch = text.match(/(?:T|身長)[.．:：]?\s*(\d{3})/) || text.match(/(\d{3})\s*cm/i);
      const cupMatch = text.match(/([A-J])\s*(?:カップ|cup)/i);

      const fullSrc = src.startsWith('http') ? src : BASE_URL + src;
      therapists.push({ name, imgSrc: fullSrc, age: ageMatch ? parseInt(ageMatch[1]) : null, height: heightMatch ? parseInt(heightMatch[1]) : null, cup: cupMatch?.[1]?.toUpperCase() || null });
      found++;
    });

    // 方法2: 全 wp-content 画像から探す
    if (found === 0) {
      $('img[src*="wp-content/uploads"]').each((_, el) => {
        const $img = $(el);
        const src = $img.attr('src') || '';
        if (seen.has(src)) return;
        if (/logo|banner|icon|bg|header|footer|recruit/i.test(src)) return;

        const alt = ($img.attr('alt') || '').replace(/（[^）]*）/g, '').replace(/\([ぁ-ん]+\)/g, '').trim();
        const parent = $img.closest('li, div, article, section').first();
        const text = parent.text().replace(/\s+/g, ' ').trim();

        const nameMatch = text.match(/([ぁ-んァ-ヾ一-龯]{2,8}(?:[\s　][ぁ-んァ-ヾ一-龯]{1,6})?)\s*[（(](\d{2,3})[)）]/)
          || (alt.length >= 2 && /[ぁ-んァ-ヾ一-龯]/.test(alt) ? [null, alt] : null);
        if (!nameMatch) return;

        const name = nameMatch[1]?.trim() || '';
        if (!name || name.length < 2) return;
        seen.add(src);

        const ageMatch = text.match(/[（(](\d{2,3})[)）]/);
        const heightMatch = text.match(/(?:T|身長)[.．:：]?\s*(\d{3})/) || text.match(/(\d{3})\s*cm/i);
        const cupMatch = text.match(/([A-J])\s*(?:カップ|cup)/i);

        const fullSrc = src.startsWith('http') ? src : BASE_URL + src;
        therapists.push({ name, imgSrc: fullSrc, age: ageMatch ? parseInt(ageMatch[1]) : null, height: heightMatch ? parseInt(heightMatch[1]) : null, cup: cupMatch?.[1]?.toUpperCase() || null });
        found++;
      });
    }

    console.log(`    → ${found}名`);

    // 次ページ
    const nextLink = $('a.next, .list_pagenavi a.next, .pagenavi a[rel="next"], .wp-pagenavi a.nextpostslink, a[aria-label="次のページ"]').first().attr('href');
    pageUrl = (nextLink && nextLink !== pageUrl) ? nextLink : null;
    pageNum++;
  }

  const unique = [...new Map(therapists.map(t => [t.name, t])).values()];
  console.log(`\n取得合計: ${unique.length}名`);
  unique.slice(0, 5).forEach(t => console.log(`  ${t.name} (${t.age}歳, T${t.height})`));

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
