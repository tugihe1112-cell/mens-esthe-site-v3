/**
 * Ho・O・Zu・Ki・SPA セラピスト登録
 * 実行: node scripts/insert/insert_hoozuki_therapists.mjs
 */
import fs from 'fs';
import * as cheerio from 'cheerio';

const SHOP_ID = 'kanagawa_kawasaki_hoozuki';
const SITE = 'https://hoozuki-spa.net';
const THERAPIST_URL = `${SITE}/therapist.php`;
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

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

  $('img[src*="images_staff"][alt]').each((i, el) => {
    const src = $(el).attr('src') || '';
    const altName = ($(el).attr('alt') || '').trim();
    if (!altName || !src || seen.has(src)) return;
    seen.add(src);

    // 親要素からスペック取得
    const parent = $(el).closest('li, td, .cast_item, .cast_box, .cast_inner');
    const rawText = parent.text().replace(/\s+/g, ' ').trim();

    // 年齢: 名前の直後 (37) パターン
    const ageM = rawText.match(new RegExp(`${altName}[^\\d]*(\\d{2,3})\\)`));
    const age = ageM ? parseInt(ageM[1]) : null;

    // スペック
    const hM = rawText.match(/T[\.．](\d{3})/);
    const bM = rawText.match(/B[\.．](\d{2,3})[\(（]([A-Z])[\)）]/);
    const wM = rawText.match(/W[\.．](\d{2,3})/);
    const hipM = rawText.match(/H[\.．](\d{2,3})/);

    const raw_data = {};
    if (age) raw_data.age = age;
    if (hM) raw_data.height = parseInt(hM[1]);
    if (bM) { raw_data.bust = parseInt(bM[1]); raw_data.cup = bM[2]; }
    if (wM) raw_data.waist = parseInt(wM[1]);
    if (hipM) raw_data.hip = parseInt(hipM[1]);

    const imageUrl = src.startsWith('http') ? src : `${SITE}${src}`;
    therapists.push({ name: altName, image_url: imageUrl, raw_data });
  });

  console.log(`\nセラピスト数: ${therapists.length}名`);
  therapists.slice(0, 5).forEach(t =>
    console.log(`  ${t.name} ${t.raw_data.age ? `(${t.raw_data.age})` : ''} ${t.image_url.slice(0, 60)}`)
  );

  if (therapists.length === 0) {
    console.log('❌ セラピストが見つかりませんでした');
    process.exit(1);
  }

  // 既存セラピスト削除
  const delRes = await fetch(`${supabaseUrl}/rest/v1/therapists?shop_id=eq.${SHOP_ID}`, {
    method: 'DELETE', headers,
  });
  console.log(`\n既存削除: ${delRes.ok ? '✅' : '❌'} (${delRes.status})`);

  // 新規挿入
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
