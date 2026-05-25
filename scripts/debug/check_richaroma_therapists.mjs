/**
 * RICH AROMA セラピスト画像デバッグ
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };

const SHOP_ID = 'aichi_sakae_rich_aroma';
const BASE = 'https://richaroma.nagoya';

// DB内の現在のセラピスト画像URL確認
console.log('=== DB内セラピスト ===');
const { data: therapists } = await supabase.from('therapists')
  .select('id,name,image_url')
  .eq('shop_id', SHOP_ID)
  .limit(5);
therapists?.forEach(t => console.log(`  ${t.name}: ${t.image_url?.slice(0, 80) || '(なし)'}`));

// /therapist.php の構造確認
console.log('\n=== /therapist.php 構造 ===');
const res = await fetch(`${BASE}/therapist.php`, { headers: ua, signal: AbortSignal.timeout(12000) });
const html = await res.text();
const $ = cheerio.load(html);

console.log(`.item.clearfix 数: ${$('.item.clearfix').length}`);
$('.item.clearfix').slice(0, 3).each((i, el) => {
  const $el = $(el);
  const text = $el.text().trim().replace(/\s+/g, ' ').slice(0, 80);
  const img = $el.find('img').first();
  const src = img.attr('src') || '';
  const dataSrc = img.attr('data-src') || '';
  const lazySrc = img.attr('data-lazy-src') || img.attr('data-original') || '';
  console.log(`  [${i}] text: ${text}`);
  console.log(`       src: ${src.slice(0, 80)}`);
  if (dataSrc) console.log(`       data-src: ${dataSrc.slice(0, 80)}`);
  if (lazySrc) console.log(`       lazy-src: ${lazySrc.slice(0, 80)}`);
});

// schedule_urlも確認
console.log('\n=== schedule確認 ===');
const sr = await fetch(`${BASE}/schedule.php`, { headers: ua, method: 'HEAD', signal: AbortSignal.timeout(5000) });
console.log(`/schedule.php: ${sr.status}`);
const { data: shop } = await supabase.from('shops').select('schedule_url').eq('id', SHOP_ID).single();
console.log(`DB schedule_url: ${shop?.schedule_url}`);
