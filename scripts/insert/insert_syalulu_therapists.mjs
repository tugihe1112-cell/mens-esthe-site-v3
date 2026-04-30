/**
 * シャルル (旧ディープ府中) セラピスト・ロゴ・スケリンク・料金 一括登録
 * 実行: node insert_syalulu_therapists.mjs
 */
import fs from 'fs';
import * as cheerio from 'cheerio';

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

  const SHOP_ID = 'tokyo_fuchu_syalulu';
  const SITE_URL = 'https://www.syalulu.tokyo';
  const STAFF_PAGE = 'https://www.syalulu.tokyo/staff/';
  const SCHEDULE_URL = 'https://www.syalulu.tokyo/schedule/';
  const WEBSITE_URL = 'https://www.syalulu.tokyo';
  const STORAGE_BUCKET = 'shop-logos';
  const LOGO_FILE_NAME = 'Syalulu.png';

  const price_system = `60分: 12,000円
80分: 15,000円
100分: 19,000円`;

  const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

  console.log('🚀 シャルル セットアップ開始\n');

  // Step 1: スタッフページ取得
  console.log('📄 Step 1: スタッフページを取得中...');
  const res = await fetch(STAFF_PAGE, { headers: ua });
  const html = await res.text();
  console.log(`   ✅ HTML取得完了 (${html.length} chars)`);

  // Step 2: パース
  console.log('\n👩 Step 2: セラピストデータをパース中...');
  const $ = cheerio.load(html);
  const casts = [];
  const seen = new Set();

  $('.list-staff .item').each((i, el) => {
    const imgEl = $(el).find('img').first();
    const style = imgEl.attr('style') || '';

    // background-image: url(/images/ml_11_1_XXXXX.jpg?N)
    const urlMatch = style.match(/background-image:\s*url\(['"]?([^'")\s]+)['"]?\)/);
    if (!urlMatch) return;

    const rawPath = urlMatch[1].split('?')[0]; // クエリ除去
    const imageUrl = SITE_URL + rawPath;

    if (seen.has(imageUrl)) return;
    seen.add(imageUrl);

    // 名前
    const name = $(el).find('.cinfo a').first().text().trim();
    if (!name) return;

    // スペック（年齢・T・B・W・H）
    const profileText = $(el).find('.p_profile').text().replace(/\s+/g, ' ').trim();

    const ageMatch    = profileText.match(/(\d+)歳/);
    const heightMatch = profileText.match(/T[.\s]*(\d{2,3})/i);
    const bustMatch   = profileText.match(/B[.\s]*(\d{2,3})(?:\s*[\(（]([A-Z]+)[\)）])?/i);
    const waistMatch  = profileText.match(/W[.\s]*(\d{2,3})/i);
    const hipMatch    = profileText.match(/H[.\s]*(\d{2,3})/i);

    const raw_data = {};
    if (ageMatch)    raw_data.age    = ageMatch[1] + '歳';
    if (heightMatch) raw_data.height = 'T' + heightMatch[1];
    if (bustMatch)   raw_data.bust   = 'B' + bustMatch[1] + (bustMatch[2] ? '(' + bustMatch[2] + ')' : '');
    if (waistMatch)  raw_data.waist  = 'W' + waistMatch[1];
    if (hipMatch)    raw_data.hip    = 'H' + hipMatch[1];

    casts.push({ name, image_url: imageUrl, raw_data });
  });

  console.log(`   ✅ ${casts.length}名のセラピストを取得`);
  casts.slice(0, 5).forEach(c =>
    console.log(`      ${c.name} / ${JSON.stringify(c.raw_data)} : ${c.image_url}`)
  );

  if (casts.length === 0) {
    console.error('❌ セラピストが0名 → 処理中断');
    process.exit(1);
  }

  // Step 3: ロゴアップロード
  console.log('\n📤 Step 3: ロゴをStorageにアップロード中...');
  let finalImageUrl = null;
  try {
    const topRes = await fetch(WEBSITE_URL, { headers: ua });
    const topHtml = await topRes.text();
    const $t = cheerio.load(topHtml);

    let logoUrl = null;
    $t('img').each((i, el) => {
      if (logoUrl) return;
      const src = $t(el).attr('src') || '';
      const cls = $t(el).attr('class') || '';
      if (/logo/i.test(src + cls)) logoUrl = src;
    });
    if (!logoUrl) logoUrl = $t('header img').first().attr('src') || null;
    if (!logoUrl) {
      // og:image
      const ogMatch = topHtml.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
                   || topHtml.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
      if (ogMatch) logoUrl = ogMatch[1];
    }

    if (logoUrl) {
      if (!logoUrl.startsWith('http')) {
        if (!logoUrl.startsWith('/')) logoUrl = '/' + logoUrl;
        logoUrl = SITE_URL + logoUrl;
      }
      console.log('   ロゴURL:', logoUrl);
      const imgRes = await fetch(logoUrl, { headers: ua });
      if (imgRes.ok) {
        const imgBytes = new Uint8Array(await imgRes.arrayBuffer());
        const contentType = imgRes.headers.get('content-type') || 'image/png';
        const uploadRes = await fetch(
          `${supabaseUrl}/storage/v1/object/${STORAGE_BUCKET}/${LOGO_FILE_NAME}`,
          {
            method: 'POST',
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': contentType, 'x-upsert': 'true' },
            body: imgBytes
          }
        );
        if (uploadRes.ok) {
          finalImageUrl = `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${LOGO_FILE_NAME}`;
          console.log('   ✅ アップロード完了');
        } else {
          console.log(`   ⚠️  アップロード失敗: ${await uploadRes.text()}`);
        }
      }
    } else {
      console.log('   ⚠️  ロゴURL未検出 → スキップ');
    }
  } catch (e) {
    console.log(`   ⚠️  ${e.message}`);
  }

  // Step 4: shops更新
  console.log(`\n${'='.repeat(40)}`);
  console.log(`🏪 ${SHOP_ID}`);

  const shopUpdate = { schedule_url: SCHEDULE_URL, price_system, website_url: WEBSITE_URL };
  if (finalImageUrl) shopUpdate.image_url = finalImageUrl;

  const patchRes = await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.${SHOP_ID}`, {
    method: 'PATCH', headers, body: JSON.stringify(shopUpdate)
  });
  console.log(patchRes.ok ? '   ✅ shops更新完了' : `   ❌ 失敗: ${await patchRes.text()}`);

  // Step 5: 既存削除
  const delRes = await fetch(`${supabaseUrl}/rest/v1/therapists?shop_id=eq.${SHOP_ID}`, {
    method: 'DELETE', headers
  });
  console.log(delRes.ok ? '   ✅ 既存セラピスト削除完了' : `   ❌ ${await delRes.text()}`);

  // Step 6: バッチ登録
  const BATCH = 20;
  let inserted = 0, errors = 0;

  for (let i = 0; i < casts.length; i += BATCH) {
    const batch = casts.slice(i, i + BATCH);
    const records = batch.map(c => ({
      id: `${SHOP_ID}_${c.name.replace(/[\s　]+/g, '')}`,
      shop_id: SHOP_ID,
      name: c.name,
      image_url: c.image_url,
      is_active: true,
      raw_data: c.raw_data || {}
    }));

    const r = await fetch(`${supabaseUrl}/rest/v1/therapists`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'resolution=ignore-duplicates,return=minimal' },
      body: JSON.stringify(records)
    });

    if (r.ok) {
      inserted += batch.length;
    } else {
      console.log(`   ❌ バッチ失敗: ${(await r.text()).slice(0, 100)}`);
      errors += batch.length;
    }
  }

  console.log(`   ✅ ${inserted}名登録完了 / エラー ${errors}名`);
  console.log('\n' + '='.repeat(50));
  console.log('🎉 ページをリロードして確認してください！');
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
