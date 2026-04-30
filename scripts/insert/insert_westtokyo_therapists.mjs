/**
 * WEST TOKYO (旧結有) セラピスト・ロゴ・スケリンク・料金 一括登録
 * 小金井店・国分寺店 両方更新
 * 実行: node insert_westtokyo_therapists.mjs
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
    'tokyo_koganei_west_tokyo',
    'tokyo_kokubunji_west_tokyo',
  ];
  const SITE_URL = 'https://esthe-westtokyo.com';
  const STAFFS_API = 'https://esthe-westtokyo.com/manage/?res=load&type=js&js=staffs';
  const SCHEDULE_URL = 'https://esthe-westtokyo.com/schedule.html';
  const WEBSITE_URL = 'https://esthe-westtokyo.com';
  const STORAGE_BUCKET = 'shop-logos';
  const LOGO_FILE_NAME = 'WestTokyo.png';

  // ★ 料金システム（ユーザー提供の料金表から入力）
  const price_system = `60分: 12,000円
90分: 17,000円
120分: 21,000円`;

  const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

  console.log('🚀 WEST TOKYO セットアップ開始\n');

  // Step 1: スタッフAPIからHTML取得
  console.log('📄 Step 1: スタッフデータを取得中...');
  const staffRes = await fetch(STAFFS_API, { headers: ua });
  const staffHtml = await staffRes.text();
  console.log(`   ✅ HTML取得完了 (${staffHtml.length} chars)`);

  // Step 2: パース
  console.log('\n👩 Step 2: セラピストデータをパース中...');
  const $ = cheerio.load(staffHtml);
  const casts = [];
  const seen = new Set();

  $('.c-list-therapist__item').each((i, el) => {
    const imgEl = $(el).find('img').first();
    const src = imgEl.attr('src') || '';

    // プレースホルダー画像をスキップ
    if (!src || src.includes('cast_default.png') || src.includes('db.esthp.com')) return;

    // 画像URL（相対→絶対）
    const imageUrl = src.startsWith('http') ? src : SITE_URL + src;

    // 重複チェック
    if (seen.has(imageUrl)) return;
    seen.add(imageUrl);

    // 名前（スパン1つ目、絵文字を除去）
    const nameSpan = $(el).find('.c-list-therapist__name span').first();
    const rawName = nameSpan.text().trim()
      .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')   // サロゲートペア絵文字
      .replace(/[☀-⟿]/gu, '')           // 一般的な記号・絵文字
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '') // サロゲートペア
      .replace(/🔰|⭐|★|☆|♡|♥|💕|💗|💓|💖|💞|✨|🌸|🌺|🌼|🍀|🎀|💎|👑/g, '')
      .trim();

    if (!rawName || rawName.length < 1) return;

    // 年齢（スパン2つ目 "(22)" → "22歳"）
    const ageSpan = $(el).find('.c-list-therapist__name span').eq(1);
    const ageText = ageSpan.text().trim();
    const ageMatch = ageText.match(/\(?(\d+)\)?/);
    const age = ageMatch ? ageMatch[1] + '歳' : null;

    // スペック (例: "T.155 (D)", "T.163 B.88(E) W.58 H.85")
    const specText = $(el).find('.c-list-therapist__spec').text().trim();
    const heightMatch = specText.match(/T[.\s]*(\d{2,3})/i);
    const bustSizeMatch = specText.match(/B[.\s]*(\d{2,3})/i);
    const bustCupMatch = specText.match(/B[.\s]*\d{0,3}\s*[\(（]([A-Z]+)[\)）]/i)
                      || specText.match(/T[.\s]*\d{2,3}\s*[\(（]([A-Z]+)[\)）]/i)
                      || specText.match(/\(([A-Z])\)/i);
    const waistMatch = specText.match(/W[.\s]*(\d{2,3})/i);
    const hipMatch   = specText.match(/H[.\s]*(\d{2,3})/i);

    const raw_data = {};
    if (age) raw_data.age = age;
    if (heightMatch) raw_data.height = 'T' + heightMatch[1];
    if (bustSizeMatch) {
      raw_data.bust = 'B' + bustSizeMatch[1] + (bustCupMatch ? '(' + bustCupMatch[1] + ')' : '');
    } else if (bustCupMatch) {
      raw_data.bust = '(' + bustCupMatch[1] + ')';
    }
    if (waistMatch) raw_data.waist = 'W' + waistMatch[1];
    if (hipMatch)   raw_data.hip   = 'H' + hipMatch[1];

    casts.push({ name: rawName, image_url: imageUrl, raw_data });
  });

  console.log(`   ✅ ${casts.length}名のセラピストを取得`);
  casts.slice(0, 5).forEach(c =>
    console.log(`      ${c.name} / ${JSON.stringify(c.raw_data)} : ${c.image_url.slice(0, 70)}`)
  );

  if (casts.length === 0) {
    console.error('❌ セラピストが0名 → 処理中断');
    process.exit(1);
  }

  // Step 3: ロゴ取得・アップロード
  console.log('\n📤 Step 3: ロゴをStorageにアップロード中...');
  let finalImageUrl = null;
  try {
    // トップページのOG画像をロゴとして使用
    const topRes = await fetch(WEBSITE_URL, { headers: ua });
    const topHtml = await topRes.text();
    const ogMatch = topHtml.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
                 || topHtml.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);

    let logoUrl = null;
    if (ogMatch) {
      logoUrl = ogMatch[1];
    } else {
      // header内のimg src
      const headerStart = topHtml.indexOf('<header');
      const headerEnd   = topHtml.indexOf('</header>');
      const headerHtml  = headerStart >= 0 ? topHtml.slice(headerStart, headerEnd + 9) : '';
      const imgMatch = headerHtml.match(/<img[^>]+src="([^"]+\.(png|jpg|svg|webp))"/i);
      if (imgMatch) logoUrl = imgMatch[1];
    }

    if (logoUrl) {
      if (!logoUrl.startsWith('http')) logoUrl = SITE_URL + logoUrl;
      console.log('   ロゴURL:', logoUrl);
      const imgRes = await fetch(logoUrl, { headers: ua });
      if (imgRes.ok) {
        const imgBytes  = new Uint8Array(await imgRes.arrayBuffer());
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

  // Step 4: 各店舗を更新
  for (const SHOP_ID of SHOPS) {
    console.log(`\n${'='.repeat(40)}`);
    console.log(`🏪 ${SHOP_ID}`);

    // shops更新
    const shopUpdate = { schedule_url: SCHEDULE_URL, price_system, website_url: WEBSITE_URL };
    if (finalImageUrl) shopUpdate.image_url = finalImageUrl;

    const patchRes = await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.${SHOP_ID}`, {
      method: 'PATCH', headers, body: JSON.stringify(shopUpdate)
    });
    console.log(patchRes.ok ? '   ✅ shops更新完了' : `   ❌ 失敗: ${await patchRes.text()}`);

    // 既存セラピスト削除
    const delRes = await fetch(`${supabaseUrl}/rest/v1/therapists?shop_id=eq.${SHOP_ID}`, {
      method: 'DELETE', headers
    });
    console.log(delRes.ok ? '   ✅ 既存セラピスト削除完了' : `   ❌ ${await delRes.text()}`);

    // バッチ登録
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
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 完了: ${casts.length}名 × ${SHOPS.length}店舗`);
  console.log('🎉 ページをリロードして確認してください！');
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
