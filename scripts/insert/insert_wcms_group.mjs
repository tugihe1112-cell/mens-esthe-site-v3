/**
 * wcms/gals CMS グループ一括挿入
 * ダーリンプレミアム / Queen Spumante / ビューティーアンドビースト / ベルマドンナ
 * 実行: node scripts/insert/insert_wcms_group.mjs
 *
 * ※ このCMSはJSレンダリングが多いため、HTMLから取れる分のみ挿入。
 *   取得数が少ない場合はブラウザ経由での取得を検討してください。
 */
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const SHOPS = [
  { shopId: 'osaka_umeda_darlin_premium',             name: 'ダーリンプレミアム',        baseUrl: 'https://darlin-premium.com',  castPath: '/gals/' },
  { shopId: 'osaka_sakaisujihonmachi_queen_spumante', name: 'Queen Spumante',           baseUrl: 'https://queenspumante.com',   castPath: '/gals/' },
  { shopId: 'osaka_umeda_beauty_and_beast',           name: 'ビューティーアンドビースト', baseUrl: 'https://beauty-and-beast.net', castPath: '/gals/' },
  { shopId: 'osaka_umeda_bellmadonna',                name: 'ベルマドンナ',               baseUrl: 'https://bellmadonna.com',     castPath: '/gals/' },
];

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

