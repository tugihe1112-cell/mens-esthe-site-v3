/**
 * ささやき (旧ラビット) セラピスト・ロゴ・スケリンク 登録
 * ※料金は動的ページのため取得不可 → price_system は手動で更新してください
 * 実行: node scripts/insert/insert_sasayaki_therapists.mjs
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

  const SHOP_ID = 'chiba_kashiwa_sasayaki';
  const SITE_URL = 'https://sasayaki-esthe.com';
  const ITEM_PAGE = 'https://sasayaki-esthe.com/itemList.html';
  const SCHEDULE_URL = 'https://sasayaki-esthe.com/scheduleAll.html';
  const WEBSITE_URL = 'https://sasayaki-esthe.com';
  const LOGO_URL = 'https://sasayaki-esthe.com/upFu8/1005326/official/officialConf/logoresponsive/img/logo1.png';
  const STORAGE_BUCKET = 'shop-logos';
  const LOGO_FILE_NAME = 'Sasayaki.png';

  const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

  console.log('🚀 ささやき セットアップ開始\n');

  // Step 1: セラピストページ取得
  console.log('📄 Step 1: セラピストページを取得中...');
  const res = await fetch(ITEM_PAGE, { headers: ua });
  const $ = cheerio.load(await res.text());
  console.log(`   ✅ HTML取得完了 (status: ${res.status})`);

  console.log('\n👩 Step 2: セラピストデータをパース中...');
  const casts = [];
  const seen = new Set();

  $('.castFrameWrap').each((i, el) => {
    // picture > source の srcset から画像URL取得（lazy load対策）
    const source = $(el).find('picture source').first();
    const srcset = source.attr('srcset') || '';
    const srcFromSet = srcset.split(',')[0].trim().split(' ')[0];

    // img src をフォールバック
    const imgSrc = $(el).find('img').first().attr('src') || '';
    const rawSrc = srcFromSet || imgSrc;

    if (!rawSrc) return;
    // noimage はスキップ
    if (rawSrc.includes('itemNoImage') || rawSrc.includes('noimage')) return;

    const imageUrl = rawSrc.startsWith('http') ? rawSrc : SITE_URL + rawSrc;
    if (seen.has(imageUrl)) return;
    seen.add(imageUrl);

    // 名前と年齢: "鏡のえる(26歳)" → name="鏡のえる", age="26歳"
    const nameRaw = ($(el).find('.itemName').text() || '').trim();
    const ageMatch = nameRaw.match(/[（(](\d+)歳?[）)]/);
    const age = ageMatch ? `${ageMatch[1]}歳` : '';
    const name = nameRaw.replace(/[（(]\d+歳?[）)]/g, '').trim();

    if (!name) return;

    const raw_data = {};
    if (age) raw_data.age = age;

    casts.push({ name, image_url: imageUrl, raw_data });
  });

  console.log(`   ✅ ${casts.length}名のセラピストを取得`);
  casts.slice(0, 5).forEach(c =>
    console.log(`      ${c.name}（${c.raw_data.age || '-'}）: ${c.image_url.slice(0, 70)}`)
  );

  if (casts.length === 0) {
    console.error('❌ セラピストが0名 → 処理中断');
    process.exit(1);
  }

  // Step 3: ロゴアップロード
  console.log('\n📤 Step 3: ロゴをStorageにアップロード中...');
  let finalLogoUrl = null;
  try {
    const imgRes = await fetch(LOGO_URL, { headers: ua });
    if (imgRes.ok) {
      const imgBytes = new Uint8Array(await imgRes.arrayBuffer());
      const contentType = imgRes.headers.get('content-type') || 'image/png';
      const uploadRes = await fetch(
        `${supabaseUrl}/storage/v1/object/${STORAGE_BUCKET}/${LOGO_FILE_NAME}`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': contentType,
            'x-upsert': 'true'
          },
          body: imgBytes
        }
      );
      if (uploadRes.ok) {
        finalLogoUrl = `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${LOGO_FILE_NAME}`;
        console.log('   ✅ アップロード完了:', finalLogoUrl);
      } else {
        console.log(`   ⚠️  アップロード失敗: ${await uploadRes.text()}`);
      }
    } else {
      console.log(`   ⚠️  ロゴ取得失敗: ${imgRes.status}`);
    }
  } catch (e) {
    console.log(`   ⚠️  ${e.message}`);
  }

  // Step 4: 店舗情報を更新（price_system は空→後で手動入力）
  console.log(`\n🏪 Step 4: ${SHOP_ID} を更新中...`);
  const shopUpdate = {
    schedule_url: SCHEDULE_URL,
    website_url: WEBSITE_URL,
  };
  if (finalLogoUrl) shopUpdate.image_url = finalLogoUrl;

  const patchRes = await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.${SHOP_ID}`, {
    method: 'PATCH', headers, body: JSON.stringify(shopUpdate)
  });
  console.log(patchRes.ok ? '   ✅ shops更新完了' : `   ❌ 失敗: ${await patchRes.text()}`);

  // Step 5: 既存セラピスト削除 → 新規挿入
  console.log('\n🗑️  Step 5: 既存セラピストを削除中...');
  const delRes = await fetch(`${supabaseUrl}/rest/v1/therapists?shop_id=eq.${SHOP_ID}`, {
    method: 'DELETE', headers
  });
  console.log(delRes.ok ? '   ✅ 削除完了' : `   ❌ ${await delRes.text()}`);

  console.log('\n💾 Step 6: セラピストを登録中...');
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

    if (r.ok) inserted += batch.length;
    else { console.log(`   ❌ バッチ失敗: ${(await r.text()).slice(0, 100)}`); errors += batch.length; }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 完了: ${inserted}名登録 / エラー ${errors}名`);
  console.log('⚠️  料金(price_system)は動的ページのため未設定です。Supabaseで手動入力してください。');
  console.log('🎉 ページをリロードして確認してください！');
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
