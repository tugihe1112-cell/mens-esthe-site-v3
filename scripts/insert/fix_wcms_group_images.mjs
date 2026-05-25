/**
 * wcms/gals CMSグループ 画像URL追加
 * ダーリンプレミアム / Queen Spumante / ビューティーアンドビースト
 * data-src=/wcms/gals/images/{id}/photo_xxx.jpg を使って既存レコードに画像を付与
 * 実行: node scripts/insert/fix_wcms_group_images.mjs
 */
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const SHOPS = [
  { shopId: 'osaka_umeda_darlin_premium',             baseUrl: 'https://darlin-premium.com',  castPath: '/gals/' },
  { shopId: 'osaka_sakaisujihonmachi_queen_spumante', baseUrl: 'https://queenspumante.com',   castPath: '/gals/' },
  { shopId: 'osaka_umeda_beauty_and_beast',           baseUrl: 'https://beauty-and-beast.net', castPath: '/gals/' },
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

for (const { shopId, baseUrl, castPath } of SHOPS) {
  console.log(`\n[${shopId}]`);
  try {
    const res = await fetch(baseUrl + castPath, { headers: ua, signal: AbortSignal.timeout(15000) });
    const html = await res.text();
    const $ = cheerio.load(html);

    // data-src=/wcms/gals/images/{id}/photo_xxx.jpg を持つ img を全収集
    const imageMap = new Map(); // name → imgSrc

    $('img[data-src*="/wcms/gals/images"]').each((_, el) => {
      const $img = $(el);
      const lazySrc = $img.attr('data-src') || '';
      const alt = ($img.attr('alt') || '').trim()
        .replace(/[\s　]+/g, ' ')
        .replace(/[　　]/g, ' ')
        .trim();
      if (!alt || alt.length < 2) return;
      // 名前からスペースを除去してキーにする（DB側の名前と合わせる）
      const nameKey = alt.replace(/\s+/g, '');
      const fullSrc = lazySrc.startsWith('http') ? lazySrc : baseUrl + lazySrc;
      if (!imageMap.has(nameKey)) {
        imageMap.set(nameKey, { name: alt, imgSrc: fullSrc });
      }
    });

    console.log(`  wcms lazy画像: ${imageMap.size}件`);
    [...imageMap.entries()].slice(0, 5).forEach(([k, v]) => console.log(`    ${v.name} → ${v.imgSrc.slice(0, 60)}`));

    if (imageMap.size === 0) {
      console.log('  画像なし、スキップ');
      continue;
    }

    // 既存セラピストを取得
    const { data: existing, error: fetchErr } = await supabase
      .from('therapists')
      .select('id, name, image_url')
      .eq('shop_id', shopId);

    if (fetchErr) { console.log(`  取得エラー: ${fetchErr.message}`); continue; }
    console.log(`  既存レコード: ${existing.length}名`);

    let updated = 0, skipped = 0;

    for (const t of existing) {
      // 名前のスペースを除去してマッチング
      const nameKey = t.name.replace(/\s+/g, '');
      const entry = imageMap.get(nameKey);
      if (!entry) {
        // 部分一致も試みる
        const partialMatch = [...imageMap.entries()].find(([k]) => k.includes(nameKey) || nameKey.includes(k));
        if (!partialMatch) { skipped++; continue; }
        entry?.name && (imageMap.get(partialMatch[0]));
        const [, matchedEntry] = partialMatch;
        const storedUrl = await uploadImage(matchedEntry.imgSrc, t.id);
        if (storedUrl) {
          const { error } = await supabase.from('therapists').update({ image_url: storedUrl }).eq('id', t.id);
          if (!error) { updated++; process.stdout.write('.'); }
        }
        continue;
      }

      if (t.image_url && !t.image_url.includes('placeholder')) {
        skipped++; continue; // 既に画像あり
      }

      const storedUrl = await uploadImage(entry.imgSrc, t.id);
      if (storedUrl) {
        const { error } = await supabase.from('therapists').update({ image_url: storedUrl }).eq('id', t.id);
        if (!error) { updated++; process.stdout.write('.'); }
        else console.log(`  更新エラー: ${error.message}`);
      }
    }
    console.log(`\n  ✅ ${updated}名画像更新、${skipped}名スキップ`);
  } catch (e) {
    console.log(`  ❌ ${e.message}`);
  }
}
