/**
 * マジメSPA (majime-spa.com) セラピスト挿入
 * 実行: node scripts/insert/insert_majime_spa_therapists.mjs
 */
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SHOP_ID = 'osaka_umeda_majimespa';
const THERAPIST_URL = 'https://majime-spa.com/therapist.html';
const BASE_URL = 'https://majime-spa.com';
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

  // div.name: "黒川 てんか AGE.22 T:151 黒川 てんかちゃんにLINE"
  // 名前はAGE.の前、サイズはp.size
  const therapists = [];

  $('div.name').each((_, el) => {
    const $el = $(el);
    const text = $el.text().replace(/\s+/g, ' ').trim();

    // AGE.より前が名前 (最初の出現のみ)
    const ageIdx = text.indexOf('AGE.');
    if (ageIdx < 0) return;
    const namePart = text.slice(0, ageIdx).trim();
    if (!namePart || namePart.length < 2) return;

    // 名前: "黒川 てんか" (姓 名の形式)
    const name = namePart.trim();

    // AGE.22 T:151 形式
    const afterAge = text.slice(ageIdx);
    const ageMatch = afterAge.match(/AGE[.．](\d{2,3})/);
    const heightMatch = afterAge.match(/T[：:]\s*(\d{3})/);
    const cupMatch = afterAge.match(/([A-J])\s*(?:カップ|cup)/i);

    // 親要素から画像を探す
    const parent = $el.closest('li, div[class*="cast"], div[class*="girl"], div[class*="item"], article');
    const img = parent.find('img').first();
    let imgSrc = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src') || '';

    // 画像URLが相対パスの場合
    if (imgSrc && !imgSrc.startsWith('http') && !imgSrc.startsWith('//')) {
      imgSrc = BASE_URL + (imgSrc.startsWith('/') ? imgSrc : '/' + imgSrc);
    }
    if (imgSrc && imgSrc.startsWith('//')) imgSrc = 'https:' + imgSrc;
    if (/logo|icon|banner|header|nav|btn|arrow|sns|line|twitter/i.test(imgSrc)) imgSrc = '';

    therapists.push({
      name,
      imgSrc,
      age: ageMatch ? parseInt(ageMatch[1]) : null,
      height: heightMatch ? parseInt(heightMatch[1]) : null,
      cup: cupMatch ? cupMatch[1].toUpperCase() : null,
    });
  });

  // div.nameで取れなかった場合、HTMLからURL一覧を直接抽出
  if (therapists.length === 0) {
    // img URLをHTMLから正規表現で抽出
    const imgUrls = [...html.matchAll(/src=["']([^"']*(?:therapist|cast|staff|girl|upload)[^"']*)["']/gi)].map(m => m[1]);
    console.log('画像URL候補:', imgUrls.slice(0, 5));
  }

  const unique = [...new Map(therapists.map(t => [t.name, t])).values()];
  console.log(`取得: ${unique.length}名`);
  unique.slice(0, 8).forEach(t => console.log(`  ${t.name} (${t.age}歳, T${t.height}) img:${t.imgSrc ? '✅' : '❌'}`));

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
