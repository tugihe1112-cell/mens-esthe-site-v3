/**
 * doigt de fee セラピスト登録
 * 実行: node scripts/insert/insert_doigt_therapists.mjs
 *
 * 構造:
 *   /lady/ ページに本日出勤中のセラピスト一覧
 *   li テキスト末尾に "川崎店" "登戸店" 等の店舗名
 *   li 内 h2.elps a のテキストがセラピスト名
 *   li テキスト内に年齢・身長・カップスペック
 */
import fs from 'fs';
import * as cheerio from 'cheerio';

const SITE = 'https://exe-fee.com';
const LADY_URL = `${SITE}/lady/`;
const SCHEDULE_URL = `${SITE}/schedule/`;
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

// li テキスト末尾の店舗名 → shop_id
// ※ shop_id は DB の実際の値を確認して修正してください
const STORE_SHOP_MAP = {
  '川崎店':      'kanagawa_kawasaki_doigt_de_fee_5',
  '登戸店':      'kanagawa_kawasaki_noborito_doigt_de_fee',
  '武蔵溝ノ口店': 'kanagawa_kawasaki_musashi_mizonokuchi_doigt_de_fee',
  '武蔵小杉店':  'kanagawa_kawasaki_musashi_kosugi_doigt_de_fee',
};

// キャンペーン・お知らせエントリを除外するパターン
const SKIP_NAME_PATTERN = /First割引|割引|店オープン|増室決定|体験入店|NEW OPEN/;

async function run() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=(.+)$`, 'm'));
    return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : null;
  };
  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  // ── 1. lady 一覧取得 ──────────────────────────────────────────
  console.log('lady一覧取得中...');
  const listRes = await fetch(LADY_URL, { headers: ua });
  const $ = cheerio.load(await listRes.text());
  console.log(`HTTP: ${listRes.status}`);

  // ── 2. li ごとに店舗・名前・スペック・画像を収集 ─────────────
  const branchMap = {}; // shopId → therapists[]
  const seen = new Set();

  $('li:has(img[src*="imgsrv.jp"][src*="/lady/"])').each((_, el) => {
    const liText = $(el).text().replace(/\s+/g, ' ').trim();

    // 店舗特定（テキスト末尾 "川崎店" 等）
    let matchedShopId = null;
    for (const [storeName, shopId] of Object.entries(STORE_SHOP_MAP)) {
      if (liText.includes(storeName)) {
        matchedShopId = shopId;
        break;
      }
    }
    if (!matchedShopId) return; // 店舗が特定できないエントリはスキップ

    // 名前（h2.elps a のテキスト）
    const rawName = $(el).find('h2.elps a[href*="/lady/"]').text().trim()
      || $(el).find('h2 a[href*="/lady/"]').text().trim();

    if (!rawName) return;

    // キャンペーン・お知らせはスキップ
    if (SKIP_NAME_PATTERN.test(rawName)) return;

    // 【タグ】を除去して名前を抽出（例: "【体験入店】淡雪うい" → "淡雪うい"）
    const name = rawName.replace(/^【[^】]*】\s*/, '').trim();
    if (!name || !/[぀-ヿ一-鿿]/.test(name)) return;

    // 画像
    const imgSrc = $(el).find('img[src*="imgsrv.jp"]').first().attr('src') || '';
    if (!imgSrc) return;

    // 重複排除（名前ベース）
    if (seen.has(name)) return;
    seen.add(name);

    // スペック（li テキストから）
    const raw_data = {};
    const ageM = liText.match(/(\d{2})歳/);
    const hM   = liText.match(/T(\d{3})cm/i);
    const bM   = liText.match(/B(\d{2,3})\(([A-J])\)/);
    if (ageM) raw_data.age    = parseInt(ageM[1]);
    if (hM)   raw_data.height = parseInt(hM[1]);
    if (bM)   { raw_data.bust = parseInt(bM[1]); raw_data.cup = bM[2]; }

    const imageUrl = imgSrc.startsWith('http') ? imgSrc : `${SITE}${imgSrc}`;
    if (!branchMap[matchedShopId]) branchMap[matchedShopId] = [];
    branchMap[matchedShopId].push({ name, image_url: imageUrl, raw_data });
  });

  console.log('\n=== 店舗別セラピスト数 ===');
  for (const [shopId, list] of Object.entries(branchMap)) {
    console.log(`  ${shopId}: ${list.length}名`);
    list.forEach(t => console.log(`    ${t.name} age=${t.raw_data.age} h=${t.raw_data.height} cup=${t.raw_data.cup}`));
  }

  if (Object.keys(branchMap).length === 0) {
    console.log('\n⚠️ セラピストが見つかりませんでした。');
    process.exit(1);
  }

  // ── 3. ロゴ取得・アップロード ─────────────────────────────────
  console.log('\nロゴ検索中...');
  let logoPublicUrl = null;
  const logoRes = await fetch(SITE, { headers: ua });
  if (logoRes.ok) {
    const top$ = cheerio.load(await logoRes.text());
    let logoSrc = top$('img[src*="logo"], header img').first().attr('src') || '';
    if (logoSrc) {
      const logoUrl = logoSrc.startsWith('http') ? logoSrc : `${SITE}${logoSrc}`;
      console.log(`  ロゴ候補: ${logoUrl}`);
      try {
        const imgRes = await fetch(logoUrl, { headers: ua });
        if (imgRes.ok) {
          const blob = await imgRes.arrayBuffer();
          const ext = logoUrl.split('.').pop().split('?')[0] || 'png';
          const fileName = `kanagawa_kawasaki_doigt_de_fee.${ext}`;
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
              body: blob,
            }
          );
          if (uploadRes.ok) {
            logoPublicUrl = `${supabaseUrl}/storage/v1/object/public/shop-logos/${fileName}`;
            console.log(`  ロゴ ✅`);
          } else {
            console.log(`  ロゴアップロード失敗: ${await uploadRes.text()}`);
          }
        }
      } catch (e) {
        console.log(`  ロゴ取得失敗: ${e.message}`);
      }
    }
  }
  if (!logoPublicUrl) console.log('  ロゴ: 見つかりませんでした（後で手動設定）');

  // ── 4. 各 shop_id に登録 ──────────────────────────────────────
  for (const [shopId, therapists] of Object.entries(branchMap)) {
    console.log(`\n--- ${shopId} 登録中 ---`);

    // 店舗更新
    const shopUpdate = { schedule_url: SCHEDULE_URL };
    if (logoPublicUrl) shopUpdate.image_url = logoPublicUrl;
    const shopRes = await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.${shopId}`, {
      method: 'PATCH', headers, body: JSON.stringify(shopUpdate),
    });
    console.log(`  店舗更新: ${shopRes.ok ? '✅' : `❌ ${await shopRes.text()}`}`);

    // 既存削除
    const delRes = await fetch(`${supabaseUrl}/rest/v1/therapists?shop_id=eq.${shopId}`, {
      method: 'DELETE', headers,
    });
    console.log(`  既存削除: ${delRes.ok ? '✅' : '❌'}`);

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
    console.log(`  挿入: ${insRes.ok ? `✅ ${rows.length}名` : `❌ ${await insRes.text()}`}`);
  }

  console.log('\n完了 ✅');
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
