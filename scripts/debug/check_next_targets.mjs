/**
 * 次の修正対象サイト構造確認
 * LIRICA・LEON SPA・THE PREMIUM SPA・女教師の秘め事
 * 実行: node scripts/debug/check_next_targets.mjs
 */
import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function fetchHtml(url, referer) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Referer: referer || url },
      signal: AbortSignal.timeout(12000),
      redirect: 'follow',
    });
    return { ok: res.status === 200, status: res.status, text: res.status === 200 ? await res.text() : '', url: res.url };
  } catch (e) {
    return { ok: false, status: 0, text: '', url };
  }
}

async function checkSite(label, urlPart, pagePaths) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`【${label}】`);
  console.log('='.repeat(60));

  const { data: shops } = await supabase.from('shops').select('id, name, website_url').ilike('website_url', `%${urlPart}%`);
  if (!shops?.length) { console.log('店舗なし'); return; }
  const shopIds = shops.map(s => s.id);
  const { data: nullT } = await supabase.from('therapists').select('id, name').in('shop_id', shopIds).is('image_url', null);
  console.log(`店舗: ${shops.map(s => s.name).join(', ')}`);
  console.log(`DB写真なし: ${nullT?.length ?? 0}名`);
  if (nullT?.length) console.log(`名前(先頭10): ${nullT.slice(0,10).map(t => t.name).join('、')}`);
  const base = shops[0].website_url?.replace(/\/$/, '') || '';

  for (const path of pagePaths) {
    const url = path.startsWith('http') ? path : base + path;
    const r = await fetchHtml(url, base + '/');
    if (!r.ok) { console.log(`  ${path} → ${r.status}`); continue; }

    const $ = cheerio.load(r.text);
    const imgCount = $('img').length;
    const dataSrcCount = $('img[data-original]').length + $('img[data-src]').length;
    const wpCount = $('img[src*="/wp-content/"]').length || (r.text.match(/\/wp-content\//g) || []).length;
    const defConCount = (r.text.match(/def\/con/g) || []).length;
    const castCount = (r.text.match(/\/cast\//g) || []).length;

    console.log(`\n✅ ${path} img:${imgCount} data-lazy:${dataSrcCount} wp:${wpCount} def/con:${defConCount} /cast/:${castCount}`);

    // 名前ヒット確認
    const names = nullT?.map(t => t.name) || [];
    const found = names.filter(n => r.text.includes(n));
    console.log(`DB null名がページ内: ${found.length}/${names.length}名`);
    if (found.length > 0) console.log(` →`, found.slice(0,8).join('、'));

    // パターン別img確認
    if (wpCount > 0) {
      console.log('  wp-content imgs:');
      $('img[src*="/wp-content/"]').slice(0,3).each((_, el) => {
        console.log(`    alt="${$(el).attr('alt')}" src="...${$(el).attr('src')?.slice(-50)}"`);
      });
    }
    if (defConCount > 0) {
      console.log('  def/con imgs:');
      const m = r.text.match(/def\/con\?p=[^"'\s]+/g)?.slice(0,3) || [];
      m.forEach(u => console.log(`    ${u.slice(0,80)}`));
    }
    if (dataSrcCount > 0) {
      $('img[data-original*="/"]').slice(0,3).each((_, el) => {
        console.log(`  data-original: alt="${$(el).attr('alt')}" ...${$(el).attr('data-original')?.slice(-50)}`);
      });
    }
  }
}

// LIRICA OSAKA
await checkSite('LIRICA OSAKA', 'lirica-osaka', ['/cast/', '/', '/staff/', '/therapist/']);

// LEON SPA Gold / LEON SPA
await checkSite('LEON SPA Gold', 'leonspa-gold', ['/cast/', '/', '/therapist/', '/staff/']);
await checkSite('LEON SPA', 'leonspa.net', ['/cast/', '/', '/therapist/', '/staff/']);

// 女教師の秘め事
await checkSite('女教師の秘め事', 'teachersecret', ['/cast/', '/', '/therapist/', '/staff/']);

// THE PREMIUM SPA (残り27名の確認)
await checkSite('THE PREMIUM SPA', 'the-premiumspa', ['/cast/', '/', '/therapist/']);

console.log('\n完了');
