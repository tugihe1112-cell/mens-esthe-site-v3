/**
 * Fromage (フロマージュ) セラピスト登録
 * 実行: node scripts/insert/insert_fromage_therapists.mjs
 */
import fs from 'fs';
import * as cheerio from 'cheerio';

const SHOP_ID = 'kanagawa_kawasaki_fromage';
const SITE = 'http://fromage-kawasaki.com';
const THERAPIST_URL = `${SITE}/therapist`;
const SCHEDULE_URL = `${SITE}/schedule`;
const LOGO_PATH = '/assets/customer/logo-273832270da3bc64e39edb7539ac02dd7eead70d0967fd4f974161f8b631d657.png';
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

  // リストページから名前・年齢・スペックを収集
  const therapistList = [];
  const seenHref = new Set();

  $('a[href]').each((i, el) => {
    const href = $(el).attr('href') || '';
    if (!/^\/therapist\/\d+$/.test(href)) return;
    if (seenHref.has(href)) return;
    seenHref.add(href);

    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (!text) return;

    // "えむ (25歳) T.153 Ｃ" パターン
    const nameM = text.match(/^(.+?)\s*[\(（](\d+)歳[\)）]/);
    if (!nameM) return;

    const name = nameM[1].trim();
    const age = parseInt(nameM[2]);

    const hM = text.match(/T[．.](\d{3})/);
    const cM = text.match(/([A-Za-z])\s*$/) || text.match(/([A-Z])(?:\d+)?(?:\(|（|$)/);
    const bM = text.match(/B(\d{2,3})\(([A-Z])\)/);

    const raw_data = { age };
    if (hM) raw_data.height = parseInt(hM[1]);
    if (bM) { raw_data.bust = parseInt(bM[1]); raw_data.cup = bM[2]; }
    else if (cM && /^[A-J]$/.test(cM[1])) raw_data.cup = cM[1];

    therapistList.push({ href, name, raw_data });
  });

  console.log(`\nリスト取得: ${therapistList.length}名`);

  // 個別ページを訪問して画像URL取得
  const therapists = [];
  for (const t of therapistList) {
    await new Promise(r => setTimeout(r, 300));
    try {
      const pageUrl = `${SITE}${t.href}`;
      const pageRes = await fetch(pageUrl, { headers: ua });
      const page$ = cheerio.load(await pageRes.text());

      // S3画像を取得
      let imgSrc = page$('img[src*="amazonaws"]').first().attr('src') || '';
      if (!imgSrc) {
        imgSrc = page$('img[src*="fromage"]').first().attr('src') || '';
      }

      if (imgSrc) {
        const imageUrl = imgSrc.startsWith('http') ? imgSrc : `${SITE}${imgSrc}`;
        therapists.push({ ...t, image_url: imageUrl });
        process.stdout.write(`  ✅ ${t.name}\r`);
      } else {
        console.log(`  ⚠️ ${t.name}: 画像なし`);
        // 画像なしでも登録
        therapists.push({ ...t, image_url: '' });
      }
    } catch (e) {
      console.log(`  ❌ ${t.name}: ${e.message}`);
    }
  }

  console.log(`\n\nセラピスト数: ${therapists.length}名`);
  therapists.slice(0, 5).forEach(t =>
    console.log(`  ${t.name} age=${t.raw_data.age} ${(t.image_url || '').slice(0, 60)}`)
  );

  if (therapists.length === 0) {
    console.log('❌ セラピストが見つかりませんでした');
    process.exit(1);
  }

  // ロゴアップロード
  console.log('\nロゴアップロード中...');
  const logoUrl = `${SITE}${LOGO_PATH}`;
  const logoRes = await fetch(logoUrl, { headers: ua });
  let logoPublicUrl = null;
  if (logoRes.ok) {
    const logoBlob = await logoRes.arrayBuffer();
    const uploadRes = await fetch(
      `${supabaseUrl}/storage/v1/object/shop-logos/${SHOP_ID}.png`,
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
    if (uploadRes.ok) {
      logoPublicUrl = `${supabaseUrl}/storage/v1/object/public/shop-logos/${SHOP_ID}.png`;
      console.log(`ロゴ: ✅ ${logoPublicUrl}`);
    } else {
      console.log(`ロゴ: ❌ ${await uploadRes.text()}`);
    }
  } else {
    console.log(`ロゴ取得失敗: HTTP ${logoRes.status}`);
  }

  // 店舗更新
  const shopUpdate = { schedule_url: SCHEDULE_URL };
  if (logoPublicUrl) shopUpdate.image_url = logoPublicUrl;
  const shopRes = await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.${SHOP_ID}`, {
    method: 'PATCH', headers, body: JSON.stringify(shopUpdate),
  });
  console.log(`店舗更新: ${shopRes.ok ? '✅' : `❌ ${await shopRes.text()}`}`);

  // 既存削除
  const delRes = await fetch(`${supabaseUrl}/rest/v1/therapists?shop_id=eq.${SHOP_ID}`, {
    method: 'DELETE', headers,
  });
  console.log(`既存削除: ${delRes.ok ? '✅' : '❌'}`);

  // 挿入
  const rows = therapists
    .filter(t => t.image_url)
    .map((t, i) => ({
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
