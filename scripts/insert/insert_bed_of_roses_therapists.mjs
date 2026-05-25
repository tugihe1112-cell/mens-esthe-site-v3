/**
 * Bed of Roses セラピスト登録 (3days CMS)
 * 実行: node scripts/insert/insert_bed_of_roses_therapists.mjs
 */
import fs from 'fs';

const SHOP_ID = 'kanagawa_musashikosugi_bed_of_roses';
const SITE = 'https://bed-of-roses.site';
const DATA_JS_URL = 'https://3days-cms-bucket-prod.s3.ap-northeast-1.amazonaws.com/cms-content/1043/js/data.js';
const SCHEDULE_URL = `${SITE}/schedule.html`;
const LOGO_URL = `${SITE}/assets/img/logoHeader.png`;
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

async function run() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => envContent.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
  const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };

  // ── 1. data.js 取得・パース ───────────────────────────────────
  console.log('data.js 取得中...');
  const dataRes = await fetch(DATA_JS_URL, { headers: ua });
  console.log(`HTTP: ${dataRes.status}`);
  const dataJs = await dataRes.text();

  // data.js の先頭確認
  console.log('\n=== data.js 先頭500文字 ===');
  console.log(dataJs.slice(0, 500));

  // eval でパース（unquoted keys の JS オブジェクトリテラル対応）
  let parsed = null;
  try {
    // var shopData = {...} → shopData を取り出す
    const evalResult = {};
    const wrappedCode = dataJs.replace(
      /^(?:var|const|let)\s+(\w+)\s*=/,
      (_, varName) => `evalResult["${varName}"] =`
    );
    // eslint-disable-next-line no-new-func
    new Function('evalResult', wrappedCode)(evalResult);
    parsed = Object.values(evalResult)[0];
    console.log('\n✅ eval パース成功');
  } catch (e) {
    console.log('\n⚠️ eval パース失敗:', e.message);
    console.log('data.js 先頭2000文字:');
    console.log(dataJs.slice(0, 2000));
    return;
  }

  // ── 2. セラピスト抽出 ─────────────────────────────────────────
  console.log('\n=== データ構造 ===');
  if (Array.isArray(parsed)) {
    console.log(`配列: ${parsed.length}件`);
    console.log('先頭1件:', JSON.stringify(parsed[0], null, 2).slice(0, 300));
  } else {
    console.log('キー:', Object.keys(parsed).join(', '));
    // セラピスト配列を探す
    for (const key of Object.keys(parsed)) {
      if (Array.isArray(parsed[key])) {
        console.log(`  ${key}: ${parsed[key].length}件`);
        if (parsed[key].length > 0) console.log('  先頭1件:', JSON.stringify(parsed[key][0], null, 2).slice(0, 300));
      }
    }
  }

  // セラピスト配列 (3days CMS: parsed.therapists)
  const castList = parsed.therapists || [];
  console.log(`\nセラピスト候補: ${castList.length}件`);

  // schedules から therapistId ごとのスペックをまとめる
  const specMap = {};
  for (const s of (parsed.schedules || [])) {
    const tid = s.therapistId || s.id;
    if (!tid) continue;
    if (!specMap[tid]) {
      specMap[tid] = {
        age: s.age,
        height: s.height,
        threeSize: s.threeSize || s.three_size || '',
      };
    }
  }

  const therapists = [];
  const seen = new Set();

  for (const item of castList) {
    // 3days CMS: therapistName
    const name = (item.therapistName || item.name || item.cast_name || '').trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);

    // 画像URL: img1 → img2 → image
    let imageUrl = item.img1 || item.img2 || item.image || item.img || '';
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = imageUrl.startsWith('/') ? `${SITE}${imageUrl}` : `${SITE}/${imageUrl}`;
    }

    // スペック: therapist自身のフィールド → schedules から補完
    const spec = specMap[item.id] || {};
    const raw_data = {};
    const age = item.age || spec.age;
    const height = item.height || spec.height;
    const threeSize = item.threeSize || item.three_size || spec.threeSize || '';
    if (age) raw_data.age = parseInt(age);
    if (height) raw_data.height = parseInt(height);
    // threeSize 例: "88(H)" → cup=H, または単体 "H" → cup=H
    const cupMatch = threeSize.match(/\(([A-J])\)/) || threeSize.match(/^([A-J])$/);
    if (cupMatch) raw_data.cup = cupMatch[1];

    therapists.push({ name, image_url: imageUrl, raw_data });
  }

  console.log(`\n登録対象: ${therapists.length}名`);
  therapists.slice(0, 8).forEach(t =>
    console.log(`  ${t.name} age=${t.raw_data.age} h=${t.raw_data.height} cup=${t.raw_data.cup} img=${t.image_url.slice(0, 50)}`)
  );

  if (therapists.length === 0) {
    console.log('❌ セラピスト0名。data.jsの構造を確認してください。');
    return;
  }

  // ── 3. ロゴアップロード ───────────────────────────────────────
  console.log('\nロゴアップロード中...');
  const logoRes = await fetch(LOGO_URL, { headers: ua });
  let logoPublicUrl = null;
  if (logoRes.ok) {
    const blob = await logoRes.arrayBuffer();
    const ext = LOGO_URL.split('.').pop() || 'png';
    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/shop-logos/${SHOP_ID}.${ext}`, {
      method: 'POST',
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': `image/${ext === 'jpg' ? 'jpeg' : ext}`, 'x-upsert': 'true' },
      body: blob,
    });
    if (uploadRes.ok) {
      logoPublicUrl = `${supabaseUrl}/storage/v1/object/public/shop-logos/${SHOP_ID}.${ext}`;
      console.log(`ロゴ ✅`);
    } else {
      console.log(`ロゴ失敗: ${await uploadRes.text()}`);
    }
  }

  // ── 4. 店舗更新・セラピスト登録 ─────────────────────────────
  const shopUpdate = { schedule_url: SCHEDULE_URL };
  if (logoPublicUrl) shopUpdate.image_url = logoPublicUrl;
  const shopRes = await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.${SHOP_ID}`, {
    method: 'PATCH', headers, body: JSON.stringify(shopUpdate),
  });
  console.log(`\n店舗更新: ${shopRes.ok ? '✅' : `❌ ${await shopRes.text()}`}`);

  const delRes = await fetch(`${supabaseUrl}/rest/v1/therapists?shop_id=eq.${SHOP_ID}`, {
    method: 'DELETE', headers,
  });
  console.log(`既存削除: ${delRes.ok ? '✅' : '❌'}`);

  const rows = therapists.map((t, i) => ({
    id: `${SHOP_ID}_${t.name.replace(/[\s　]+/g, '')}_${i}`,
    shop_id: SHOP_ID,
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
  console.log('\n完了 ✅');
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
