/**
 * 花の雨リラクゼーション セラピスト・ロゴ・料金 一括登録
 * 実行: node insert_hananoame_therapists.mjs
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

  const SHOP_ID = 'tokyo_dispatch_hananoame';
  const SITE_URL = 'https://hananoame.com';
  const STAFF_BASE = 'https://hananoame.com/staff/';
  const WEBSITE_URL = 'https://hananoame.com';
  const LOGO_URL = 'https://hananoame.com/wp-content/themes/hananoame/images/logo_header_pc_hananoame.svg';
  const STORAGE_BUCKET = 'shop-logos';
  const LOGO_FILE_NAME = 'HananoAme.svg';

  const price_system = `90分: 15,000円（初回割 14,000円）
120分: 18,000円（初回割 17,000円）
150分: 22,000円（初回割 21,000円）
180分: 26,000円（初回割 25,000円）
210分: 30,000円（初回割 29,000円）
延長: 30分毎 5,000円 / 指名料金: 1,000円`;

  const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

  console.log('🚀 花の雨リラクゼーション セットアップ開始\n');

  // Step 1: 全ページ取得（ページネーション対応）
  console.log('📄 Step 1: スタッフページを取得中...');
  const casts = [];
  const seen = new Set();
  let pageUrl = STAFF_BASE;
  let pageNum = 1;

  while (pageUrl) {
    console.log(`   ページ ${pageNum}: ${pageUrl}`);
    const res = await fetch(pageUrl, { headers: ua });
    const $ = cheerio.load(await res.text());

    $('.staff_item').each((i, el) => {
      const imgEl = $(el).find('.staff_img img').first();
      const src = imgEl.attr('src') || '';

      // テーマ画像・空srcをスキップ
      if (!src || src.includes('/themes/')) return;

      const imageUrl = src.startsWith('http') ? src : SITE_URL + src;
      if (seen.has(imageUrl)) return;
      seen.add(imageUrl);

      // 名前（alt属性 or .table_td 最初）
      const altName = imgEl.attr('alt') || '';
      const tdName  = $(el).find('.table_td').first().text().trim();
      const name    = (altName || tdName).trim();
      if (!name) return;

      casts.push({ name, image_url: imageUrl, raw_data: {} });
    });

    // 次ページリンク
    const nextLink = $('a.next, .list_pagenavi a.next, .pagenavi a[rel="next"]').first().attr('href');
    pageUrl = nextLink && nextLink !== pageUrl ? nextLink : null;
    pageNum++;
    if (pageNum > 20) break; // 安全弁
  }

  console.log(`   ✅ ${casts.length}名のセラピストを取得`);
  casts.slice(0, 5).forEach(c =>
    console.log(`      ${c.name} : ${c.image_url.slice(0, 70)}`)
  );

  if (casts.length === 0) {
    console.error('❌ セラピストが0名 → 処理中断');
    process.exit(1);
  }

  // Step 2: ロゴアップロード
  console.log('\n📤 Step 2: ロゴをStorageにアップロード中...');
  let finalImageUrl = null;
  try {
    const imgRes = await fetch(LOGO_URL, { headers: ua });
    if (imgRes.ok) {
      const imgBytes = new Uint8Array(await imgRes.arrayBuffer());
      const contentType = imgRes.headers.get('content-type') || 'image/svg+xml';
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
    } else {
      console.log(`   ⚠️  ロゴ取得失敗: ${imgRes.status}`);
    }
  } catch (e) {
    console.log(`   ⚠️  ${e.message}`);
  }

  // Step 3: shops更新
  console.log(`\n${'='.repeat(40)}`);
  console.log(`🏪 ${SHOP_ID}`);

  const shopUpdate = { price_system, website_url: WEBSITE_URL };
  if (finalImageUrl) shopUpdate.image_url = finalImageUrl;

  const patchRes = await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.${SHOP_ID}`, {
    method: 'PATCH', headers, body: JSON.stringify(shopUpdate)
  });
  console.log(patchRes.ok ? '   ✅ shops更新完了' : `   ❌ 失敗: ${await patchRes.text()}`);

  // Step 4: 既存削除
  const delRes = await fetch(`${supabaseUrl}/rest/v1/therapists?shop_id=eq.${SHOP_ID}`, {
    method: 'DELETE', headers
  });
  console.log(delRes.ok ? '   ✅ 既存セラピスト削除完了' : `   ❌ ${await delRes.text()}`);

  // Step 5: バッチ登録
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
