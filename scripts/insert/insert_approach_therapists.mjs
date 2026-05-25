/**
 * アプローチ川崎 セラピスト登録
 * 実行: node scripts/insert/insert_approach_therapists.mjs
 */
import fs from 'fs';
import * as cheerio from 'cheerio';

const SHOP_ID = 'kanagawa_kawasaki_approach';
const SITE = 'https://kawasakia.beautycloud.co.jp';
const THERAPIST_URL = `${SITE}/therapist.html`;
const LOGO_URL = `${SITE}/kawasakia/logo.png`;
const SCHEDULE_URL = `${SITE}/schedule.html`;
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
  const seenHref = new Set();

  // 構造: li > .list_photo > a[href*="/therapist/ID"] > img
  //        li > .list_name "笹塚 すずか (B)(30)"
  $('li').each((i, el) => {
    const photoEl = $(el).find('.list_photo');
    if (!photoEl.length) return;

    const aEl = photoEl.find('a[href*="/therapist/ID"]');
    if (!aEl.length) return;

    const href = aEl.attr('href') || '';
    if (seenHref.has(href)) return;
    seenHref.add(href);

    const img = aEl.find('img').attr('src') || '';
    if (!img) return;

    const nameRaw = $(el).find('.list_name').text().trim();
    if (!nameRaw) return;

    // "笹塚 すずか (B)(30)" → name="笹塚 すずか", cup="B", age=30
    const m = nameRaw.match(/^(.+?)\s*(?:\(([A-Za-z])\))?\s*\((\d+)\)$/);
    const name = m ? m[1].trim() : nameRaw.replace(/[\(（][^）)]+[\)）]/g, '').trim();
    const cup = m ? (m[2] || null) : null;
    const age = m ? parseInt(m[3]) : null;

    const raw_data = {};
    if (age) raw_data.age = age;
    if (cup) raw_data.cup = cup;

    const imageUrl = img.startsWith('http') ? img : `${SITE}${img}`;
    therapists.push({ name, image_url: imageUrl, raw_data });
  });

  console.log(`\nセラピスト数: ${therapists.length}名`);
  therapists.slice(0, 5).forEach(t =>
    console.log(`  ${t.name} age=${t.raw_data.age} cup=${t.raw_data.cup}`)
  );

  if (therapists.length === 0) {
    console.log('❌ セラピストが見つかりませんでした');
    process.exit(1);
  }

  // ロゴアップロード
  console.log('\nロゴアップロード中...');
  const logoRes = await fetch(LOGO_URL, { headers: ua });
  const logoBlob = await logoRes.arrayBuffer();
  const logoExt = 'png';
  const logoFileName = `${SHOP_ID}.${logoExt}`;
  const uploadRes = await fetch(
    `${supabaseUrl}/storage/v1/object/shop-logos/${logoFileName}`,
    {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'image/png',
        'x-upsert': 'true',
      },
      body: logoBlob,
    }
  );
  const logoPublicUrl = `${supabaseUrl}/storage/v1/object/public/shop-logos/${logoFileName}`;
  console.log(`ロゴ: ${uploadRes.ok ? `✅ ${logoPublicUrl}` : `❌ ${await uploadRes.text()}`}`);

  // 店舗更新
  const shopUpdate = { schedule_url: SCHEDULE_URL };
  if (uploadRes.ok) shopUpdate.image_url = logoPublicUrl;
  const shopRes = await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.${SHOP_ID}`, {
    method: 'PATCH', headers, body: JSON.stringify(shopUpdate),
  });
  console.log(`店舗更新: ${shopRes.ok ? '✅' : `❌ ${await shopRes.text()}`}`);

  // 既存セラピスト削除
  const delRes = await fetch(`${supabaseUrl}/rest/v1/therapists?shop_id=eq.${SHOP_ID}`, {
    method: 'DELETE', headers,
  });
  console.log(`既存削除: ${delRes.ok ? '✅' : '❌'}`);

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
