/**
 * RERE GROUP 川崎店 セラピスト登録
 * 実行: node scripts/insert/insert_rere_therapists.mjs
 */
import fs from 'fs';
import * as cheerio from 'cheerio';

const SHOP_ID = 'kanagawa_kawasaki_rere';
const SITE = 'https://www.rere-group.com';
const THERAPIST_URL = `${SITE}/therapist/?shop=kawasaki`;
const SCHEDULE_URL = `${SITE}/kawasaki/`;
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

// 名前ではない alt テキストを除外
const NON_NAME_PATTERNS = /新規入店|出勤予定|お休み|体験入店|セラピスト|スタッフ|STAFF|CAST/;

async function run() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'));
    return match ? match[1].trim() : null;
  };
  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  // セラピスト一覧取得
  const res = await fetch(THERAPIST_URL, { headers: ua });
  const $ = cheerio.load(await res.text());
  console.log(`HTTP: ${res.status}`);

  const therapists = [];
  const seen = new Set();

  $('img[src*="system.jpn.com"][alt]').each((i, el) => {
    const src = $(el).attr('src') || '';
    const altName = ($(el).attr('alt') || '').trim();

    if (!altName || !src) return;
    if (NON_NAME_PATTERNS.test(altName)) return;
    if (seen.has(src)) return;
    seen.add(src);

    // 親要素からスペック
    const parent = $(el).closest('[class*="therapist"], li, div');
    const text = parent.text().replace(/\s+/g, ' ').trim();

    const ageM = text.match(/(\d{2})歳/) || altName.match(/[（(](\d{2})[）)]/);
    const age = ageM ? parseInt(ageM[1]) : null;

    const raw_data = {};
    if (age) raw_data.age = age;

    therapists.push({ name: altName, image_url: src, raw_data });
  });

  console.log(`\nセラピスト数: ${therapists.length}名`);
  therapists.forEach(t => console.log(`  ${t.name} ${t.image_url.slice(0, 60)}`));

  if (therapists.length === 0) {
    console.log('❌ セラピストが見つかりませんでした');
    process.exit(1);
  }

  // 店舗更新（schedule_urlのみ、ロゴは既にあり）
  const shopRes = await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.${SHOP_ID}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ schedule_url: SCHEDULE_URL }),
  });
  console.log(`\n店舗更新: ${shopRes.ok ? '✅' : `❌ ${await shopRes.text()}`}`);

  // 既存削除
  const delRes = await fetch(`${supabaseUrl}/rest/v1/therapists?shop_id=eq.${SHOP_ID}`, {
    method: 'DELETE', headers,
  });
  console.log(`既存削除: ${delRes.ok ? '✅' : '❌'}`);

  // 挿入
  const rows = therapists.map((t, i) => ({
      id: `${SHOP_ID}_${t.name.replace(/[\s　]+/g, '')}_${i}`,
    shop_id: SHOP_ID,
    name: t.name,
    image_url: t.image_url,
    raw_data: t.raw_data,
  }));
  const insRes = await fetch(`${supabaseUrl}/rest/v1/therapists`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=minimal' },
    body: JSON.stringify(rows),
  });
  console.log(`挿入: ${insRes.ok ? `✅ ${rows.length}名` : `❌ ${await insRes.text()}`}`);
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
