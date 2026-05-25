/**
 * MadameRest (マダムレスト) セラピスト・スケリンク・料金 登録
 * ※ロゴ画像なし（サイトにロゴ画像が存在しないため）
 * 実行: node scripts/insert/insert_madamerest_therapists.mjs
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

  const SHOP_ID = 'chiba_chiba_madame_rest';
  const SITE_URL = 'https://madamerest.magnum-f.net';
  const COMPANION_PAGE = 'https://madamerest.magnum-f.net/companion/';
  const SCHEDULE_URL = 'https://madamerest.magnum-f.net/schedule/';
  const WEBSITE_URL = 'https://madamerest.magnum-f.net';

  // 名前ではなくプロモーション用のエントリをスキップ
  const SKIP_NAMES = new Set(['お得なフリー割り', '技術向上委員会', 'クレジット決済']);

  const price_system = `【ご新規キャンペーン（フリー）】
80分: 10,000円
100分: 13,000円
120分: 16,000円

【特別割引（フリー）】
80分: 13,000円 / 100分: 16,000円 / 120分: 19,000円
140分: 23,000円 / 160分: 26,000円 / 180分: 29,000円

【通常料金（指名）】
80分: 16,000円 / 100分: 19,000円 / 120分: 22,000円
140分: 29,000円 / 160分: 32,000円 / 180分: 35,000円
延長20分: 8,000円`;

  const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

  console.log('🚀 MadameRest セットアップ開始\n');

  // Step 1: セラピストページ取得
  console.log('📄 Step 1: セラピストページを取得中...');
  const res = await fetch(COMPANION_PAGE, { headers: ua });
  const $ = cheerio.load(await res.text());
  console.log(`   ✅ HTML取得完了 (status: ${res.status})`);

  console.log('\n👩 Step 2: セラピストデータをパース中...');
  const casts = [];
  const seen = new Set();

  $('.list').each((i, listEl) => {
    // .samwrapper1（画像）と .saminfo2（情報）をペアで処理
    const wrappers = $(listEl).find('.samwrapper1');
    const infos = $(listEl).find('.saminfo2');

    wrappers.each((j, wrapper) => {
      const imgEl = $(wrapper).find('img[src*="ml_11_1"]').first();
      const src = imgEl.attr('src') || '';
      if (!src) return;

      const imageUrl = src.startsWith('http') ? src : SITE_URL + src;
      if (seen.has(imageUrl)) return;
      seen.add(imageUrl);

      // 名前: alt テキスト
      const name = (imgEl.attr('alt') || '').trim();
      if (!name || SKIP_NAMES.has(name)) return;

      // 対応する .saminfo2 からスペック取得
      const infoEl = infos.eq(j);
      const infoText = infoEl.text();

      const ageMatch = infoText.match(/(\d+)歳/);
      const age = ageMatch ? `${ageMatch[1]}歳` : '';

      const heightMatch = infoText.match(/T[．.。](\d+)/);
      const height = heightMatch ? heightMatch[1] : '';

      const bustMatch = infoText.match(/B(\d+)/);
      const bust = bustMatch ? bustMatch[1] : '';

      const waistMatch = infoText.match(/W(\d+)/);
      const waist = waistMatch ? waistMatch[1] : '';

      const hipMatch = infoText.match(/H(\d+)/);
      const hip = hipMatch ? hipMatch[1] : '';

      const raw_data = {};
      if (age) raw_data.age = age;
      if (height) raw_data.height = height;
      if (bust) raw_data.bust = bust;
      if (waist) raw_data.waist = waist;
      if (hip) raw_data.hip = hip;

      casts.push({ name, image_url: imageUrl, raw_data });
    });
  });

  console.log(`   ✅ ${casts.length}名のセラピストを取得`);
  casts.slice(0, 5).forEach(c =>
    console.log(`      ${c.name}（${c.raw_data.age || '-'}）T${c.raw_data.height || '-'} : ${c.image_url.slice(0, 70)}`)
  );

  if (casts.length === 0) {
    console.error('❌ セラピストが0名 → 処理中断');
    process.exit(1);
  }

  // Step 3: 店舗情報を更新（ロゴなし）
  console.log(`\n🏪 Step 3: ${SHOP_ID} を更新中...`);
  const shopUpdate = {
    schedule_url: SCHEDULE_URL,
    price_system,
    website_url: WEBSITE_URL,
  };

  const patchRes = await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.${SHOP_ID}`, {
    method: 'PATCH', headers, body: JSON.stringify(shopUpdate)
  });
  console.log(patchRes.ok ? '   ✅ shops更新完了' : `   ❌ 失敗: ${await patchRes.text()}`);

  // Step 4: 既存セラピスト削除 → 新規挿入
  console.log('\n🗑️  Step 4: 既存セラピストを削除中...');
  const delRes = await fetch(`${supabaseUrl}/rest/v1/therapists?shop_id=eq.${SHOP_ID}`, {
    method: 'DELETE', headers
  });
  console.log(delRes.ok ? '   ✅ 削除完了' : `   ❌ ${await delRes.text()}`);

  console.log('\n💾 Step 5: セラピストを登録中...');
  const BATCH = 20;
  let inserted = 0, errors = 0;

  for (let i = 0; i < casts.length; i += BATCH) {
    const batch = casts.slice(i, i + BATCH);
    const records = batch.map(c => ({
      id: `${SHOP_ID}_${c.name.replace(/[\s　()（）]+/g, '')}`,
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
  console.log('🎉 ページをリロードして確認してください！');
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
