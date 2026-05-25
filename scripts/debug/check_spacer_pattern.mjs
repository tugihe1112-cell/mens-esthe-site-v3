/**
 * スペーサー画像店舗のHTMLパターン調査
 * 各サイトの staff/cast ページを取得してパターンを確認
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// spacer画像を持つ店舗を取得
const { data: therapists } = await supabase
  .from('therapists')
  .select('shop_id, image_url')
  .ilike('image_url', '%spacer%');

const shopIds = [...new Set(therapists.map(t => t.shop_id))];
const countByShop = {};
for (const t of therapists) {
  countByShop[t.shop_id] = (countByShop[t.shop_id] || 0) + 1;
}

const { data: shops } = await supabase
  .from('shops')
  .select('id, name, website_url')
  .in('id', shopIds);

// 件数が多い順にソート
shops.sort((a, b) => (countByShop[b.id] || 0) - (countByShop[a.id] || 0));

const STAFF_PATHS = ['/staff/', '/cast/', '/therapist/', '/girls/', '/member/'];

for (const shop of shops.slice(0, 10)) { // まず上位10店舗を調査
  const baseUrl = shop.website_url?.replace(/\/$/, '');
  if (!baseUrl) {
    console.log(`\n[${shop.id}] URLなし`);
    continue;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`[${shop.id}] ${shop.name} (${countByShop[shop.id]}名)`);
  console.log(`URL: ${baseUrl}`);

  let html = null;
  let usedPath = null;

  for (const path of STAFF_PATHS) {
    try {
      const r = await fetch(baseUrl + path, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(8000)
      });
      if (r.ok) {
        html = await r.text();
        usedPath = path;
        break;
      }
    } catch {}
  }

  if (!html) {
    console.log('→ スタッフページ取得失敗');
    continue;
  }

  console.log(`→ ${usedPath} (${html.length} chars)`);

  const $ = cheerio.load(html);

  // background-imageパターン確認
  const bgImgCount = $('[style*="background-image"]').length;
  console.log(`  background-image要素: ${bgImgCount}個`);

  // spacer img確認
  const spacerImgs = $('img[src*="spacer"]');
  console.log(`  spacer img: ${spacerImgs.length}個`);

  // "さんの写真" alt確認
  const sannoCount = $('img[alt*="さんの写真"]').length;
  console.log(`  "さんの写真" alt: ${sannoCount}個`);

  // その他のaltパターン（最初の5件）
  const alts = [];
  $('img').each((_, el) => {
    const alt = $(el).attr('alt');
    if (alt && alt.trim()) alts.push(alt.trim());
  });
  const uniqueAlts = [...new Set(alts)].slice(0, 8);
  console.log(`  img alt サンプル: ${JSON.stringify(uniqueAlts)}`);

  // spacer + background-imageの組み合わせ
  if (spacerImgs.length > 0 && bgImgCount > 0) {
    const first = spacerImgs.first();
    const style = first.attr('style') || '';
    const alt = first.attr('alt') || '';
    const parentStyle = first.parent().attr('style') || first.closest('[style*="background"]').attr('style') || '';
    console.log(`  ★ SPACER例: alt="${alt}", style="${style.substring(0, 80)}"`);
    console.log(`    親style: "${parentStyle.substring(0, 80)}"`);
  }
}
