/**
 * 天上人PREMIUM (tenjoubitopr.com) セラピスト挿入 v2
 * jQuery.lazyload → img.lazy[data-original] パターン対応
 * 実行: node scripts/insert/insert_tenjoubito_pr_v2.mjs
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

const SHOP_ID = 'osaka_sakaisujihonmachi_tenjoubito_pr';
const BASE_URL = 'https://www.tenjoubitopr.com';

async function uploadImage(imageUrl, therapistId) {
  try {
    const res = await fetch(imageUrl, { headers: { 'User-Agent': ua['User-Agent'] }, signal: AbortSignal.timeout(10000) });
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

console.log(`[${SHOP_ID}] 天上人PREMIUM v2`);

try {
  const res = await fetch(`${BASE_URL}/staff/`, { headers: ua, signal: AbortSignal.timeout(15000) });
  const html = await res.text();
  const $ = cheerio.load(html);

  // 全img属性を確認
  const attrNames = new Set();
  $('img').each((_, el) => Object.keys(el.attribs || {}).forEach(a => attrNames.add(a)));
  console.log(`img属性一覧: ${[...attrNames].join(', ')}`);

  const allImg = $('img');
  console.log(`全img: ${allImg.length}`);

  // サンプルを表示
  allImg.slice(0, 5).each((i, el) => {
    const $img = $(el);
    const attrs = Object.entries(el.attribs || {}).map(([k,v]) => `${k}="${v.slice(0,50)}"`).join(' ');
    console.log(`img[${i}]: ${attrs}`);
  });

  const therapists = [];

  // jQuery.lazyload は data-original を使う
  const lazyImgs = $('img.lazy, img[data-original], img[data-src], img[data-lazy]');
  console.log(`\nlazy系img: ${lazyImgs.length}`);

  lazyImgs.each((_, el) => {
    const $img = $(el);
    const imgSrc = $img.attr('data-original') || $img.attr('data-src')
      || $img.attr('data-lazy') || $img.attr('src') || '';

    if (!imgSrc || imgSrc.match(/placeholder|dummy|loading|spacer|blank/i)) return;
    if (!imgSrc.match(/\.(jpg|jpeg|png|webp)/i)) return;

    const alt = ($img.attr('alt') || '').trim();
    const parent = $img.closest('li, div, article, section, tr').first();
    const parentText = parent.text().replace(/\s+/g, ' ').trim();

    // 隣接テキストから名前を取得
    const nameFromText = parentText.match(/([ぁ-んァ-ヾ一-龯]{2,8}(?:[\s　][ぁ-んァ-ヾ一-龯]{1,6})?)/);
    const nameFromAlt = alt.replace(/（[^）]*）/g, '').replace(/\([ぁ-ん]+\)/g, '').trim();
    const name = (nameFromAlt.length >= 2 && /[ぁ-んァ-ヾ一-龯]/.test(nameFromAlt) ? nameFromAlt : null)
      || nameFromText?.[1]?.trim()
      || '';

    if (!name || name.length < 2) return;
    if (/logo|banner|icon|button/i.test(imgSrc)) return;

    const ageMatch = parentText.match(/[（(](\d{2,3})[)）]/) || parentText.match(/(\d{2,3})\s*歳/);
    const heightMatch = parentText.match(/(?:T|身長)[.．:：]?\s*(\d{3})/) || parentText.match(/(\d{3})\s*cm/i);
    const cupMatch = parentText.match(/([A-J])\s*(?:カップ|cup)/i);

    const fullSrc = imgSrc.startsWith('http') ? imgSrc : new URL(imgSrc, BASE_URL).href;
    therapists.push({
      name, imgSrc: fullSrc,
      age: ageMatch ? parseInt(ageMatch[1]) : null,
      height: heightMatch ? parseInt(heightMatch[1]) : null,
      cup: cupMatch?.[1]?.toUpperCase() || null,
    });
  });

  // lazyで取れない場合、全imgを試す
  if (therapists.length === 0) {
    console.log('\n全imgから試みます...');
    $('img').each((_, el) => {
      const $img = $(el);
      const src = Object.entries(el.attribs || {})
        .filter(([k]) => k.includes('src') || k.includes('data-'))
        .map(([,v]) => v)
        .find(v => v.match(/\.(jpg|jpeg|png|webp)/i) && !v.match(/logo|banner|icon/i)) || '';
      if (!src) return;

      const alt = ($img.attr('alt') || '').replace(/（[^）]*）/g, '').replace(/\([ぁ-ん]+\)/g, '').trim();
      if (!alt || alt.length < 2 || !/[ぁ-んァ-ヾ一-龯]/.test(alt)) return;

      const parent = $img.closest('li, div, article').first();
      const text = parent.text().replace(/\s+/g, ' ').trim();
      const ageMatch = text.match(/[（(](\d{2,3})[)）]/);
      const heightMatch = text.match(/(?:T|身長)[.．:：]?\s*(\d{3})/) || text.match(/(\d{3})\s*cm/i);

      const fullSrc = src.startsWith('http') ? src : new URL(src, BASE_URL).href;
      therapists.push({
        name: alt,
        imgSrc: fullSrc,
        age: ageMatch ? parseInt(ageMatch[1]) : null,
        height: heightMatch ? parseInt(heightMatch[1]) : null,
        cup: null,
      });
    });
    console.log(`全img試行: ${therapists.length}名`);
  }

  // 名前のみテキスト抽出（最終手段）
  if (therapists.length === 0) {
    console.log('\nテキスト抽出を試みます...');
    // div.img 構造を探す
    $('div.img, div.photo, div.thumb, div.cast-img').each((_, el) => {
      const $el = $(el);
      const img = $el.find('img').first();
      const src = img.attr('data-original') || img.attr('data-src') || img.attr('src') || '';
      const parent = $el.parent();
      const text = parent.text().replace(/\s+/g, ' ').trim();
      const nameMatch = text.match(/([ぁ-んァ-ヾ一-龯]{2,8}(?:[\s　][ぁ-んァ-ヾ一-龯]{1,6})?)/);
      if (!nameMatch) return;
      const ageMatch = text.match(/[（(](\d{2,3})[)）]/);
      therapists.push({
        name: nameMatch[1].trim(),
        imgSrc: src ? (src.startsWith('http') ? src : new URL(src, BASE_URL).href) : '',
        age: ageMatch ? parseInt(ageMatch[1]) : null,
        height: null, cup: null,
      });
    });

    // それでも0なら全テキストパターン
    if (therapists.length === 0) {
      $('li, div').each((_, el) => {
        const $el = $(el);
        if ($el.children('li, div').length > 0) return;
        const text = $el.text().replace(/\s+/g, ' ').trim();
        const nameMatch = text.match(/^([ぁ-んァ-ヾ一-龯]{2,8}(?:[\s　][ぁ-んァ-ヾ一-龯]{1,6})?)\s/);
        if (!nameMatch || text.length > 200) return;
        const ageMatch = text.match(/[（(](\d{2,3})[)）]/);
        if (!ageMatch) return;
        therapists.push({
          name: nameMatch[1].trim(),
          imgSrc: '',
          age: parseInt(ageMatch[1]),
          height: null, cup: null,
        });
      });
    }
  }

  const unique = [...new Map(therapists.map(t => [t.name, t])).values()];
  console.log(`\n取得: ${unique.length}名`);
  unique.slice(0, 5).forEach(t => console.log(`  ${t.name} (${t.age}歳, T${t.height}) ${t.imgSrc.slice(0, 50)}`));

  if (unique.length === 0) {
    // 最後の診断情報
    console.log('\n--- 診断 ---');
    console.log('HTML(500文字):', html.slice(0, 500));
    process.exit(1);
  }

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

} catch (e) {
  console.log(`❌ ${e.message}`);
}
