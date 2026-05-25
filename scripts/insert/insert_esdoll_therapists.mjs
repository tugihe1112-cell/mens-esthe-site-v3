/**
 * イーエスドールプレミアム (e-s-doll.com) セラピスト挿入
 * 実行: node scripts/insert/insert_esdoll_therapists.mjs
 */
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SHOP_ID = 'osaka_sakaisujihonmachi_es_doll';
const THERAPIST_URL = 'https://e-s-doll.com/staff.php';
const BASE_URL = 'https://e-s-doll.com';
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

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

async function run() {
  const res = await fetch(THERAPIST_URL, { headers: ua });
  const html = await res.text();
  const $ = cheerio.load(html);

  console.log('全img:', $('img').length, '件');
  console.log('p内img:', $('p:has(img)').length, '件');

  const therapists = [];

  // p要素内の画像を持つ要素を探索
  // 画像は /images/ ディレクトリにあると推測
  $('p:has(img)').each((_, el) => {
    const $el = $(el);
    const img = $el.find('img').first();
    const imgSrc = img.attr('src') || '';

    if (!imgSrc || /logo|banner|icon|btn|recruit|ranking|header/i.test(imgSrc)) return;

    // 名前は親要素またはimg altから
    const name = img.attr('alt')?.trim() || '';
    const parentText = $el.closest('li, div, article, tr').first().text().replace(/\s+/g, ' ').trim();

    const ageMatch = parentText.match(/(\d{2,3})\s*歳/) || parentText.match(/age[\s:]*(\d{2,3})/i);
    const heightMatch = parentText.match(/T[．.:]?\s*(\d{3})/) || parentText.match(/(\d{3})\s*cm/i);
    const cupMatch = parentText.match(/([A-J])\s*(?:カップ|cup)/i);

    const fullImgSrc = imgSrc.startsWith('http') ? imgSrc : BASE_URL + (imgSrc.startsWith('/') ? imgSrc : '/' + imgSrc);

    if (name && name.length >= 2) {
      therapists.push({ name, imgSrc: fullImgSrc, age: ageMatch ? parseInt(ageMatch[1]) : null, height: heightMatch ? parseInt(heightMatch[1]) : null, cup: cupMatch?.[1]?.toUpperCase() || null });
    }
  });

  // p要素で取れない場合、img altから直接取得
  if (therapists.length < 5) {
    console.log('altから取得を試みます...');
    $('img').each((_, el) => {
      const $img = $(el);
      const alt = $img.attr('alt')?.trim() || '';
      const src = $img.attr('src') || '';
      if (!alt || alt.length < 2 || /logo|banner|icon|recruit|ranking/i.test(alt + src)) return;

      const parent = $img.closest('li, div[class*="staff"], div[class*="cast"], article, tr').first();
      const text = parent.text().replace(/\s+/g, ' ').trim();
      const ageMatch = text.match(/(\d{2,3})\s*歳/) || alt.match(/(\d{2,3})/);
      const fullSrc = src.startsWith('http') ? src : BASE_URL + (src.startsWith('/') ? src : '/' + src);

      if (!therapists.find(t => t.name === alt)) {
        therapists.push({ name: alt, imgSrc: fullSrc, age: ageMatch ? parseInt(ageMatch[1]) : null, height: null, cup: null });
      }
    });
  }

  const unique = [...new Map(therapists.map(t => [t.name, t])).values()]
    .filter(t => t.name.length >= 2 && !/^(ランキング|求人|スタッフ募集|料金|システム|アクセス)/.test(t.name));
  console.log(`取得: ${unique.length}名`);
  unique.slice(0, 8).forEach(t => console.log(`  ${t.name} (${t.age}歳) → ${t.imgSrc.slice(0, 50)}`));

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
}
run().catch(e => console.error('❌', e.message));
