/**
 * 原価屋 (genkaya.net) セラピスト挿入
 * mblme2whbk CMS - /girl ページ
 * alt="名前　60分XXXX円" パターン、photos/{id}/raw_{id}.jpg
 * 実行: node scripts/insert/insert_genkaya_therapists.mjs
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

const SHOP_ID = 'osaka_dispatch_genkaya';
const BASE_URL = 'https://genkaya.net';

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

console.log(`[${SHOP_ID}] 原価屋`);

try {
  // セラピスト一覧: /girl ページ
  const res = await fetch(`${BASE_URL}/girl`, { headers: ua, signal: AbortSignal.timeout(12000) });
  const html = await res.text();
  const $ = cheerio.load(html);

  console.log(`ステータス: ${res.status}, img: ${$('img').length}`);

  const therapists = [];
  const seen = new Set();

  // photos/{id}/raw_{id}.jpg パターンの画像を収集
  // alt="名前　60分XXXX円" または "名前ちゃん(XX)" パターン
  $('img').each((_, el) => {
    const $img = $(el);
    const src = $img.attr('src') || '';
    const alt = $img.attr('alt') || '';

    // photos/xxx/raw_xxx.jpg のみ対象
    if (!src.includes('/photos/') || !src.includes('raw_')) return;
    if (seen.has(src)) return;
    seen.add(src);

    // ロゴ・バナー・アイコン除外
    if (/logo|banner|icon|ranking|twitter|recruit|banner/i.test(src + alt)) return;

    // alt から名前を抽出
    // パターン1: "ゆず　60分5500円" → "ゆず"
    // パターン2: "ゆずちゃん(24)" → "ゆずちゃん" (← 実際は年齢なし)
    // パターン3: "らな　60分5500円" → "らな"
    let name = '';
    const altClean = alt.trim();

    // 料金付きパターン: "名前　XX分XXXX円"
    const priceMatch = altClean.match(/^([ぁ-んァ-ヾ一-龯a-zA-Zａ-ｚＡ-Ｚ]{1,10}(?:ちゃん|さん|くん)?)\s*[\s　]\s*\d+分/);
    if (priceMatch) {
      name = priceMatch[1].replace(/ちゃん$|さん$|くん$/, '').trim();
    }

    // 年齢付きパターン: "名前(XX)"
    if (!name) {
      const ageMatch = altClean.match(/^([ぁ-んァ-ヾ一-龯]{2,8}(?:ちゃん|さん)?)\s*[（(](\d{2,3})[)）]/);
      if (ageMatch) {
        name = ageMatch[1].replace(/ちゃん$|さん$/, '').trim();
      }
    }

    // 残りのaltをそのまま名前として使う (スペースより前)
    if (!name && altClean) {
      const parts = altClean.split(/[\s　]/);
      const candidate = parts[0];
      if (candidate.length >= 2 && /[ぁ-んァ-ヾ一-龯]/.test(candidate)) {
        name = candidate.replace(/ちゃん$|さん$/, '').trim();
      }
    }

    if (!name || name.length < 1) return;
    if (/激選|新人|施術|公式|デリバリー|イベント|お知ら|ランキング/.test(name)) return;

    // 親要素から年齢・身長を取得
    const parent = $img.closest('li, div, article, section').first();
    const text = parent.text().replace(/\s+/g, ' ').trim();
    const ageMatch = text.match(/[（(](\d{2,3})[)）]/) || text.match(/(\d{2,3})\s*歳/);
    const heightMatch = text.match(/(?:T|身長)[.．:：]?\s*(\d{3})/) || text.match(/(\d{3})\s*cm/i);
    const cupMatch = text.match(/([A-J])\s*(?:カップ|cup)/i);

    // 画像URLのキャッシュバスターを除去
    const cleanSrc = src.replace(/\?[^?]*$/, '');

    therapists.push({
      name,
      imgSrc: cleanSrc.startsWith('http') ? cleanSrc : BASE_URL + cleanSrc,
      age: ageMatch ? parseInt(ageMatch[1]) : null,
      height: heightMatch ? parseInt(heightMatch[1]) : null,
      cup: cupMatch?.[1]?.toUpperCase() || null,
    });
  });

  // /girl ページで取得できない場合、/cast/ も試す
  if (therapists.length === 0) {
    console.log('  /girl で0名 → /cast/ を試みます');
    const castRes = await fetch(`${BASE_URL}/cast/`, { headers: ua, signal: AbortSignal.timeout(10000) });
    const castHtml = await castRes.text();
    const $c = cheerio.load(castHtml);
    $c('img').each((_, el) => {
      const src = $c(el).attr('src') || '';
      const alt = $c(el).attr('alt') || '';
      if (!src.includes('/photos/') || !src.includes('raw_')) return;
      const m = alt.match(/([ぁ-んァ-ヾ一-龯]{2,8})\s*[（(](\d{2,3})[)）]/);
      if (!m) return;
      therapists.push({
        name: m[1], imgSrc: src.startsWith('http') ? src.replace(/\?.*$/, '') : BASE_URL + src.replace(/\?.*$/, ''),
        age: parseInt(m[2]), height: null, cup: null,
      });
    });
  }

  const unique = [...new Map(therapists.map(t => [t.name, t])).values()];
  console.log(`\n取得: ${unique.length}名`);
  unique.slice(0, 8).forEach(t => console.log(`  ${t.name} (${t.age}歳) → ${t.imgSrc.slice(0, 60)}`));

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
