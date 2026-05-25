/**
 * セレブスパプレミアム (kitashinchiceleb.com) セラピスト挿入
 * 実行: node scripts/insert/insert_celeb_spa_therapists.mjs
 */
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SHOP_ID = 'osaka_umeda_celeb_spa';
const CAST_URL = 'https://kitashinchiceleb.com/cast.html';
const BASE_URL = 'https://kitashinchiceleb.com';
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
  const res = await fetch(CAST_URL, { headers: ua });
  const html = await res.text();
  const $ = cheerio.load(html);

  // デバッグ: セレクター確認
  console.log('li.fontFigure:', $('li.fontFigure').length);
  console.log('figure:', $('figure').length);
  console.log('li:has(figure):', $('li:has(figure)').length);

  const therapists = [];

  // li.fontFigure, figure, またはAGE.を含む要素を探す
  const processEl = ($el) => {
    const text = $el.text().replace(/\s+/g, ' ').trim();
    if (!text || text.length < 5) return;

    // "名前 AGE.X T:Y" 形式
    const ageIdx = text.indexOf('AGE.');
    if (ageIdx < 0) return;

    const namePart = text.slice(0, ageIdx).replace(/\s+/g, ' ').trim();
    // 名前は最後のスペースで区切られた部分 (姓 名)
    const name = namePart.replace(/^[^　-鿿]*/, '').trim() || namePart.trim();
    if (!name || name.length < 2) return;

    const afterAge = text.slice(ageIdx);
    const ageMatch = afterAge.match(/AGE\.(\d{2,3})/);
    const heightMatch = afterAge.match(/T[：:]\s*(\d{3})/);
    const cupMatch = afterAge.match(/([A-J])\s*(?:カップ|cup)/i);

    const img = $el.find('img').first();
    let imgSrc = img.attr('src') || img.attr('data-src') || '';
    if (imgSrc && !imgSrc.startsWith('http')) {
      imgSrc = BASE_URL + (imgSrc.startsWith('/') ? imgSrc : '/' + imgSrc);
    }
    if (/logo|banner|icon|rank\/.*\.png/i.test(imgSrc)) imgSrc = '';

    therapists.push({
      name: name.trim(),
      imgSrc,
      age: ageMatch ? parseInt(ageMatch[1]) : null,
      height: heightMatch ? parseInt(heightMatch[1]) : null,
      cup: cupMatch ? cupMatch[1].toUpperCase() : null,
    });
  };

  $('li.fontFigure').each((_, el) => processEl($(el)));
  if (therapists.length === 0) {
    $('figure, li:has(img)').each((_, el) => {
      const $el = $(el);
      const text = $el.text();
      if (text.includes('AGE.')) processEl($el);
    });
  }
  // さらにない場合はspan.nameから
  if (therapists.length === 0) {
    $('span.name, .name.fontStyle').each((_, el) => {
      const $el = $(el);
      const text = $el.closest('li, div, article').text().replace(/\s+/g, ' ').trim();
      const nameText = $el.text().trim();
      if (!nameText || nameText.length < 2) return;
      const ageMatch = text.match(/AGE\.(\d{2,3})/);
      const heightMatch = text.match(/T\s*(\d{3})/);
      const img = $el.closest('li, div').find('img').first();
      let imgSrc = img.attr('src') || '';
      if (imgSrc && !imgSrc.startsWith('http')) imgSrc = BASE_URL + imgSrc;
      therapists.push({
        name: nameText, imgSrc,
        age: ageMatch ? parseInt(ageMatch[1]) : null,
        height: heightMatch ? parseInt(heightMatch[1]) : null,
        cup: null,
      });
    });
  }

  const unique = [...new Map(therapists.map(t => [t.name, t])).values()];
  console.log(`\n取得: ${unique.length}名`);
  unique.forEach(t => console.log(`  ${t.name} (${t.age}歳, T${t.height}) img:${t.imgSrc ? 'あり' : 'なし'}`));

  let inserted = 0;
  for (const t of unique) {
    const therapistId = `${SHOP_ID}_${t.name.replace(/\s+/g, '_').replace(/[^\w぀-鿿ぁ-ん]/g, '')}`;
    const storedUrl = t.imgSrc ? await uploadImage(t.imgSrc, therapistId) : null;
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
