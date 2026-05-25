import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const targets = ['RESEXY', 'Mrs Crystal', 'Aroma Terrace'];

for (const name of targets) {
  const { data } = await supabase.from('shops')
    .select('id,name,website_url,schedule_url,image_url')
    .ilike('name', `%${name.split(' ')[0]}%`)
    .filter('raw_data->>prefecture', 'eq', '愛知県');

  const s = data?.[0];
  if (!s) { console.log(`${name}: 店舗見つからず`); continue; }

  console.log(`\n=== ${s.name} ===`);
  console.log(`  id: ${s.id}`);
  console.log(`  website_url: ${s.website_url}`);
  console.log(`  image_url: ${s.image_url || '❌なし'}`);
  console.log(`  schedule_url: ${s.schedule_url || '❌なし'}`);

  if (!s.website_url) { console.log(`  ⚠️ website_urlなし → スキップ`); continue; }

  // ホームページのリンクを確認
  try {
    const res = await fetch(s.website_url, { headers: ua, signal: AbortSignal.timeout(10000) });
    const html = await res.text();
    const $ = cheerio.load(html);

    // スケジュール関連リンク
    const schedLinks = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      if (/schedule|timetable|出勤|シフト|スケジュール|shift|attendance/i.test(href + text)) {
        try {
          const abs = new URL(href, s.website_url).href;
          schedLinks.push(`[${text.slice(0,20)}] → ${abs}`);
        } catch {}
      }
    });
    console.log(`  スケジュール候補リンク:`);
    schedLinks.slice(0, 5).forEach(l => console.log(`    ${l}`));
    if (schedLinks.length === 0) console.log(`    (なし)`);

    // og:image
    const ogImg = $('meta[property="og:image"]').attr('content') || '';
    console.log(`  og:image: ${ogImg || '(なし)'}`);

    // パス試行
    const paths = ['/schedule/', '/schedule', '/schedule.php', '/timetable/', '/shift/'];
    for (const p of paths) {
      const url = new URL(p, s.website_url).href;
      try {
        const r = await fetch(url, { headers: ua, method: 'HEAD', signal: AbortSignal.timeout(4000) });
        if (r.ok) console.log(`  ✅ HEAD ${r.status} ${url}`);
      } catch {}
    }
  } catch (e) {
    console.log(`  ❌ fetch失敗: ${e.message}`);
  }
  await sleep(500);
}
