import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const { data } = await supabase.from('shops')
  .select('id, name, image_url, website_url')
  .ilike('name', '%聖子%')
  .single();

console.log('現在のimage_url:', data?.image_url);
console.log('website_url:', data?.website_url);

// サイトから取得できる画像を確認
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const res = await fetch('https://madame-seiko.com', { headers: ua, signal: AbortSignal.timeout(12000) });
const html = await res.text();
const $ = cheerio.load(html);

const ogImg = $('meta[property="og:image"]').attr('content');
console.log('\nog:image:', ogImg);
console.log('\n先頭img 5件:');
$('img').slice(0, 5).each((i, el) => {
  console.log(`  [${i}] src="${$(el).attr('src')}" alt="${$(el).attr('alt')}"`);
});
