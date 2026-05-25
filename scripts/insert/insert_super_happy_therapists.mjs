/**
 * スーパーハッピーガールズ (super-happy.net) セラピスト挿入
 * osaka_nipponbashi_super_happy と osaka_umeda_super_happy_girls の両方に挿入
 * 実行: node scripts/insert/insert_super_happy_therapists.mjs
 */
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SHOP_IDS = ['osaka_nipponbashi_super_happy', 'osaka_umeda_super_happy_girls'];
const THERAPIST_URL = 'https://super-happy.net/therapist';
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
    const { error } = await supabase.storage.from('therapist-images')
      .upload(`${therapistId}.${ext}`, buffer, { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('therapist-images').getPublicUrl(`${therapistId}.${ext}`);
    return publicUrl;
  } catch (e) { return null; }
}

async function run() {
  const res = await fetch(THERAPIST_URL, { headers: ua });
  const html = await res.text();
  const $ = cheerio.load(html);

  const therapists = [];
  $('figure:has(img)').each((_, el) => {
    const $el = $(el);
    const img = $el.find('img').first();
    const imgSrc = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src') || '';
    if (!imgSrc || /logo|banner|icon|sns|twitter|line|instagram/i.test(imgSrc)) return;

    // figcaptionから名前取得
    const figcaption = $el.find('figcaption').text().trim();
    // 親要素のテキスト
    const parent = $el.closest('li, article, .cast, .member, div[class*="girl"], div[class*="cast"]');
    const parentText = parent.text().replace(/\s+/g, ' ').trim();

    // 名前候補
    let name = figcaption;
    if (!name) {
      const nameMatch = parentText.match(/([ぁ-んァ-ヾ一-龯]{2,}(?:[\s　][ぁ-んァ-ヾ一-龯]{2,})?)/);
      name = nameMatch?.[1]?.trim() || '';
    }
    if (!name) {
      // ALTから
      name = img.attr('alt')?.trim() || '';
    }
    if (!name || name.length < 2) return;

    const text = parentText || figcaption;
    const ageMatch = text.match(/(\d{2,3})\s*歳/) || text.match(/\((\d{2,3})\)/);
    const heightMatch = text.match(/T[．.:]?\s*(\d{3})/) || text.match(/(\d{3})\s*cm/i);
    const cupMatch = text.match(/([A-J])\s*(?:カップ|cup)/i);

    const fullImgSrc = imgSrc.startsWith('http') ? imgSrc : new URL(imgSrc, THERAPIST_URL).href;
    therapists.push({
      name,
      imgSrc: fullImgSrc,
      age: ageMatch ? parseInt(ageMatch[1]) : null,
      height: heightMatch ? parseInt(heightMatch[1]) : null,
      cup: cupMatch ? cupMatch[1].toUpperCase() : null,
    });
  });

  const unique = [...new Map(therapists.map(t => [t.name, t])).values()];
  console.log(`取得: ${unique.length}名`);
  unique.slice(0, 5).forEach(t => console.log(`  ${t.name} (${t.age}歳, ${t.imgSrc.slice(0, 60)})`));

  // 両方の店舗IDに挿入
  for (const shopId of SHOP_IDS) {
    console.log(`\n[${shopId}] 挿入中...`);
    let inserted = 0;
    for (const t of unique) {
      const therapistId = `${shopId}_${t.name.replace(/\s+/g, '_').replace(/[^\w぀-鿿ぁ-ん]/g, '')}`;
      const storedUrl = await uploadImage(t.imgSrc, therapistId);
      const { error } = await supabase.from('therapists').upsert({
        id: therapistId, shop_id: shopId, name: t.name,
        age: t.age, height: t.height, cup: t.cup,
        image_url: storedUrl || t.imgSrc,
      });
      if (error) console.log(`  挿入エラー: ${error.message}`);
      else { inserted++; process.stdout.write('.'); }
    }
    console.log(`\n  ✅ ${inserted}名挿入完了`);
  }
}
run().catch(e => console.error('❌', e.message));
