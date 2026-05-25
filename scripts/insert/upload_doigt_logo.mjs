/**
 * doigt de fee ロゴ探索・アップロード
 * 実行: node scripts/insert/upload_doigt_logo.mjs
 */
import fs from 'fs';
import * as cheerio from 'cheerio';

const SITE = 'https://exe-fee.com';
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

// doigt de fee の全ショップID（ロゴを共有）
const SHOP_IDS = [
  'kanagawa_kawasaki_doigt_de_fee_5',
  'kanagawa_atsugi_doigt_de_fee',
  'tokyo_meguro_jiyugaoka_doigt_de_fee',
  'tokyo_ota_kamata_doigt_de_fee',
];

// よくあるロゴ候補パス
const LOGO_CANDIDATES = [
  `${SITE}/wp-content/themes/exe-fee/img/logo.png`,
  `${SITE}/wp-content/themes/exe-fee/img/logo.svg`,
  `${SITE}/wp-content/uploads/logo.png`,
  `${SITE}/wp-content/uploads/logo.svg`,
  `${SITE}/img/logo.png`,
  `${SITE}/images/logo.png`,
  // imgsrv.jp shop/35 は個別ページのファイルCDN
  'https://imgsrv.jp/shop/35/files/7365e309a81dd521af.png',
  'https://imgsrv.jp/shop/35/files/c3fe33070bab22839f.gif',
];

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

  // トップページから img を全件スキャン
  console.log('トップページからロゴ候補を探索...');
  let logoUrl = null;
  try {
    const topRes = await fetch(SITE, { headers: ua });
    const top$ = cheerio.load(await topRes.text());
    console.log(`HTTP: ${topRes.status}`);

    // 全img を表示
    console.log('\n=== 全img src ===');
    top$('img').each((i, el) => {
      const src = top$(el).attr('src') || '';
      if (src) console.log(`  [${i}] ${src}`);
    });

    // CSS background-image も探す
    console.log('\n=== style内background-image ===');
    const html = await (await fetch(SITE, { headers: ua })).text();
    const bgMatches = [...html.matchAll(/background(?:-image)?\s*:\s*url\(['"]?([^'")\s]+)/g)];
    bgMatches.slice(0, 10).forEach(m => console.log(`  ${m[1]}`));

    // ロゴ候補を絞り込み
    top$('img[src*="logo"], header img, .logo img, #logo img').each((_, el) => {
      const src = top$(el).attr('src') || '';
      if (src && !logoUrl) {
        logoUrl = src.startsWith('http') ? src : `${SITE}${src}`;
        console.log(`\nロゴ候補（セレクタ）: ${logoUrl}`);
      }
    });
  } catch (e) {
    console.log(`トップページ取得失敗: ${e.message}`);
  }

  // 候補URLを順番に試す
  if (!logoUrl) {
    console.log('\n候補URLを順番に試す...');
    for (const url of LOGO_CANDIDATES) {
      try {
        const r = await fetch(url, { headers: ua });
        if (r.ok) {
          console.log(`  ✅ 見つかった: ${url} (${r.status})`);
          logoUrl = url;
          break;
        } else {
          console.log(`  ❌ ${url} → ${r.status}`);
        }
      } catch (_) {
        console.log(`  ❌ ${url} → fetch失敗`);
      }
    }
  }

  if (!logoUrl) {
    console.log('\n❌ ロゴが見つかりませんでした。手動でURLを確認してください。');
    return;
  }

  // アップロード
  console.log(`\nロゴアップロード: ${logoUrl}`);
  const imgRes = await fetch(logoUrl, { headers: ua });
  if (!imgRes.ok) {
    console.log(`❌ ロゴ取得失敗: ${imgRes.status}`);
    return;
  }
  const blob = await imgRes.arrayBuffer();
  const ext = logoUrl.split('.').pop().split('?')[0].toLowerCase() || 'png';
  const contentType = ext === 'svg' ? 'image/svg+xml' : ext === 'gif' ? 'image/gif' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
  const fileName = `kanagawa_kawasaki_doigt_de_fee.${ext}`;

  const uploadRes = await fetch(
    `${supabaseUrl}/storage/v1/object/shop-logos/${fileName}`,
    {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': contentType,
        'x-upsert': 'true',
      },
      body: blob,
    }
  );
  if (!uploadRes.ok) {
    console.log(`❌ アップロード失敗: ${await uploadRes.text()}`);
    return;
  }
  const logoPublicUrl = `${supabaseUrl}/storage/v1/object/public/shop-logos/${fileName}`;
  console.log(`✅ ロゴアップロード完了: ${logoPublicUrl}`);

  // 全ショップの image_url を更新
  for (const shopId of SHOP_IDS) {
    const r = await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.${shopId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ image_url: logoPublicUrl }),
    });
    console.log(`  ${shopId}: ${r.ok ? '✅' : `❌ ${await r.text()}`}`);
  }
  console.log('\n完了 ✅');
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
