/**
 * 隠れ家 (kakurega-iyashi.com) セラピスト挿入
 * 実行: node scripts/insert/insert_kakurega_therapists.mjs
 */
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SHOP_ID = 'osaka_umeda_kakurega';
const THERAPIST_URL = 'https://kakurega-iyashi.com/girllist';
const BASE_URL = 'https://kakurega-iyashi.com';
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

  const therapists = [];

  // p.therapist_img内のimg、または /pic/girl/ を含む画像を持つ要素
  $('p.therapist_img img, img[src*="/pic/girl/"]').each((_, el) => {
    const $img = $(el);
    let imgSrc = $img.attr('src') || '';
    if (!imgSrc || imgSrc.includes('np.webp') || /logo|icon|btn/i.test(imgSrc)) return;

    if (!imgSrc.startsWith('http')) {
      imgSrc = BASE_URL + (imgSrc.startsWith('/') ? imgSrc : '/' + imgSrc);
    }

    // 親要素からテキスト取得: "美船(42)T.155cm 次回 ..."
    const parent = $img.closest('li, div, article, section').first();
    const text = parent.text().replace(/\s+/g, ' ').trim();

    // 名前(年齢)T.身長cm 形式
    // "美船(42)T.155cm" または "緩里(41)T.153cm"
    const nameAgeMatch = text.match(/^([ぁ-んァ-ヾ一-龯]{1,8}(?:[\s　][ぁ-んァ-ヾ一-龯]{1,6})?)\s*[（(](\d{2,3})[)）]/);
    if (!nameAgeMatch) return;

    const name = nameAgeMatch[1].trim();
    const age = parseInt(nameAgeMatch[2]);
    const heightMatch = text.match(/T[.．]\s*(\d{3})\s*cm/);
    const height = heightMatch ? parseInt(heightMatch[1]) : null;
    const cupMatch = text.match(/([A-J])\s*(?:カップ|cup)/i);

    therapists.push({ name, imgSrc, age, height, cup: cupMatch?.[1]?.toUpperCase() || null });
  });

  const unique = [...new Map(therapists.map(t => [t.name, t])).values()];
  console.log(`取得: ${unique.length}名`);
  unique.slice(0, 8).forEach(t => console.log(`  ${t.name} (${t.age}歳, T${t.height})`));

  let inserted = 0;
  for (const t of unique) {
    const therapistId = `${SHOP_ID}_${t.name.replace(/\s+/g, '_').replace(/[^\w぀-鿿ぁ-ん]/g, '')}`;
    const storedUrl = await uploadImage(t.imgSrc, therapistId);
    const { error } = await supabase.from('therapists').upsert({
      id: therapistId, shop_id: SHOP_ID, name: t.name,
      age: t.age, height: t.height, cup: t.cup,
      image_url: storedUrl || t.imgSrc,
    });
    if (error) console.log(`  挿入エラー: ${error.message}`);
    else { inserted++; process.stdout.write('.'); }
  }
  console.log(`\n✅ ${inserted}名挿入完了`);
}
run().catch(e => console.error('❌', e.message));
