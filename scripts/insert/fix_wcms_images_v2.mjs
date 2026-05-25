/**
 * wcms/gals CMSグループ 画像URL追加 v2
 * data-src の取得を強化 + 診断ログ付き
 * 実行: node scripts/insert/fix_wcms_images_v2.mjs
 */
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// ブラウザに近いヘッダー
const ua = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Cache-Control': 'no-cache',
};

const SHOPS = [
  { shopId: 'osaka_umeda_darlin_premium',             baseUrl: 'https://darlin-premium.com',  castPath: '/gals/' },
  { shopId: 'osaka_sakaisujihonmachi_queen_spumante', baseUrl: 'https://queenspumante.com',   castPath: '/gals/' },
  { shopId: 'osaka_umeda_beauty_and_beast',           baseUrl: 'https://beauty-and-beast.net', castPath: '/gals/' },
];

async function uploadImage(imageUrl, therapistId) {
  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': ua['User-Agent'] },
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

for (const { shopId, baseUrl, castPath } of SHOPS) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`[${shopId}]`);

  try {
    const fetchUrl = baseUrl + castPath;
    const res = await fetch(fetchUrl, { headers: ua, signal: AbortSignal.timeout(15000) });
    const html = await res.text();
    const $ = cheerio.load(html);

    // 診断: data-src 全パターンを確認
    const allDataSrc = $('img[data-src]');
    const allDataLazy = $('img[data-lazy]');
    const allDataLazySrc = $('img[data-lazy-src]');
    const allDataOriginal = $('img[data-original]');
    const allImg = $('img');

    console.log(`  全img: ${allImg.length}, data-src: ${allDataSrc.length}, data-lazy: ${allDataLazy.length}, data-lazy-src: ${allDataLazySrc.length}, data-original: ${allDataOriginal.length}`);

    // wcms パターンを含むものを全検索 (直接正規表現)
    const wcmsMatches = html.match(/data-src="(\/wcms\/[^"]+)"/g) || [];
    console.log(`  HTML内 wcms data-src: ${wcmsMatches.length}件`);
    if (wcmsMatches.length > 0) {
      console.log(`  例: ${wcmsMatches[0]}`);
    }

    // HTML 先頭から最初の img タグを確認
    const firstImgMatch = html.match(/<img[^>]+>/);
    if (firstImgMatch) {
      console.log(`  最初のimgタグ: ${firstImgMatch[0].slice(0, 200)}`);
    }

    // 全属性名を検索
    const attrNames = new Set();
    $('img').each((_, el) => {
      Object.keys(el.attribs || {}).forEach(a => attrNames.add(a));
    });
    console.log(`  img属性一覧: ${[...attrNames].join(', ')}`);

    // imageMap構築: 名前 → 画像URL (全パターン試す)
    const imageMap = new Map();

    $('img').each((_, el) => {
      const $img = $(el);
      // 全ての可能性のある画像URL属性を試す
      const src = $img.attr('data-src') || $img.attr('data-lazy')
        || $img.attr('data-lazy-src') || $img.attr('data-original')
        || $img.attr('src') || '';

      if (!src || !src.match(/\.(jpg|jpeg|png|webp)/i)) return;
      if (!/wcms|cast|upload|photo/i.test(src)) return;

      const alt = ($img.attr('alt') || '').trim().replace(/\s+/g, '');
      if (!alt || alt.length < 2) return;

      const fullSrc = src.startsWith('http') ? src : baseUrl + src;
      if (!imageMap.has(alt)) {
        imageMap.set(alt, fullSrc);
      }
    });

    console.log(`  imageMap: ${imageMap.size}件`);
    [...imageMap.entries()].slice(0, 3).forEach(([n, u]) => console.log(`    ${n} → ${u.slice(0, 70)}`));

    if (imageMap.size === 0) {
      // HTMLから直接正規表現でデータ抽出
      const imgPattern = /data-(?:src|lazy|lazy-src|original)="([^"]*(?:wcms|cast|upload|photo)[^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"/gi;
      const altPattern = /alt="([^"]{1,30})"/gi;

      // imgタグ全体を抽出してパース
      const imgTags = [...html.matchAll(/<img[^>]+>/gi)];
      console.log(`  imgタグ総数(regex): ${imgTags.length}`);
      for (const [tag] of imgTags.slice(0, 3)) {
        console.log(`  imgタグ例: ${tag.slice(0, 150)}`);
      }
      console.log('  → 画像なし、スキップ');
      continue;
    }

    // 既存セラピストを取得して画像を更新
    const { data: existing, error: fetchErr } = await supabase
      .from('therapists')
      .select('id, name, image_url')
      .eq('shop_id', shopId);

    if (fetchErr) { console.log(`  取得エラー: ${fetchErr.message}`); continue; }
    console.log(`  既存レコード: ${existing.length}名`);

    let updated = 0, skipped = 0, notFound = 0;

    for (const t of existing) {
      const nameKey = t.name.replace(/\s+/g, '');
      let imgSrc = imageMap.get(nameKey);

      // スペースなしで見つからない場合、部分一致
      if (!imgSrc) {
        for (const [k, v] of imageMap.entries()) {
          if (k.includes(nameKey) || nameKey.includes(k)) {
            imgSrc = v;
            break;
          }
        }
      }

      if (!imgSrc) { notFound++; continue; }
      if (t.image_url && t.image_url.includes('supabase') && !t.image_url.includes('placeholder')) {
        skipped++;
        continue;
      }

      const storedUrl = await uploadImage(imgSrc, t.id);
      if (storedUrl) {
        const { error } = await supabase.from('therapists').update({ image_url: storedUrl }).eq('id', t.id);
        if (!error) { updated++; process.stdout.write('.'); }
        else console.log(`  更新エラー: ${error.message}`);
      }
    }
    console.log(`\n  ✅ ${updated}名更新, ${skipped}名スキップ, ${notFound}名マッチなし`);

  } catch (e) {
    console.log(`  ❌ ${e.message}`);
  }
}
