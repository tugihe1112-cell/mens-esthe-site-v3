/**
 * wife-line系店舗 Shift-JIS対応 セラピスト挿入
 * 和いふらいん (juso/takatsuki) / ミセス美オーラ / タマネギ
 * 実行: node scripts/insert/insert_wifeline_group.mjs
 */
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// Shift-JIS対応フェッチ
async function fetchSjis(url) {
  const res = await fetch(url, { headers: ua, signal: AbortSignal.timeout(12000) });
  const buffer = await res.arrayBuffer();
  // Shift-JIS → UTF-8
  try {
    const decoded = new TextDecoder('shift-jis').decode(buffer);
    return decoded;
  } catch {
    return new TextDecoder('utf-8').decode(buffer);
  }
}

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

async function processWifeLineShop({ shopId, url, baseUrl, shopUrls = [] }) {
  console.log(`\n[${shopId}] ${url}`);
  try {
    const html = await fetchSjis(url);
    const $ = cheerio.load(html);

    const therapists = [];

    // gallery/xxx/girls_img_1.jpg パターンの画像
    $('img[src*="gallery/"]').each((_, el) => {
      const $img = $(el);
      const src = $img.attr('src') || '';
      if (!src.includes('girls_img')) return;

      // 相対パスを絶対パスへ
      let imgSrc = src.startsWith('http') ? src : new URL(src, baseUrl).href;
      // クエリパラメータ正規化
      imgSrc = imgSrc.replace(/(\?[^?]+)\?[^?]*$/, '$1');

      const alt = $img.attr('alt')?.trim() || '';
      // alt テキストが文字化けしていても名前として使用を試みる

      // 親要素からテキスト
      const parent = $img.closest('li, div, span').first();
      const parentText = parent.text().replace(/\s+/g, ' ').trim();

      // 名前(年齢) T.身長cm / 身長:165cm 形式
      const nameAgeMatch = parentText.match(/([ぁ-んァ-ヾ一-龯]{1,8}(?:[\s　][ぁ-んァ-ヾ一-龯]{1,6})?)\s*[（(](\d{2,3})[)）]/);
      const name = nameAgeMatch?.[1]?.trim() || (alt.length >= 2 && /[ぁ-んァ-ヾ一-龯]/.test(alt) ? alt : '');
      if (!name || name.length < 1) return;

      const ageMatch = parentText.match(/[（(](\d{2,3})[)）]/);
      const heightMatch = parentText.match(/(?:身長|T)[.．:：]?\s*(\d{3})\s*cm/);
      const cupMatch = parentText.match(/([A-J])\s*(?:カップ|cup)/i);

      therapists.push({
        name,
        imgSrc,
        age: ageMatch ? parseInt(ageMatch[1]) : null,
        height: heightMatch ? parseInt(heightMatch[1]) : null,
        cup: cupMatch?.[1]?.toUpperCase() || null,
      });
    });

    // span.gal_typeの親から名前取得 (画像が別の場合)
    if (therapists.length === 0) {
      $('span.gal_type').each((_, el) => {
        const parent = $(el).closest('li, div').first();
        const text = parent.text().replace(/\s+/g, ' ').trim();
        const nameAgeMatch = text.match(/([ぁ-んァ-ヾ一-龯]{1,8}(?:[\s　][ぁ-んァ-ヾ一-龯]{1,6})?)\s*[（(](\d{2,3})[)）]/);
        if (!nameAgeMatch) return;
        const name = nameAgeMatch[1].trim();
        const ageMatch = text.match(/[（(](\d{2,3})[)）]/);
        const heightMatch = text.match(/(?:身長|T)[.．:：]?\s*(\d{3})\s*cm/);
        therapists.push({
          name,
          imgSrc: '',
          age: ageMatch ? parseInt(ageMatch[1]) : null,
          height: heightMatch ? parseInt(heightMatch[1]) : null,
          cup: null,
        });
      });
    }

    const unique = [...new Map(therapists.map(t => [t.name, t])).values()];
    console.log(`取得: ${unique.length}名`);
    unique.slice(0, 5).forEach(t => console.log(`  ${t.name} (${t.age}歳, T${t.height})`));

    // 同じURLを使う複数の店舗IDに挿入
    const allShopIds = [shopId, ...shopUrls];
    for (const sid of allShopIds) {
      console.log(`  → [${sid}] 挿入中...`);
      let inserted = 0;
      for (const t of unique) {
        const therapistId = `${sid}_${t.name.replace(/\s+/g, '_').replace(/[^\w぀-鿿ぁ-ん]/g, '')}`;
        const storedUrl = t.imgSrc ? await uploadImage(t.imgSrc, therapistId) : null;
        const { error } = await supabase.from('therapists').upsert({
          id: therapistId, shop_id: sid, name: t.name,
          age: t.age, height: t.height, cup: t.cup,
          image_url: storedUrl || t.imgSrc || null,
        });
        if (error) console.log(`    挿入エラー: ${error.message}`);
        else { inserted++; process.stdout.write('.'); }
      }
      console.log(`\n    ✅ ${inserted}名挿入完了`);
    }
  } catch (e) {
    console.log(`  ❌ ${e.message}`);
  }
}

// 和いふらいん (2店舗が同じURL)
await processWifeLineShop({
  shopId: 'osaka_juso_wife_line',
  url: 'https://wife-line.com/',
  baseUrl: 'https://wife-line.com',
  shopUrls: ['osaka_takatsuki_wifeline'],
});

// ミセス美オーラ
await processWifeLineShop({
  shopId: 'osaka_takatsuki_mrs_viaura',
  url: 'https://mrs-viaura.com/',
  baseUrl: 'https://mrs-viaura.com',
});

// タマネギ
await processWifeLineShop({
  shopId: 'osaka_takatsuki_tamanegi',
  url: 'https://tamanegiman.com/',
  baseUrl: 'https://tamanegiman.com',
});
