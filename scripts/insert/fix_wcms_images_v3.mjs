/**
 * wcms/gals CMSグループ 画像URL追加 v3
 * Supabaseアップロードを省略し、wcms URL をそのまま image_url に設定
 * 実行: node scripts/insert/fix_wcms_images_v3.mjs
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

const SHOPS = [
  { shopId: 'osaka_umeda_darlin_premium',             baseUrl: 'https://darlin-premium.com',  castPath: '/gals/' },
  { shopId: 'osaka_sakaisujihonmachi_queen_spumante', baseUrl: 'https://queenspumante.com',   castPath: '/gals/' },
  { shopId: 'osaka_umeda_beauty_and_beast',           baseUrl: 'https://beauty-and-beast.net', castPath: '/gals/' },
];

for (const { shopId, baseUrl, castPath } of SHOPS) {
  console.log(`\n[${shopId}]`);
  try {
    const res = await fetch(baseUrl + castPath, { headers: ua, signal: AbortSignal.timeout(15000) });
    const html = await res.text();
    const $ = cheerio.load(html);

    // data-original 属性から名前→画像URLのマップを構築
    const imageMap = new Map();
    $('img[data-original]').each((_, el) => {
      const $img = $(el);
      const dataSrc = $img.attr('data-original') || '';
      if (!dataSrc.match(/\.(jpg|jpeg|png|webp)/i)) return;

      const alt = ($img.attr('alt') || '').trim().replace(/[\s　]+/g, '');
      if (!alt || alt.length < 2) return;

      const fullSrc = dataSrc.startsWith('http') ? dataSrc : baseUrl + dataSrc;
      if (!imageMap.has(alt)) imageMap.set(alt, fullSrc);
    });

    console.log(`  imageMap: ${imageMap.size}件`);
    [...imageMap.entries()].slice(0, 3).forEach(([n, u]) => console.log(`    "${n}" → ${u.slice(0, 70)}`));

    if (imageMap.size === 0) { console.log('  画像なし、スキップ'); continue; }

    // 既存レコードを取得
    const { data: existing, error: fetchErr } = await supabase
      .from('therapists').select('id, name, image_url').eq('shop_id', shopId);
    if (fetchErr) { console.log(`  取得エラー: ${fetchErr.message}`); continue; }
    console.log(`  既存レコード: ${existing.length}名`);

    let updated = 0, skipped = 0, notFound = 0;

    for (const t of existing) {
      // 既にURLがある場合はスキップ
      if (t.image_url) { skipped++; continue; }

      // 名前でマッチング (スペース除去)
      const nameKey = t.name.replace(/[\s　]+/g, '');
      let imgSrc = imageMap.get(nameKey);

      // 部分一致フォールバック
      if (!imgSrc) {
        for (const [k, v] of imageMap.entries()) {
          if (k.includes(nameKey) || nameKey.includes(k)) { imgSrc = v; break; }
        }
      }

      if (!imgSrc) { notFound++; continue; }

      // wcms URL をそのまま image_url に設定（Supabaseアップロード不要）
      const { error } = await supabase.from('therapists')
        .update({ image_url: imgSrc })
        .eq('id', t.id);

      if (!error) { updated++; process.stdout.write('.'); }
      else console.log(`  更新エラー [${t.name}]: ${error.message}`);
    }
    console.log(`\n  ✅ ${updated}名更新, ${skipped}名スキップ(既存URL), ${notFound}名マッチなし`);
  } catch (e) {
    console.log(`  ❌ ${e.message}`);
  }
}
