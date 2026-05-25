/**
 * 小口残件の一括調査
 * DAHLIA・Weal・アロマリゾート・ミセスの子守唄・Fu-Ryu・うさぎのお部屋・
 * QUEEN'S COLLECTION・CREST SPA・GRACE・熟れた果実・Aroma BANKER
 * 実行: node scripts/debug/check_small_targets.mjs
 */
import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchHtml(url, referer) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Referer: referer || url },
      signal: AbortSignal.timeout(12000),
    });
    return { ok: res.ok, status: res.status, text: res.ok ? await res.text() : '' };
  } catch (e) { return { ok: false, status: 0, text: '' }; }
}

async function getNullNames(urlPart) {
  const { data: shops } = await supabase.from('shops').select('id, name, website_url').ilike('website_url', `%${urlPart}%`);
  const shopIds = shops?.map(s => s.id) || [];
  const { data: t } = await supabase.from('therapists').select('name').in('shop_id', shopIds).is('image_url', null);
  const uniqueNames = [...new Set(t?.map(x => x.name) || [])];
  return { shops: shops || [], names: uniqueNames };
}

async function checkSite(label, urlPart, siteUrl, castPaths) {
  const info = await getNullNames(urlPart);
  if (!info.names.length) { console.log(`\n【${label}】 null件なし`); return; }

  console.log(`\n${'='.repeat(55)}`);
  console.log(`【${label}】 null: ${info.names.join('・')}`);

  for (const path of castPaths) {
    const url = path.startsWith('http') ? path : siteUrl.replace(/\/$/, '') + path;
    const r = await fetchHtml(url, siteUrl);
    if (!r.ok) { process.stdout.write(`${path}:${r.status} `); continue; }

    const $ = cheerio.load(r.text);

    // パターン別画像確認
    const patterns = {
      'def/con': (r.text.match(/def\/con\?p=[^"'\s]+/g) || []).length,
      'images_staff': $('img[src*="images_staff"]').length,
      'photos': $('img[src*="/photos/"]').length,
      'data/staff': $('[style*="/data/staff/"], img[src*="/data/staff/"]').length,
      'wp-content': $('img[src*="/wp-content/"]').length,
      'data-original': $('img[data-original]').length,
    };
    const found = Object.entries(patterns).filter(([, v]) => v > 0).map(([k, v]) => `${k}:${v}`).join(' ');

    // 名前ヒット確認
    const hits = info.names.filter(n => {
      const variants = [n, n.replace(/　/g, ' '), n.replace(/　/g, ''), n.replace(/ /g, '')];
      return variants.some(v => r.text.includes(v));
    });

    console.log(`\n  ${path.slice(-30)} (${r.text.length}byte) ${found || 'no-pattern'} names:${hits.join('・') || 'なし'}`);

    // 名前周辺のHTML確認
    for (const name of hits) {
      const variants = [name, name.replace(/　/g, ' '), name.replace(/　/g, '')];
      for (const v of variants) {
        const idx = r.text.indexOf(v);
        if (idx >= 0) {
          const ctx = r.text.slice(Math.max(0, idx - 120), idx + v.length + 150).replace(/\n/g, ' ');
          console.log(`    ✅ "${name}": ...${ctx.slice(0, 220)}...`);
          break;
        }
      }
    }
    await sleep(350);
    if (hits.length > 0 && found) break;
  }
}

// 各サイトを調査
await checkSite('DAHLIA', 'gotandadahlia.com', 'https://gotandadahlia.com/',
  ['/', '/cast/', '/cast', '/therapist/']);

await checkSite('Weal 秋葉原', 'weal-group.jp', 'https://weal-group.jp/',
  ['/cast/', '/', '/therapist/', '/staff/']);

await checkSite('アロマリゾート', 'tokyo-aroma-world.jp', 'https://tokyo-aroma-world.jp/',
  ['/', '/cast/', '/therapist/']);

await checkSite('ミセスの子守唄', 'mrs-komoriuta.com', 'https://mrs-komoriuta.com/',
  ['/gals/', '/', '/cast/', '/therapist/']);

await checkSite('Fu-Ryu 風流', 'furyu.net', 'https://furyu.net/',
  ['/', '/cast/', '/therapist/']);

await checkSite('うさぎのお部屋', 'bunny-room.com', 'https://bunny-room.com/',
  ['/', '/cast/', '/therapist/']);

await checkSite("QUEEN'S COLLECTION", 'queens-collection-esthe.com', 'https://queens-collection-esthe.com/',
  ['/cast/', '/', '/therapist/', '/staff/']);

await checkSite('CREST SPA', 'crestspa-tokyo.com', 'https://crestspa-tokyo.com/',
  ['/cast/', '/', '/therapist/', '/staff/']);

await checkSite('GRACE', 'grace-meguro.com', 'http://grace-meguro.com/',
  ['/cast/', '/', '/therapist/', '/staff/']);

await checkSite('熟れた果実', 'spa-urekaji.com', 'https://spa-urekaji.com/',
  ['/cast/', '/', '/therapist/', '/staff/']);

await checkSite('Aroma BANKER', 'aroma-banker.com', 'https://aroma-banker.com/',
  ['/cast/', '/', '/therapist/', '/staff/']);

console.log('\n完了');
