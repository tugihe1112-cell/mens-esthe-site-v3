import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };

const { data: shop } = await supabase.from('shops')
  .select('id,name,website_url,schedule_url,image_url')
  .ilike('name', '%Aroma Terrace%')
  .single();

console.log(`id: ${shop?.id}`);
console.log(`website_url: ${shop?.website_url}`);

if (!shop?.website_url) { console.log('website_urlなし'); process.exit(0); }

const BASE = shop.website_url.replace(/\/$/, '');

// トップページ
const res = await fetch(BASE, { headers: ua, signal: AbortSignal.timeout(12000) });
const html = await res.text();
const $ = cheerio.load(html);

// 全リンク
console.log('\n=== ナビリンク ===');
$('nav a, header a, .menu a, .gnav a').each((_, el) => {
  const href = $(el).attr('href') || '';
  const text = $(el).text().trim().slice(0, 30);
  if (href && !href.startsWith('#')) console.log(`  [${text}] → ${href}`);
});

// 画像パターン確認
console.log('\n=== 全img (先頭10件) ===');
$('img').slice(0, 10).each((i, el) => {
  const src = $(el).attr('src') || '';
  const alt = $(el).attr('alt') || '';
  const dataSrc = $(el).attr('data-src') || '';
  console.log(`  [${i}] src=${src.slice(0,70)} alt="${alt}" ${dataSrc ? 'data-src='+dataSrc.slice(0,50) : ''}`);
});

console.log(`\nog:image: ${$('meta[property="og:image"]').attr('content') || '(なし)'}`);

// スケジュール候補パス試行
const paths = ['/schedule/', '/schedule', '/schedule.php', '/timetable/', '/staff/', '/staff.php', '/cast/', '/girl/', '/therapist/'];
console.log('\n=== パス試行 ===');
for (const p of paths) {
  const url = new URL(p, BASE + '/').href;
  try {
    const r = await fetch(url, { headers: ua, method: 'HEAD', signal: AbortSignal.timeout(4000) });
    console.log(`  ${r.ok ? '✅' : '❌'} ${r.status} ${url}`);
  } catch { console.log(`  ⚠️ ${url}`); }
}
