/**
 * エステ美人マダム セラピスト・ロゴ・スケリンク・料金 一括登録
 * 三鷹・吉祥寺・国分寺 全店舗同一内容
 * 実行: node insert_madamu_therapists.mjs
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
    'tokyo_mitaka_esthe_bijin_madam',
    'tokyo_musashino_kichijoji_esthe_bijin_madam',
    'tokyo_kokubunji_esthe_bijin_madam',
  ];
  const THERAPIST_PAGE = 'https://mitaka.esthe-madamu.com/staff_list/';
  const SCHEDULE_URL = 'https://mitaka.esthe-madamu.com/schedule/';
  const WEBSITE_URL = 'https://mitaka.esthe-madamu.com';
  const LOGO_URL = 'https://mitaka.esthe-madamu.com/wp/wp-content/themes/madamu/assets/img/title-new.png';
  const STORAGE_BUCKET = 'shop-logos';
  const LOGO_FILE_NAME = 'EstheMadamu.png';

  const price_system = `70分(ノーマル): 11,000円
90分(人気コース): 13,000円
120分(ゆったりコース): 18,000円
150分(ゆったりコース): 23,000円`;

  console.log('🚀 エステ美人マダム セットアップ開始\n');

  const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

  // Step 1: スタッフページ取得
  console.log('📄 Step 1: スタッフページを取得中...');
  const res = await fetch(THERAPIST_PAGE, { headers: ua });
  const html = await res.text();
  console.log(`   ✅ HTML取得完了 (${html.length} chars)`);

  const $ = cheerio.load(html);

  // Step 2: パース（WordPress, alt="名前（年齢）"）
  console.log('\n👩 Step 2: セラピストデータをパース中...');
  const casts = [];
  const seen = new Set();

  $('img').each((i, el) => {
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt') || '';

    if (!src.includes('wp-content/uploads')) return;
    if (!alt || alt.length < 2) return;
    if (/png|svg|logo|icon|title|btn|tel|map/i.test(src)) return;

    // "りな(45)" or "まこと（38）" → name="まこと", age="38"
    const ageMatch = alt.match(/[\(（](\d+)[\)）]/);
    const age = ageMatch ? ageMatch[1] + '歳' : null;
    const name = alt.replace(/\s*[\(（]\d+[\)）].*$/, '').trim();
    if (!name || name.length < 2) return;

    if (seen.has(src)) return;
    seen.add(src);

    const raw_data = {};
    if (age) raw_data.age = age;

    casts.push({ name, image_url: src, raw_data });
  });

  console.log(`   ✅ ${casts.length}名のセラピストを取得`);
  casts.slice(0, 5).forEach(c =>
    console.log(`      ${c.name}${c.raw_data.age ? '(' + c.raw_data.age + ')' : ''}: ${c.image_url.slice(0, 60)}`)
  );

  // Step 3: ロゴアップロード
  console.log('\n📤 Step 3: ロゴをStorageにアップロード中...');
  let finalImageUrl = null;
  try {
    const imgRes = await fetch(LOGO_URL, { headers: ua });
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
        raw_data: c.raw_data
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
