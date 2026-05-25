/**
 * RiRe川崎 セラピスト登録 (tete-yokohama CMS)
 * 実行: node scripts/insert/insert_rire_kawasaki_therapists.mjs
 */
import fs from 'fs';
import * as cheerio from 'cheerio';

const SHOP_ID = 'kanagawa_kawasaki_rire';
const SITE = 'https://rire-kawasaki.com';
const THERAPIST_URL = `${SITE}/therapist/`;
const LOGO_URL = `${SITE}/wp-content/themes/rire-kawasaki.com/img/rire_logo.png`;
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

  // tete-yokohama CMS: a[href*="casts/detail?cid="] でimg/名前をcidでグループ化
  const castMap = {};
  $('a[href*="casts/detail"]').each((i, el) => {
    const href = $(el).attr('href') || '';
    const cidM = href.match(/cid=(\d+)/);
    if (!cidM) return;
    const cid = cidM[1];
    if (!castMap[cid]) castMap[cid] = { img: '', name: '', age: null };

    const imgEl = $(el).find('img');
    if (imgEl.length) {
      const src = imgEl.attr('src') || '';
      if (src && !castMap[cid].img) castMap[cid].img = src;
    }

    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text && !castMap[cid].name) {
      // "瀬戸 ( 25 )" → name="瀬戸", age=25
      const m = text.match(/^(.+?)\s*[\(（]\s*(\d+)\s*[\)）]/);
      if (m) {
        castMap[cid].name = m[1].trim();
        castMap[cid].age = parseInt(m[2]);
      } else if (text.length < 20 && !/^\d/.test(text)) {
        castMap[cid].name = text;
      }
    }
  });

  // 日本語名（ひらがな/カタカナ/漢字）を含む名前のみ有効
  const isValidName = (n) => /[぀-ヿ一-鿿]/.test(n);

  const therapists = [];
  for (const [cid, data] of Object.entries(castMap)) {
    if (!data.img || !data.name) continue;
    if (!isValidName(data.name)) continue;
    const imageUrl = data.img.startsWith('http') ? data.img : `${SITE}${data.img}`;
    const raw_data = {};
    if (data.age) raw_data.age = data.age;
    therapists.push({ name: data.name, image_url: imageUrl, raw_data });
  }

  console.log(`\nセラピスト数: ${therapists.length}名`);
  therapists.slice(0, 5).forEach(t =>
    console.log(`  ${t.name} age=${t.raw_data.age} ${t.image_url.slice(0, 60)}`)
  );

  if (therapists.length === 0) {
    console.log('❌ セラピストが見つかりませんでした');
    process.exit(1);
  }

  // ロゴアップロード
  console.log('\nロゴアップロード中...');
  const logoRes = await fetch(LOGO_URL, { headers: ua });
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
  const logoPublicUrl = `${supabaseUrl}/storage/v1/object/public/shop-logos/${SHOP_ID}.png`;
  console.log(`ロゴ: ${uploadRes.ok ? `✅ ${logoPublicUrl}` : `❌ ${await uploadRes.text()}`}`);

  // 店舗更新
  const shopUpdate = {};
  if (uploadRes.ok) shopUpdate.image_url = logoPublicUrl;
  if (Object.keys(shopUpdate).length) {
    const shopRes = await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.${SHOP_ID}`, {
      method: 'PATCH', headers, body: JSON.stringify(shopUpdate),
    });
    console.log(`店舗更新: ${shopRes.ok ? '✅' : `❌ ${await shopRes.text()}`}`);
  }

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
