/**
 * Guarigione (グアリジョーネ) セラピスト登録
 * 実行: node scripts/insert/insert_guarigione_therapists.mjs
 */
import * as cheerio from 'cheerio';
import fs from 'fs';

const SHOP_ID = 'kanagawa_yokohama_guarigione';
const SITE = 'https://www.spa-g.net';
const SCHEDULE_URL = `${SITE}/schedule.html`;
const LOGO_URL = `${SITE}/templates_c/10501a24bfc4febcf52a4a118b7b0b85.jpg`;
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

async function run() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => envContent.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
  const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };

  console.log('セラピストページ取得中...');
  const res = await fetch(`${SITE}/therapist.html`, { headers: ua });
  const $ = cheerio.load(await res.text());
  console.log(`HTTP: ${res.status}`);

  const therapists = [];
  const seen = new Set();

  $('div.girl').each((_, el) => {
    // 画像: templates_c/ ハッシュ画像
    const imgEl = $(el).find('img[src*="templates_c/"]').first();
    let imageUrl = imgEl.attr('src') || '';
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = imageUrl.startsWith('/') ? `${SITE}${imageUrl}` : `${SITE}/${imageUrl}`;
    }

    // .name テキスト例: "松川 ほずみ AGE.25 T:162 B:112(L)"
    const nameText = $(el).find('.name').first().text().replace(/\s+/g, ' ').trim();
    if (!nameText) return;

    // 名前: "AGE." より前
    const name = nameText.replace(/AGE\..*/i, '').trim();
    if (!name || seen.has(name)) return;
    if (!/[぀-ヿ一-鿿ぁ-ん]/.test(name) && name.length < 2) return;
    seen.add(name);

    const raw_data = {};
    const ageM = nameText.match(/AGE[.:]?\s*(\d{2,3})/i);
    const heightM = nameText.match(/T[：:]\s*(\d{3})/);
    const cupM = nameText.match(/B[：:]\d+\(([A-Z])\)/i);
    if (ageM) raw_data.age = parseInt(ageM[1]);
    if (heightM) raw_data.height = parseInt(heightM[1]);
    if (cupM) raw_data.cup = cupM[1].toUpperCase();

    therapists.push({ name, image_url: imageUrl, raw_data });
  });

  console.log(`\n登録対象: ${therapists.length}名`);
  therapists.slice(0, 8).forEach(t =>
    console.log(`  ${t.name} age=${t.raw_data.age} h=${t.raw_data.height} cup=${t.raw_data.cup}`)
  );
  if (therapists.length === 0) { console.log('❌ 0名'); return; }

  // ロゴ
  console.log('\nロゴアップロード中...');
  const logoRes = await fetch(LOGO_URL, { headers: ua });
  let logoPublicUrl = null;
  if (logoRes.ok) {
    const blob = await logoRes.arrayBuffer();
    const ext = 'jpg';
    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/shop-logos/${SHOP_ID}.${ext}`, {
      method: 'POST',
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'image/jpeg', 'x-upsert': 'true' },
      body: blob,
    });
    if (uploadRes.ok) { logoPublicUrl = `${supabaseUrl}/storage/v1/object/public/shop-logos/${SHOP_ID}.${ext}`; console.log('ロゴ ✅'); }
    else console.log(`ロゴ失敗: ${await uploadRes.text()}`);
  }

  const shopUpdate = { schedule_url: SCHEDULE_URL };
  if (logoPublicUrl) shopUpdate.image_url = logoPublicUrl;
  await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.${SHOP_ID}`, { method: 'PATCH', headers, body: JSON.stringify(shopUpdate) });
  console.log('店舗更新 ✅');
  await fetch(`${supabaseUrl}/rest/v1/therapists?shop_id=eq.${SHOP_ID}`, { method: 'DELETE', headers });
  console.log('既存削除 ✅');

  const rows = therapists.map((t, i) => ({
    id: `${SHOP_ID}_${t.name.replace(/[\s　]+/g, '')}_${i}`,
    shop_id: SHOP_ID, name: t.name, image_url: t.image_url, raw_data: t.raw_data,
  }));
  const insRes = await fetch(`${supabaseUrl}/rest/v1/therapists`, {
    method: 'POST', headers: { ...headers, 'Prefer': 'return=minimal' }, body: JSON.stringify(rows),
  });
  console.log(`挿入: ${insRes.ok ? `✅ ${rows.length}名` : `❌ ${await insRes.text()}`}`);
  console.log('完了 ✅');
}
run().catch(e => { console.error('❌', e.message); process.exit(1); });
