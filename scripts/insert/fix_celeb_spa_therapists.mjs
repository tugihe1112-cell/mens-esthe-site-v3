/**
 * セレブスパプレミアム 修正再挿入
 * 実行: node scripts/insert/fix_celeb_spa_therapists.mjs
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

// 除外するプレフィックス
const SKIP_PREFIXES = /^(本日出勤|NEW|在籍|休業中|引退|GOLD|VIP|プレミアム|予約|出勤)\s+/;

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

  console.log(`li.fontFigure: ${$('li.fontFigure').length}`);

  const therapists = [];

  $('li.fontFigure, li:has(figure)').each((_, el) => {
    const $el = $(el);
    const text = $el.text().replace(/\s+/g, ' ').trim();

    // AGE. が含まれる要素のみ処理
    const ageIdx = text.indexOf('AGE.');
    if (ageIdx < 0) return;

    // 名前部分: AGE.より前、プレフィックス除去
    let namePart = text.slice(0, ageIdx).trim();
    // プレフィックスを繰り返し除去
    let prevName = '';
    while (prevName !== namePart) {
      prevName = namePart;
      namePart = namePart.replace(SKIP_PREFIXES, '').trim();
    }
    const name = namePart;
    if (!name || name.length < 2) return;

    // AGE以降から数値を抽出
    const afterAge = text.slice(ageIdx);
    const ageMatch = afterAge.match(/AGE[.．](\d{2,3})/);
    // T170 形式の身長 (コロンなし)
    const heightMatch = afterAge.match(/T[：: ]?(\d{3})/);
    const cupMatch = afterAge.match(/([A-J])\s*(?:カップ|cup)/i);

    // 画像: li内のfigure内のimg
    const img = $el.find('img[src*="images"]').first();
    let imgSrc = img.attr('src') || '';
    if (imgSrc && !imgSrc.startsWith('http')) {
      imgSrc = BASE_URL + (imgSrc.startsWith('/') ? imgSrc : '/' + imgSrc);
    }
    // rank/* または store/* パターンの画像のみ使用
    if (imgSrc && !/\/(rank|store|cast|profile)\//i.test(imgSrc)) imgSrc = '';

    therapists.push({
      name,
      imgSrc,
      age: ageMatch ? parseInt(ageMatch[1]) : null,
      height: heightMatch ? parseInt(heightMatch[1]) : null,
      cup: cupMatch ? cupMatch[1].toUpperCase() : null,
    });
  });

  const unique = [...new Map(therapists.map(t => [t.name, t])).values()];
  console.log(`取得: ${unique.length}名`);
  unique.forEach(t => console.log(`  ${t.name} (${t.age}歳, T${t.height}) img:${t.imgSrc ? '✅' : '❌'}`));

  // 既存削除して再挿入
  console.log('\n既存削除中...');
  const { error: delErr } = await supabase.from('therapists').delete().eq('shop_id', SHOP_ID);
  if (delErr) console.log(`削除エラー: ${delErr.message}`);

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
