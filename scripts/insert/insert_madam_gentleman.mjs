/**
 * マダムと紳士 セラピスト挿入 + 店舗情報更新
 * https://madam-and-gentleman.com/
 * 実行: node scripts/insert/insert_madam_gentleman.mjs
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

const SHOP_ID = 'osaka_umeda_madam_gentleman';
const WEBSITE_URL = 'https://madam-and-gentleman.com';
const STAFF_URL = 'https://madam-and-gentleman.com/staff.php';
const SCHEDULE_URL = 'https://madam-and-gentleman.com/schedule.php';
const SYSTEM_URL = 'https://madam-and-gentleman.com/system.php';

async function uploadImage(imageUrl, therapistId) {
  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': ua['User-Agent'], 'Referer': WEBSITE_URL + '/' },
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const ext = imageUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
    const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
    const fileName = `${therapistId}.${safeExt}`;
    const { error } = await supabase.storage.from('therapist-images')
      .upload(fileName, buffer, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('therapist-images').getPublicUrl(fileName);
    return publicUrl;
  } catch { return null; }
}

// 料金システム（画像表示のため手動設定）
// 70分12,500円 / 90分15,000円 / 110分20,500円 / 130分26,000円 / 150分32,000円 / 170分37,500円
const priceSystem = {
  "70": 12500,
  "90": 15000,
  "110": 20500,
  "130": 26000,
  "150": 32000,
  "170": 37500,
};

// 名前バリデーション（auto_process_all_remaining.mjsと統一）
const NOISE_WORDS = /はこちら|一覧|登録|予約|お知らせ|ランキング|エステ|アロマ|セラピー|メンズ|スパ|サロン|コース|キャンペーン|マッサージ|リラクゼーション|料金|求人|募集|公式|ポリシー|プライバシー|体入|体験入店|見習い|情報サイト|ナビ$|まとめ|メディア|部長|キャバ|パブ|ポータル|専門サイト|ページトップ|トップへ|マニアックス|割引情報|紹介キャンペーン/i;
function isValidName(name) {
  if (!name || name.length < 2 || name.length > 12) return false;
  if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return false;
  if (NOISE_WORDS.test(name)) return false;
  if (/^【.*】$/.test(name)) return false; // 【...】だけの名前
  return true;
}

// 名前クリーニング: "梅田 メンズエステ【マダムと紳士】の天音ななさん" → "天音なな"
function cleanTherapistName(raw) {
  // "のXXXさん" パターン
  const match = raw.match(/の([ぁ-んァ-ヾ一-龯A-Za-zａ-ｚＡ-Ｚ\s　]+?)さん(?:の写真)?$/);
  if (match) return match[1].trim();
  // 【...】除去
  let name = raw.replace(/【[^】]*】/g, '').replace(/\([^)]*\)/g, '').replace(/（[^）]*）/g, '').trim();
  // "さん" で終わる場合除去
  name = name.replace(/さん$/, '').trim();
  return name;
}

// 2. 店舗情報更新
console.log(`料金: ${JSON.stringify(priceSystem)}`);
console.log(`[${SHOP_ID}] 店舗情報更新中...`);
const updateData = { website_url: WEBSITE_URL, schedule_url: SCHEDULE_URL, price_system: priceSystem };
const { error: shopErr } = await supabase.from('shops').update(updateData).eq('id', SHOP_ID);
if (shopErr) console.log(`  ⚠️ 店舗更新エラー: ${shopErr.message}`);
else console.log(`  ✅ 店舗情報更新完了`);

// 3. スタッフページ取得
console.log(`\nスタッフページ取得: ${STAFF_URL}`);
const res = await fetch(STAFF_URL, { headers: ua, signal: AbortSignal.timeout(15000) });
const html = await res.text();
const $ = cheerio.load(html);

console.log(`ステータス: ${res.status}, img数: ${$('img').length}`);

const therapists = [];
const seen = new Set();

// cast_box_frame構造: p.name / p.size (Age.XX / Tall. XXX) / img.cast_photo
$('div.cast_box_frame').each((_, el) => {
  const $box = $(el);

  const name = $box.find('p.name').first().text().trim();
  if (!isValidName(name) || seen.has(name)) return;
  seen.add(name);

  const sizeText = $box.find('p.size').first().text().replace(/\s+/g, ' ').trim();
  // "Age.44 / Tall. 160" パターン
  const ageMatch = sizeText.match(/Age\.?\s*(\d{2,3})/i);
  const heightMatch = sizeText.match(/Tall\.?\s*(\d{3})/i);
  const cupMatch = sizeText.match(/([A-J])\s*(?:カップ|cup|Cup)/i);

  const $img = $box.find('img.cast_photo').first();
  let imgSrc = $img.attr('src') || '';
  if (imgSrc && !imgSrc.startsWith('http')) {
    try { imgSrc = new URL(imgSrc, STAFF_URL).href; } catch {}
  }

  therapists.push({
    name,
    imgSrc,
    age: ageMatch ? parseInt(ageMatch[1]) : null,
    height: heightMatch ? parseInt(heightMatch[1]) : null,
    cup: cupMatch?.[1]?.toUpperCase() || null,
  });
});

const unique = [...new Map(therapists.map(t => [t.name, t])).values()];
console.log(`\n取得: ${unique.length}名`);
unique.slice(0, 5).forEach(t => console.log(`  ${t.name} (${t.age}歳, T${t.height})`));

if (unique.length === 0) {
  console.log('\n--- デバッグ: HTML最初の2000文字 ---');
  console.log(html.slice(0, 2000));
  process.exit(1);
}

// 4. セラピスト挿入
let inserted = 0;
for (const t of unique) {
  const therapistId = `${SHOP_ID}_${t.name.replace(/\s+/g, '_').replace(/[^\w぀-鿿ぁ-ん]/g, '')}`;
  const storedUrl = t.imgSrc ? await uploadImage(t.imgSrc, therapistId) : null;
  const { error } = await supabase.from('therapists').upsert({
    id: therapistId, shop_id: SHOP_ID, name: t.name,
    age: t.age, height: t.height, cup: t.cup,
    image_url: storedUrl || t.imgSrc || null,
  });
  if (!error) { inserted++; process.stdout.write('.'); }
  else console.log(`\n  挿入エラー: ${error.message}`);
}
console.log(`\n✅ ${inserted}名挿入完了`);

// 5. 店舗画像設定（OGP）
try {
  const topRes = await fetch(WEBSITE_URL, { headers: ua, signal: AbortSignal.timeout(10000) });
  const topHtml = await topRes.text();
  const ogMatch = topHtml.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || topHtml.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogMatch) {
    const imgUrl = ogMatch[1].startsWith('http') ? ogMatch[1] : new URL(ogMatch[1], WEBSITE_URL).href;
    const imgRes = await fetch(imgUrl, { headers: { 'User-Agent': ua['User-Agent'] }, signal: AbortSignal.timeout(10000) });
    if (imgRes.ok) {
      const buf = Buffer.from(await imgRes.arrayBuffer());
      const ext = imgUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
      const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
      const { error: upErr } = await supabase.storage.from('shop-logos')
        .upload(`${SHOP_ID}.${safeExt}`, buf, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('shop-logos').getPublicUrl(`${SHOP_ID}.${safeExt}`);
        await supabase.from('shops').update({ image_url: publicUrl }).eq('id', SHOP_ID);
        console.log(`📸 店舗画像設定: ${publicUrl.slice(0, 80)}`);
      }
    }
  } else {
    // OGPなし→ヘッダーロゴ試みる
    console.log('⚠️ OGP画像なし');
    const $top = cheerio.load(topHtml);
    const headerSrc = $top('header img, .header img, #header img, .logo img').first().attr('src') || '';
    if (headerSrc) {
      const logoUrl = headerSrc.startsWith('http') ? headerSrc : new URL(headerSrc, WEBSITE_URL).href;
      console.log(`   ヘッダーロゴ: ${logoUrl}`);
    }
  }
} catch (e) {
  console.log(`⚠️ 店舗画像取得失敗: ${e.message}`);
}
