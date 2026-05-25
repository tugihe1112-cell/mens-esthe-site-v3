/**
 * LIVSPA セラピスト登録 (caskan CMS)
 * 実行: node scripts/insert/insert_livspa_therapists.mjs
 */
import fs from 'fs';
import * as cheerio from 'cheerio';

// 川崎の2エントリに同じデータを入れる
const SHOP_IDS = [
  'kanagawa_kawasaki_livspa',
  'kanagawa_kawasaki_kawasaki_livspa',
];
const SITE = 'https://livspa.net';
const THERAPIST_URL = `${SITE}/therapist`;
const SCHEDULE_URL = `${SITE}/schedule`;
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

  // caskan CMS: /therapist/IDでグループ化してimg+スペックをペアリング
  const castMap = {};
  $('a[href*="/therapist/"]').each((i, el) => {
    const href = $(el).attr('href') || '';
    const idM = href.match(/\/therapist\/(\d+)/);
    if (!idM) return;
    const id = idM[1];
    if (!castMap[id]) castMap[id] = { img: '', name: '', text: '' };

    const imgEl = $(el).find('img[alt]');
    if (imgEl.length) {
      const src = imgEl.attr('src') || '';
      if (src.includes('caskan') || src.includes('cast_tmb')) {
        if (!castMap[id].img) castMap[id].img = src;
        const alt = imgEl.attr('alt') || '';
        if (alt && !castMap[id].name) {
          castMap[id].name = alt.replace(/^[《【].*?[》】]\s*/, '').trim();
        }
      }
    }
    // スペックテキストを蓄積
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text) castMap[id].text += ' ' + text;
  });

  for (const [id, data] of Object.entries(castMap)) {
    if (!data.img || !data.name || seen.has(data.name)) continue;
    seen.add(data.name);

    const blockText = data.text;
    const ageM = blockText.match(/(\d{2,3})歳/);
    const hM = blockText.match(/(\d{3})㎝/);
    const cM = blockText.match(/[\(（]\s*([A-Z])\s*[\)）]/);

    const raw_data = {};
    if (ageM) raw_data.age = parseInt(ageM[1]);
    if (hM) raw_data.height = parseInt(hM[1]);
    if (cM) raw_data.cup = cM[1];

    const imageUrl = data.img.startsWith('http') ? data.img : `${SITE}${data.img}`;
    therapists.push({ name: data.name, image_url: imageUrl, raw_data });
  }

  console.log(`\nセラピスト数: ${therapists.length}名`);
  therapists.slice(0, 5).forEach(t =>
    console.log(`  ${t.name} age=${t.raw_data.age} h=${t.raw_data.height} cup=${t.raw_data.cup}`)
  );

  if (therapists.length === 0) {
    console.log('❌ セラピストが見つかりませんでした');
    process.exit(1);
  }

  // ロゴ取得 (トップページのヘッダー)
  console.log('\nロゴ検索中...');
  let logoPublicUrl = null;
  try {
    const topRes = await fetch(SITE, { headers: ua });
    const top$ = cheerio.load(await topRes.text());
    let logoSrc = top$('img[src*="logo"]').first().attr('src') || '';
    if (!logoSrc) logoSrc = top$('header img').first().attr('src') || '';
    if (logoSrc) {
      const logoUrl = logoSrc.startsWith('http') ? logoSrc : `${SITE}${logoSrc}`;
      console.log(`  ロゴ候補: ${logoUrl}`);
      const logoRes = await fetch(logoUrl, { headers: ua });
      const logoBlob = await logoRes.arrayBuffer();
      const ext = logoUrl.split('.').pop().split('?')[0] || 'png';
      const fileName = `kanagawa_kawasaki_livspa.${ext}`;
      const uploadRes = await fetch(
        `${supabaseUrl}/storage/v1/object/shop-logos/${fileName}`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': `image/${ext === 'jpg' ? 'jpeg' : ext}`,
            'x-upsert': 'true',
          },
          body: logoBlob,
        }
      );
      if (uploadRes.ok) {
        logoPublicUrl = `${supabaseUrl}/storage/v1/object/public/shop-logos/${fileName}`;
        console.log(`  ロゴアップロード ✅`);
      } else {
        console.log(`  ロゴアップロード ❌: ${await uploadRes.text()}`);
      }
    }
  } catch (e) {
    console.log(`  ロゴ取得失敗: ${e.message}`);
  }

  // 各SHOP_IDに登録
  for (const shopId of SHOP_IDS) {
    console.log(`\n--- ${shopId} ---`);

    // 店舗更新
    const shopUpdate = { schedule_url: SCHEDULE_URL };
    if (logoPublicUrl) shopUpdate.image_url = logoPublicUrl;
    const shopRes = await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.${shopId}`, {
      method: 'PATCH', headers, body: JSON.stringify(shopUpdate),
    });
    console.log(`店舗更新: ${shopRes.ok ? '✅' : `❌ ${await shopRes.text()}`}`);

    // 既存削除
    const delRes = await fetch(`${supabaseUrl}/rest/v1/therapists?shop_id=eq.${shopId}`, {
      method: 'DELETE', headers,
    });
    console.log(`既存削除: ${delRes.ok ? '✅' : '❌'}`);

    // 挿入
    const rows = therapists.map((t, i) => ({
      id: `${shopId}_${t.name.replace(/[\s　]+/g, '')}_${i}`,
      shop_id: shopId,
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
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
