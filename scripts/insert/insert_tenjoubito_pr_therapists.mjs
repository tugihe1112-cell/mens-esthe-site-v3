/**
 * 天上人PREMIUM (tenjoubitopr.com) セラピスト挿入
 * 独自CMS - data-src lazy loading 対応
 * 実行: node scripts/insert/insert_tenjoubito_pr_therapists.mjs
 */
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const SHOP_ID = 'osaka_sakaisujihonmachi_tenjoubito_pr';
const BASE_URL = 'https://www.tenjoubitopr.com';

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

console.log(`[${SHOP_ID}] 天上人PREMIUM`);

try {
  // staff ページを試みる
  const STAFF_URL = `${BASE_URL}/staff/`;
  const res = await fetch(STAFF_URL, { headers: ua, signal: AbortSignal.timeout(12000) });
  const html = await res.text();
  const $ = cheerio.load(html);

  console.log(`staff ページ取得: ${res.status}`);

  const therapists = [];

  // 全画像からセラピスト写真を取得 (lazy loading 含む)
  $('img').each((_, el) => {
    const $img = $(el);
    // lazy loading 対応: data-src / data-lazy / data-lazy-src / data-original
    const imgSrc = $img.attr('data-src') || $img.attr('data-lazy')
      || $img.attr('data-lazy-src') || $img.attr('data-original')
      || $img.attr('src') || '';

    if (!imgSrc) return;
    // ロゴ・バナー・アイコン等をスキップ
    if (/logo|banner|icon|top|bg|btn|arrow|menu|map|tel|line|access|recruit/i.test(imgSrc)) return;
    if (!imgSrc.match(/\.(jpg|jpeg|png|webp)/i)) return;

    const alt = $img.attr('alt') || '';
    const parent = $img.closest('li, div, article, section').first();
    const text = parent.text().replace(/\s+/g, ' ').trim();

    // 名前抽出: 「水沢 ほのか」「愛(28歳)」など
    const nameMatch = text.match(/([ぁ-んァ-ヾ一-龯]{2,8}(?:[\s　][ぁ-んァ-ヾ一-龯]{2,6})?)\s*[（(](\d{2,3})[)）]/)
      || text.match(/^([ぁ-んァ-ヾ一-龯]{2,8})\s/);
    const altName = alt.replace(/（[^）]*）/g, '').replace(/\([ぁ-ん]+\)/g, '').trim();
    const name = nameMatch?.[1]?.trim() || (altName.length >= 2 && /[ぁ-んァ-ヾ一-龯]/.test(altName) ? altName : '');

    if (!name || name.length < 2) return;

    const ageMatch = text.match(/[（(](\d{2,3})[)）]/) || text.match(/(\d{2,3})\s*歳/);
    const heightMatch = text.match(/(?:T|身長)[.．:：]?\s*(\d{3})/) || text.match(/(\d{3})\s*cm/i);
    const cupMatch = text.match(/([A-J])\s*(?:カップ|cup)/i);

    const fullSrc = imgSrc.startsWith('http') ? imgSrc : new URL(imgSrc, BASE_URL).href;
    therapists.push({
      name, imgSrc: fullSrc,
      age: ageMatch ? parseInt(ageMatch[1]) : null,
      height: heightMatch ? parseInt(heightMatch[1]) : null,
      cup: cupMatch?.[1]?.toUpperCase() || null,
    });
  });

  // img から名前が取れなかった場合、テキストのみ抽出
  if (therapists.length === 0) {
    console.log('画像なし → テキスト抽出を試みます');
    // 日本語名前+年齢パターンを HTML から直接検索
    const nameMatches = [...html.matchAll(/([ぁ-んァ-ヾ一-龯]{2,8}(?:[\s　][ぁ-んァ-ヾ一-龯]{1,6})?)[^ぁ-んァ-ヾ一-龯\d]{0,5}(\d{2,3})\s*歳/g)];
    for (const m of nameMatches) {
      const name = m[1].trim();
      const age = parseInt(m[2]);
      if (name.length < 2 || therapists.find(t => t.name === name)) continue;
      therapists.push({ name, imgSrc: '', age, height: null, cup: null });
    }
  }

  const unique = [...new Map(therapists.map(t => [t.name, t])).values()];
  console.log(`\n取得: ${unique.length}名`);
  unique.slice(0, 5).forEach(t => console.log(`  ${t.name} (${t.age}歳, T${t.height}, imgSrc: ${t.imgSrc.slice(0, 50)})`));

  if (unique.length === 0) {
    console.log('❌ セラピストが取得できませんでした');
    // ページの内容を確認
    console.log('HTML 先頭500文字:', html.slice(0, 500));
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
