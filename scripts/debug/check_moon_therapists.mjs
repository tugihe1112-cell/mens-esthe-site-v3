import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// DBのセラピスト確認
const { data } = await supabase.from('therapists').select('id,name,image_url').eq('shop_id','hyogo_kobe_mrs_moon').limit(10);
console.log('=== DB (先頭10件) ===');
data?.forEach(t => console.log(`  ${t.name}: ${t.image_url || '❌ null'}`));

// /gals/ ページを再取得して画像構造を詳しく確認
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };
const res = await fetch('https://moor-kobe.jp/gals/', { headers: ua });
const html = await res.text();
const $ = cheerio.load(html);

console.log('\n=== /gals/ img[alt] で名前っぽいもの ===');
$('img[alt]').each((_, el) => {
  const alt = $(el).attr('alt') || '';
  const src = $(el).attr('src') || '';
  if (/[ぁ-んァ-ヾ一-龯]{2,}/.test(alt) && alt.length <= 10) {
    console.log(`  [${alt}] ${src}`);
  }
});

console.log('\n=== background-image style属性 ===');
$('[style*="background-image"]').each((_, el) => {
  const style = $(el).attr('style') || '';
  const m = style.match(/url\(["']?([^"')]+)["']?\)/);
  if (m) console.log(`  ${m[1]}`);
});

console.log('\n=== リンク先個人ページ ===');
const profileLinks = new Set();
$('a[href*="gal"], a[href*="cast"], a[href*="profile"], a[href*="member"]').each((_, el) => {
  profileLinks.add($(el).attr('href'));
});
console.log([...profileLinks].slice(0, 10));

// 先頭1件の個人ページを見てみる
const firstLinks = [...$('a[href]').map((_, el) => $(el).attr('href')).get()].filter(h => h && /gal|cast|profile|member/i.test(h));
if (firstLinks[0]) {
  const profUrl = firstLinks[0].startsWith('http') ? firstLinks[0] : `https://moor-kobe.jp${firstLinks[0].startsWith('/') ? '' : '/'}${firstLinks[0]}`;
  console.log('\n=== 個人ページ例:', profUrl, '===');
  const r2 = await fetch(profUrl, { headers: ua });
  const h2 = await r2.text();
  const $2 = cheerio.load(h2);
  $2('img').each((_, el) => {
    console.log(`  [${$2(el).attr('alt')}] ${$2(el).attr('src')}`);
  });
}
