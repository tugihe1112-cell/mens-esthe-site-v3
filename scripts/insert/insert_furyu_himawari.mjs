/**
 * Furyu (furyu.net) + SEACRET ROOM ひまわり (sr-himawari.com) 一括挿入
 * 実行: node scripts/insert/insert_furyu_himawari.mjs
 */
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

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

async function insertShop({ shopId, castUrl, baseUrl, shopNameInAlt, imgPattern }) {
  const res = await fetch(castUrl, { headers: ua });
  const html = await res.text();
  const $ = cheerio.load(html);

  const therapists = [];

  $(`div.ph:has(img[src*="${imgPattern}"])`).each((_, el) => {
    const $el = $(el);
    const img = $el.find('img').first();
    let imgSrc = img.attr('src') || '';

    // 絶対URLに変換
    if (imgSrc.startsWith('//')) imgSrc = 'https:' + imgSrc;
    else if (imgSrc.startsWith('/')) imgSrc = baseUrl + imgSrc;

    // 名前: img alt から店舗名プレフィックスを除去して最後の部分
    const alt = img.attr('alt') || '';
    let nameFromAlt = alt.replace(shopNameInAlt, '').trim();
    // 余分なテキスト除去
    nameFromAlt = nameFromAlt.replace(/^[^぀-鿿]*/, '').trim();

    // 親要素テキストからも名前/年齢/身長を取得
    const parentText = $el.parent().text().replace(/\s+/g, ' ').trim();
    // "写メ日記" などのプレフィックスを除去
    const cleanText = parentText.replace(/^(写メ日記|ブログ|本日出勤|次回出勤)\s*/g, '').trim();

    // 名前(年齢) パターン
    const nameAgeMatch = cleanText.match(/^([ぁ-んァ-ヾ一-龯]{1,8}(?:[\s　][ぁ-んァ-ヾ一-龯]{1,6})?)\s*[（(](\d{2,3})[)）]/);
    const name = nameAgeMatch?.[1]?.trim() || nameFromAlt;
    const age = nameAgeMatch ? parseInt(nameAgeMatch[2]) : null;

    if (!name || name.length < 2) return;

    // 身長: "身長 155 cm" または "T.155" 形式
    const heightMatch = cleanText.match(/身長\s*(\d{3})\s*cm/) || cleanText.match(/T[.．]\s*(\d{3})/);
    const height = heightMatch ? parseInt(heightMatch[1]) : null;
    const cupMatch = cleanText.match(/([A-J])\s*(?:カップ|cup)/i);

    therapists.push({ name, imgSrc, age, height, cup: cupMatch?.[1]?.toUpperCase() || null });
  });

  const unique = [...new Map(therapists.map(t => [t.name, t])).values()];
  console.log(`[${shopId}] 取得: ${unique.length}名`);
  unique.slice(0, 5).forEach(t => console.log(`  ${t.name} (${t.age}歳, T${t.height})`));

  let inserted = 0;
  for (const t of unique) {
    const therapistId = `${shopId}_${t.name.replace(/\s+/g, '_').replace(/[^\w぀-鿿ぁ-ん]/g, '')}`;
    const storedUrl = t.imgSrc ? await uploadImage(t.imgSrc, therapistId) : null;
    const { error } = await supabase.from('therapists').upsert({
      id: therapistId, shop_id: shopId, name: t.name,
      age: t.age, height: t.height, cup: t.cup,
      image_url: storedUrl || t.imgSrc || null,
    });
    if (error) console.log(`  挿入エラー: ${error.message}`);
    else { inserted++; process.stdout.write('.'); }
  }
  console.log(`\n  ✅ ${inserted}名挿入完了`);
}

await insertShop({
  shopId: 'osaka_umeda_furyu',
  castUrl: 'https://furyu.net/cast/',
  baseUrl: 'https://furyu.net',
  shopNameInAlt: '【公式】Fu-Ryu（フウリュウ） | 大阪京橋メンズエステ',
  imgPattern: 'upload/cast',
});

await insertShop({
  shopId: 'osaka_umeda_sr_himawari',
  castUrl: 'https://sr-himawari.com/cast',
  baseUrl: 'https://sr-himawari.com',
  shopNameInAlt: 'シークレットルームヒマワリ',
  imgPattern: 'upload/cast',
});
