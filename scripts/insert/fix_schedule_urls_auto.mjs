/**
 * 処理済み店舗のスケジュールURL自動設定
 * website_urlからスケジュールページを検出してschedule_urlに保存
 * 実行: node scripts/insert/fix_schedule_urls_auto.mjs [--area=osaka] [--dry-run]
 */
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const AREA_FILTER = args.find(a => a.startsWith('--area='))?.split('=')[1] || null;

const ua = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ja,en-US;q=0.7',
};

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
const supabase = createClient(supabaseUrl, supabaseKey);
const h = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` };

async function fetchHtml(url, timeout = 12000) {
  const res = await fetch(url, { headers: ua, signal: AbortSignal.timeout(timeout) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

function findScheduleUrl(html, siteUrl) {
  const $ = cheerio.load(html);
  const candidates = [];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim();
    if (/schedule|timetable|シフト|出勤|スケジュール|勤務|カレンダー/i.test(href + text)) {
      try {
        const abs = href.startsWith('http') ? href : new URL(href, siteUrl).href;
        if (abs.startsWith(new URL(siteUrl).origin)) candidates.push(abs);
      } catch {}
    }
  });

  return [...new Set(candidates)][0] || null;
}

// 対象店舗取得（website_urlがある全店舗）
let query = `${supabaseUrl}/rest/v1/shops?website_url=not.is.null&select=id,name,website_url,schedule_url&order=id`;
if (AREA_FILTER) query += `&id=like.${AREA_FILTER}_*`;

const r = await fetch(query, { headers: h });
const allShops = await r.json();

// schedule_urlが未設定の店舗のみ対象（コード側でフィルタ）
const shops = allShops.filter(s => !s.schedule_url);
console.log(`schedule_url未設定: ${shops.length}/${allShops.length}件`);

// セラピストが登録済みの店舗のみ対象（ページネーション対応）
const therapists = [];
let offset = 0;
while (true) {
  const trRes = await fetch(
    `${supabaseUrl}/rest/v1/therapists?select=shop_id&limit=1000&offset=${offset}`,
    { headers: h }
  );
  const page = await trRes.json();
  if (!Array.isArray(page) || page.length === 0) break;
  therapists.push(...page);
  if (page.length < 1000) break;
  offset += 1000;
}
const hasData = new Set(therapists.map(t => t.shop_id));
console.log(`セラピスト登録済み店舗: ${hasData.size}件`);

// URLでグループ化（同じURLは1回だけfetch）
const urlGroups = new Map();
for (const shop of shops) {
  if (!hasData.has(shop.id)) continue; // セラピスト未登録はスキップ
  const url = shop.website_url.replace(/\/$/, '').toLowerCase();
  if (!urlGroups.has(url)) urlGroups.set(url, []);
  urlGroups.get(url).push(shop);
}

console.log(`対象店舗: ${[...urlGroups.values()].flat().length}件 (ユニークURL: ${urlGroups.size}件)`);
if (DRY_RUN) console.log('[DRY RUN MODE]');

let updated = 0, skipped = 0, failed = 0;

for (const [url, shopList] of urlGroups) {
  const siteUrl = shopList[0].website_url;
  try {
    const html = await fetchHtml(siteUrl);
    const scheduleUrl = findScheduleUrl(html, siteUrl);

    if (!scheduleUrl) {
      skipped++;
      continue;
    }

    console.log(`✅ ${siteUrl}`);
    console.log(`   → ${scheduleUrl}`);

    if (!DRY_RUN) {
      for (const shop of shopList) {
        const { error } = await supabase.from('shops')
          .update({ schedule_url: scheduleUrl })
          .eq('id', shop.id);
        if (!error) {
          updated++;
          console.log(`   [${shop.id}] 設定完了`);
        } else {
          console.log(`   [${shop.id}] エラー: ${error.message}`);
        }
      }
    } else {
      for (const shop of shopList) {
        console.log(`   [DRY RUN] ${shop.id}`);
        updated++;
      }
    }
  } catch (e) {
    console.log(`❌ ${siteUrl}: ${e.message}`);
    failed++;
  }

  await new Promise(r => setTimeout(r, 400));
}

console.log('\n' + '='.repeat(50));
console.log(`完了: ${updated}件設定, ${skipped}件スケジュールURL未検出, ${failed}件エラー`);
