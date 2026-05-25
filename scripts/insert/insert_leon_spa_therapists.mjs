/**
 * LEON SPA (leonspa.net) + LEON SPA Gold (leonspa-gold.com) セラピスト挿入
 * 実行: node scripts/insert/insert_leon_spa_therapists.mjs
 */
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const SHOPS = [
  { shopId: 'osaka_sakaihigashi_leonspa', url: 'https://leonspa.net/girl', base: 'https://leonspa.net' },
  { shopId: 'osaka_sakuragawa_leonspa_gold', url: 'https://leonspa-gold.com/girl', base: 'https://leonspa-gold.com' },
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

for (const { shopId, url, base } of SHOPS) {
  console.log(`\n[${shopId}]`);
  try {
    const res = await fetch(url, { headers: ua });
    const html = await res.text();
    const $ = cheerio.load(html);

    const therapists = [];
    $('[class*="rank_frame"] img[src*="photos"]').each((_, el) => {
      const $img = $(el);
      const alt = $img.attr('alt')?.trim() || '';
      let imgSrc = $img.attr('src') || '';

      // 特殊記号のみのaltはスキップ (キャンペーン告知など)
      if (!alt || alt.length < 1 || /^[★☆♦♠♣●◎■□▲▼※→←↑↓＊・。、]/.test(alt)) return;
      if (/割|キャンペーン|特典|イベント|求人|スタッフ募集/i.test(alt)) return;

      // 名前: "愛菜(あいな)" → "愛菜", "優(ゆう)" → "優"
      const name = alt
        .replace(/（[^）]*）/g, '') // 全角括弧内除去
        .replace(/\([ぁ-ん]+\)/g, '') // 半角括弧のひらがな除去
        .trim();
      if (!name || name.length < 1) return;

      if (!imgSrc.startsWith('http')) imgSrc = base + (imgSrc.startsWith('/') ? imgSrc : '/' + imgSrc);
      // キャッシュバスターを1つに
      imgSrc = imgSrc.replace(/(\?[^?]+)\?[^?]*$/, '$1');

      therapists.push({ name, imgSrc, age: null, height: null, cup: null });
    });

    const unique = [...new Map(therapists.map(t => [t.name, t])).values()];
    console.log(`取得: ${unique.length}名`);
    unique.slice(0, 5).forEach(t => console.log(`  ${t.name} → ${t.imgSrc.slice(0, 60)}`));

    let inserted = 0;
    for (const t of unique) {
      const therapistId = `${shopId}_${t.name.replace(/\s+/g, '_').replace(/[^\w぀-鿿ぁ-ん]/g, '')}`;
      const storedUrl = await uploadImage(t.imgSrc, therapistId);
      const { error } = await supabase.from('therapists').upsert({
        id: therapistId, shop_id: shopId, name: t.name,
        age: null, height: null, cup: null,
        image_url: storedUrl || t.imgSrc,
      });
      if (error) console.log(`  挿入エラー: ${error.message}`);
      else { inserted++; process.stdout.write('.'); }
    }
    console.log(`\n  ✅ ${inserted}名挿入完了`);
  } catch (e) {
    console.log(`  ❌ ${e.message}`);
  }
}
