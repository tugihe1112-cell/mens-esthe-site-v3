import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };

// 1. DBのshop情報
const { data: shop } = await supabase.from('shops')
  .select('id,name,image_url,price_system,raw_data')
  .eq('id','kyoto_senbon_sanjo_pure_white').single();
console.log('=== Shop DB ===');
console.log('image_url:', shop?.image_url);
console.log('price_system:', JSON.stringify(shop?.price_system));
console.log('prefecture:', shop?.raw_data?.prefecture);
console.log('city:', shop?.raw_data?.city);
console.log('area:', shop?.raw_data?.area);

// 2. セラピストDB（全員）
const { data: therapists, count } = await supabase.from('therapists')
  .select('id,name,image_url', { count: 'exact' })
  .eq('shop_id','kyoto_senbon_sanjo_pure_white');
console.log(`\n=== Therapists (${count}名) ===`);
const withImg = (therapists || []).filter(t => t.image_url);
const withoutImg = (therapists || []).filter(t => !t.image_url);
console.log(`画像あり: ${withImg.length}名, 画像なし: ${withoutImg.length}名`);
if (therapists?.length > 0) {
  console.log('先頭5名:');
  therapists.slice(0,5).forEach(t => console.log(`  ${t.name}: ${t.image_url?.slice(0,80) || 'null'}`));
}

// 3. /cast/ ページ構造確認
console.log('\n=== /cast/ ページ ===');
const res = await fetch('https://purewhite-aroma.com/cast/', { headers: ua, signal: AbortSignal.timeout(10000) }).catch(() => null);
if (!res?.ok) {
  console.log(`❌ 取得失敗: status=${res?.status}`);
} else {
  const html = await res.text();
  const $ = cheerio.load(html);
  console.log('img総数:', $('img').length);

  // alt="Pure White"を含む画像
  const pwImgs = [];
  $('img').each((_, el) => {
    const alt = $(el).attr('alt') || '';
    const src = $(el).attr('src') || '';
    if (alt.includes('Pure White') || alt.includes('ピュアホワイト')) {
      pwImgs.push({ alt, src });
    }
  });
  console.log(`alt含む画像: ${pwImgs.length}件`);
  pwImgs.slice(0,5).forEach(i => console.log(`  [${i.alt}] ${i.src.slice(0,80)}`));

  // upload/cast を含む画像
  const castImgs = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src') || '';
    if (src.includes('cast')) castImgs.push({ alt: $(el).attr('alt'), src });
  });
  console.log(`\ncast系URL画像: ${castImgs.length}件`);
  castImgs.slice(0,5).forEach(i => console.log(`  [${i.alt}] ${i.src.slice(0,80)}`));

  // その他のパターン探索
  console.log('\n全img先頭10件:');
  $('img').slice(0,10).each((_, el) => {
    console.log(`  [${$(el).attr('alt')}] ${$(el).attr('src')?.slice(0,80)}`);
  });

  // aタグのhref内にcastがあるか
  const aLinks = $('a[href*="cast"]').map((_,el) => $(el).attr('href')).get();
  console.log('\ncast含むリンク:', aLinks.slice(0,5));
}