async function scrapeShop({ shopId, name, baseUrl, castPath }) {
  console.log(`\n[${shopId}] ${name}`);

  // 候補URL一覧 (castPath優先)
  const urls = [
    baseUrl + castPath,
    baseUrl + '/cast/',
    baseUrl + '/staff/',
    baseUrl + '/therapist/',
    baseUrl + '/girl/',
    baseUrl + '/',
  ];

  let html = '';
  let usedUrl = '';

  for (const u of urls) {
    try {
      const res = await fetch(u, { headers: ua, signal: AbortSignal.timeout(12000) });
      if (res.ok) {
        html = await res.text();
        usedUrl = u;
        console.log(`  URL: ${u} → ${res.status}`);
        break;
      }
    } catch (e) {
      console.log(`  ${u} → エラー: ${e.message}`);
    }
  }

  if (!html) {
    console.log('  ❌ 全URLで取得失敗');
    return 0;
  }

  const $ = cheerio.load(html);
  const therapists = [];

  // === 方法1: wcms/gals 画像 (直接 src) ===
  $('img[src*="wcms/gals"], img[src*="wcms/cast"]').each((_, el) => {
    const $img = $(el);
    const src = $img.attr('src') || '';
    const alt = $img.attr('alt') || '';
    const parent = $img.closest('li, div, article, section').first();
    const text = parent.text().replace(/\s+/g, ' ').trim();

    const nameMatch = text.match(/([ぁ-んァ-ヾ一-龯]{2,8}(?:[\s　][ぁ-んァ-ヾ一-龯]{1,6})?)\s*[（(](\d{2,3})[)）]/)
      || alt.match(/([ぁ-んァ-ヾ一-龯]{2,8})/);
    if (!nameMatch) return;

    const name = nameMatch[1].trim();
    if (!name || name.length < 2) return;

    const ageMatch = text.match(/[（(](\d{2,3})[)）]/);
    const heightMatch = text.match(/(?:T|身長)[.．:：]?\s*(\d{3})/) || text.match(/(\d{3})\s*cm/i);
    const cupMatch = text.match(/([A-J])\s*(?:カップ|cup)/i);

    const imgSrc = src.startsWith('http') ? src : new URL(src, baseUrl).href;
    therapists.push({ name, imgSrc, age: ageMatch ? parseInt(ageMatch[1]) : null, height: heightMatch ? parseInt(heightMatch[1]) : null, cup: cupMatch?.[1]?.toUpperCase() || null });
  });

  // === 方法2: lazy load 画像 (data-src 系) ===
  if (therapists.length === 0) {
    $('img[data-src*="wcms"], img[data-lazy*="wcms"], img[data-src], img[data-lazy-src]').each((_, el) => {
      const $img = $(el);
      const lazySrc = $img.attr('data-src') || $img.attr('data-lazy') || $img.attr('data-lazy-src') || $img.attr('data-original') || '';
      if (!lazySrc.match(/\.(jpg|jpeg|png|webp)/i)) return;
      const alt = $img.attr('alt') || '';
      const parent = $img.closest('li, div, article').first();
      const text = parent.text().replace(/\s+/g, ' ').trim();

      const nameMatch = text.match(/([ぁ-んァ-ヾ一-龯]{2,8}(?:[\s　][ぁ-んァ-ヾ一-龯]{1,6})?)\s*[（(](\d{2,3})[)）]/)
        || alt.match(/([ぁ-んァ-ヾ一-龯]{2,8})/);
      if (!nameMatch) return;

      const name = nameMatch[1].trim();
      if (!name || name.length < 2) return;

      const ageMatch = text.match(/[（(](\d{2,3})[)）]/);
      const heightMatch = text.match(/(?:T|身長)[.．:：]?\s*(\d{3})/) || text.match(/(\d{3})\s*cm/i);
      const cupMatch = text.match(/([A-J])\s*(?:カップ|cup)/i);

      const imgSrc = lazySrc.startsWith('http') ? lazySrc : new URL(lazySrc, baseUrl).href;
      therapists.push({ name, imgSrc, age: ageMatch ? parseInt(ageMatch[1]) : null, height: heightMatch ? parseInt(heightMatch[1]) : null, cup: cupMatch?.[1]?.toUpperCase() || null });
    });
  }

  // === 方法3: script内のデータ ===
  if (therapists.length === 0) {
    $('script').each((_, el) => {
      const content = $(el).html() || '';
      // JSON配列のような構造で日本語名前があれば
      const jsonLike = content.match(/\[\s*\{[^[\]]*[ぁ-んァ-ヾ一-龯][^[\]]*\}\s*(?:,\s*\{[^[\]]*\})*\s*\]/g) || [];
      for (const block of jsonLike) {
        try {
          const data = JSON.parse(block);
          if (!Array.isArray(data)) continue;
          for (const item of data) {
            const name = (item.name || item.therapistName || item.castName || item.gal_name || '').trim();
            if (!name || name.length < 2) continue;
            const imgSrc = item.img || item.photo || item.image || item.img1 || '';
            const fullSrc = imgSrc ? (imgSrc.startsWith('http') ? imgSrc : new URL(imgSrc, baseUrl).href) : '';
            therapists.push({
              name, imgSrc: fullSrc,
              age: item.age ? parseInt(item.age) : null,
              height: item.height ? parseInt(item.height) : null,
              cup: (item.cup || item.bust || '').match(/([A-J])/i)?.[1]?.toUpperCase() || null,
            });
          }
        } catch {}
      }
    });
  }

  // === 方法4: テキストのみ (最終フォールバック) ===
  if (therapists.length === 0) {
    console.log('  画像なし → テキスト抽出フォールバック');
    const nameMatches = [...html.matchAll(/([ぁ-んァ-ヾ一-龯]{2,8}(?:[\s　][ぁ-んァ-ヾ一-龯]{1,6})?)\s*[（(](\d{2,3})[)）]/g)];
    const seen = new Set();
    for (const m of nameMatches) {
      const name = m[1].trim();
      if (name.length < 2 || seen.has(name)) continue;
      // 「プレミアム」「セラピー」などのノイズ除去
      if (/プレミアム|セラピー|コース|ルーム|マッサージ|キャンペーン/.test(name)) continue;
      seen.add(name);

      // 周辺テキストから年齢・身長を取得
      const idx = html.indexOf(m[0]);
      const ctx = html.slice(Math.max(0, idx - 100), idx + 200);
      const heightMatch = ctx.match(/(?:T|身長)[.．:：]?\s*(\d{3})/) || ctx.match(/(\d{3})\s*cm/i);
      const cupMatch = ctx.match(/([A-J])\s*(?:カップ|cup)/i);

      therapists.push({ name, imgSrc: '', age: parseInt(m[2]), height: heightMatch ? parseInt(heightMatch[1]) : null, cup: cupMatch?.[1]?.toUpperCase() || null });
    }
  }

  const unique = [...new Map(therapists.map(t => [t.name, t])).values()];
  console.log(`  取得: ${unique.length}名`);
  unique.slice(0, 5).forEach(t => console.log(`    ${t.name} (${t.age}歳, T${t.height}, ${t.imgSrc.slice(0, 40)})`));

  if (unique.length === 0) {
    console.log('  ❌ セラピスト取得できず (JSレンダリングの可能性)');
    return 0;
  }

  let inserted = 0;
  for (const t of unique) {
    const therapistId = `${shopId}_${t.name.replace(/\s+/g, '_').replace(/[^\w぀-鿿ぁ-ん]/g, '')}`;
    const storedUrl = t.imgSrc ? await uploadImage(t.imgSrc, therapistId) : null;
    const { error } = await supabase.from('therapists').upsert({
      id: therapistId, shop_id: shopId, name: t.name,
      age: t.age, height: t.height, cup: t.cup,
      image_url: storedUrl || t.imgSrc || null,
    });
    if (error) console.log(`    挿入エラー: ${error.message}`);
    else { inserted++; process.stdout.write('.'); }
  }
  console.log(`\n  ✅ ${inserted}名挿入完了`);
  return inserted;
}

let total = 0;
for (const shop of SHOPS) {
  total += await scrapeShop(shop);
}
console.log(`\n\n全体: ${total}名挿入`);
