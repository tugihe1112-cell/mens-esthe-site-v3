import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const { data: shops } = await supabase.from('shops')
  .select('id,name,website_url').filter('raw_data->>prefecture', 'eq', '愛知県')
  .not('website_url', 'is', null).order('id');

console.log(`URL付き店舗: ${shops.length}件\n`);

for (const s of shops) {
  try {
    const res = await fetch(s.website_url, { headers: ua, signal: AbortSignal.timeout(8000) });
    if (!res.ok) { console.log(`❌ ${s.name}: HTTP ${res.status}`); await sleep(300); continue; }
    const html = await res.text();

    const cms =
      html.includes('caskan') ? 'caskan' :
      html.includes('3days') ? '3days' :
      html.includes('men-es.jp') ? 'men-es' :
      html.includes('/gals/') ? 'wcms' :
      html.includes('wp-content') ? 'wordpress' :
      html.includes('wcms') ? 'wcms' :
      'generic';

    // therapistページのパターン探索
    const therapistLinks = [];
    const linkPatterns = ['/therapist', '/cast', '/staff', '/girl', '/gals', '/member', '/lady'];
    for (const pat of linkPatterns) {
      if (html.includes(pat)) therapistLinks.push(pat);
    }

    // OGP画像
    const ogImg = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/)?.[1] || '';

    console.log(`✅ ${s.name} [${cms}]`);
    console.log(`   URL: ${s.website_url}`);
    console.log(`   therapistページ候補: ${therapistLinks.join(', ') || 'なし'}`);
    console.log(`   og:image: ${ogImg.slice(0, 70) || 'なし'}`);
  } catch (e) {
    console.log(`❌ ${s.name}: ${e.message?.slice(0,50)}`);
  }
  await sleep(400);
}
