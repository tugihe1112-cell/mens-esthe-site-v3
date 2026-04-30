/**
 * ラビットスパ (Rabbit Spa) セラピスト・ロゴ・スケリンク・料金 一括登録
 * 立川店・八王子店 両方更新
 * 実行: node insert_rabbit_therapists.mjs
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

  const SHOPS = [
    'tokyo_tachikawa_rabbit_spa',
    'tokyo_hachioji_rabbit_spa',
  ];
  const THERAPIST_PAGE = 'https://rabbitspa-tachikawa.com/therapist';
  const SCHEDULE_URL = 'https://rabbitspa-tachikawa.com/schedule';
  const WEBSITE_URL = 'https://rabbitspa-tachikawa.com';
  const STORAGE_BUCKET = 'shop-logos';
  const LOGO_FILE_NAME = 'RabbitSpa.png';

  const price_system = `80分: 16,000円
100分: 20,000円
120分: 24,000円`;

  console.log('🚀 ラビットスパ セットアップ開始\n');

  const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

  // Step 1: セラピストページ取得
  console.log('📄 Step 1: セラピストページを取得中...');
  const res = await fetch(THERAPIST_PAGE, { headers: ua });
  const html = await res.text();
  console.log(`   ✅ HTML取得完了 (${html.length} chars)`);

  const $ = cheerio.load(html);

  // Step 2: パース（caskanシステム）
  console.log('\n👩 Step 2: セラピストデータをパース中...');
  const casts = [];
  const seen = new Set();

  $('.therapist-datas-each').each((i, el) => {
    const imgEl = $(el).find('img.therapist-data-each-tmb').first();
    const src = imgEl.attr('src') || '';
    const rawName = $(el).find('.therapist-datas-name').text().trim();

    if (!src || !src.includes('cdn2-caskan.com/caskan/img/cast_tmb')) return;
    if (!rawName) return;

    const name = rawName.replace(/【[^】]*】/g, '').replace(/\s+/g, '').trim();
    if (!name || name.length < 2) return;

    if (seen.has(src)) return;
    seen.add(src);

    casts.push({ name, image_url: src });
  });

  console.log(`   ✅ ${casts.length}名のセラピストを取得`);
  casts.slice(0, 5).forEach(c =>
    console.log(`      ${c.name}: ${c.image_url.slice(0, 70)}`)
  );

  // Step 3: ロゴアップロード（caskan shop_logo パターン）
  console.log('\n📤 Step 3: ロゴをStorageにアップロード中...');
  let finalImageUrl = null;
  try {
    const logoMatch = html.match(/cdn2-caskan\.com\/caskan\/img\/shop_logo\/[^"'\s]+/);
    const logoSrc = logoMatch ? 'https://' + logoMatch[0] : null;

    if (logoSrc) {
      console.log(`   ロゴURL: ${logoSrc}`);
      const imgRes = await fetch(logoSrc, { headers: ua });
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
      console.log('   ⚠️  caskanロゴURLが見つかりませんでした');
    }
  } catch (e) {
    console.log(`   ⚠️  ${e.message}`);
  }

  // Step 4〜6: 各店舗を更新
  for (const SHOP_ID of SHOPS) {
    console.log(`\n${'='.repeat(40)}`);
    console.log(`🏪 ${SHOP_ID}`);

    const shopUpdate = { schedule_url: SCHEDULE_URL, price_system, website_url: WEBSITE_URL };
    if (finalImageUrl) shopUpdate.image_url = finalImageUrl;

    const patchRes = await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.${SHOP_ID}`, {
      method: 'PATCH', headers, body: JSON.stringify(shopUpdate)
    });
    console.log(patchRes.ok ? '   ✅ shops更新完了' : `   ❌ 失敗: ${await patchRes.text()}`);

    const delRes = await fetch(`${supabaseUrl}/rest/v1/therapists?shop_id=eq.${SHOP_ID}`, {
      method: 'DELETE', headers
    });
    console.log(delRes.ok ? '   ✅ 既存セラピスト削除完了' : `   ❌ ${await delRes.text()}`);

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
        raw_data: {}
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
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 完了: ${casts.length}名 × ${SHOPS.length}店舗`);
  console.log('🎉 ページをリロードして確認してください！');
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
