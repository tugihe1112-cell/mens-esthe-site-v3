import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

const targets = [
  { name: 'MRS.TENOR', url: 'https://esute-tenor.net', gals: 'https://esute-tenor.net/gals/' },
  { name: 'Mrs.melty', url: 'https://melty-salon.com', gals: 'https://melty-salon.com/gals/' },
  { name: 'lemonade', url: 'https://kobe-es.net', gals: 'https://kobe-es.net/gals/' },
];

// DB検索 (website_url or nameで)
for (const t of targets) {
  console.log(`\n=== ${t.name} ===`);
  const { data } = await supabase.from('shops').select('id, name, website_url, image_url, schedule_url, price_system')
    .or(`website_url.ilike.%${new URL(t.url).hostname}%,name.ilike.%テノール%,name.ilike.%メルティ%,name.ilike.%レモネード%`);
  console.log('DB:', JSON.stringify(data));
}

// /gals/ ページ構造確認
for (const t of targets) {
  console.log(`\n=== ${t.name} /gals/ 構造 ===`);
  try {
    const res = await fetch(t.gals, { headers: ua, signal: AbortSignal.timeout(10000) });
    const html = await res.text();
    const $ = cheerio.load(html);

    // プロフィールリンク
    const uids = new Set();
    $('a[href*="profile"]').each((_, el) => {
      const m = ($(el).attr('href') || '').match(/uid=(\d+)/);
      if (m) uids.add(m[1]);
    });
    console.log(`  プロフィールUID数: ${uids.size}`);
    console.log(`  先頭3件: ${[...uids].slice(0,3).join(', ')}`);

    // img[alt]
    const imgs = [];
    $('img[alt]').each((_, el) => {
      const alt = $(el).attr('alt') || '';
      const src = $(el).attr('src') || '';
      if (/[ぁ-んァ-ヾ一-龯]{1,}/.test(alt) && alt.length <= 15) {
        imgs.push(`[${alt}] ${src.slice(0,60)}`);
      }
    });
    console.log(`  名前付きimg: ${imgs.length}件`);
    imgs.slice(0, 3).forEach(i => console.log(`    ${i}`));
  } catch (e) {
    console.log(`  エラー: ${e.message}`);
  }
}
