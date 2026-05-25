/**
 * THE BLANC セラピスト登録 (caskan CMS)
 * 実行: node scripts/insert/insert_the_blanc_therapists.mjs
 */
import * as cheerio from 'cheerio';
import fs from 'fs';

const SHOP_ID = 'kanagawa_yokohama_the_blanc';
const SITE = 'https://the-blanc.site';
const SCHEDULE_URL = `${SITE}/schedule`;
const LOGO_URL = 'https://cdn2-caskan.com/caskan/img/shop_logo/1531_logo_1737440034.png';
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

async function run() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => envContent.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
  const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };

  // ── 1. セラピストページ取得 ───────────────────────────────
  console.log('セラピストページ取得中...');
  const res = await fetch(`${SITE}/therapist`, { headers: ua });
  const $ = cheerio.load(await res.text());
  console.log(`HTTP: ${res.status}`);

  const therapists = [];
  const seen = new Set();

  $('li:has(img[src*="caskan"])').each((_, el) => {
    const imgEl = $(el).find('img[src*="caskan/img/cast_tmb"]').first();
    if (!imgEl.length) return; // SNSアイコン等をスキップ

    const rawName = (imgEl.attr('alt') || '').trim();
    if (!rawName || seen.has(rawName)) return;
    if (!/[぀-ヿ一-鿿ぁ-ん]/.test(rawName)) return; // 日本語なし → スキップ
    seen.add(rawName);

    const imageUrl = imgEl.attr('src') || '';
    const text = $(el).text().replace(/\s+/g, ' ').trim();

    const raw_data = {};
    const ageM = text.match(/(\d{2,3})\s*歳/);
    const heightM = text.match(/T\.?(\d{3})|(\d{3})\s*cm/i);
    const cupM = text.match(/([A-J])\s*カップ/i) || text.match(/\(([A-J])\)/i);
    if (ageM) raw_data.age = parseInt(ageM[1]);
    if (heightM) raw_data.height = parseInt(heightM[1] || heightM[2]);
    if (cupM) raw_data.cup = cupM[1].toUpperCase();

    therapists.push({ name: rawName, image_url: imageUrl, raw_data });
  });

  console.log(`\n登録対象: ${therapists.length}名`);
  therapists.slice(0, 8).forEach(t =>
    console.log(`  ${t.name} age=${t.raw_data.age} h=${t.raw_data.height} cup=${t.raw_data.cup}`)
  );

  if (therapists.length === 0) {
    console.log('❌ セラピスト0名');
    return;
  }

  // ── 2. ロゴアップロード ───────────────────────────────────
  console.log('\nロゴアップロード中...');
  const logoRes = await fetch(LOGO_URL, { headers: ua });
  let logoPublicUrl = null;
  if (logoRes.ok) {
    const blob = await logoRes.arrayBuffer();
    const ext = 'png';
    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/shop-logos/${SHOP_ID}.${ext}`, {
      method: 'POST',
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'image/png', 'x-upsert': 'true' },
      body: blob,
    });
    if (uploadRes.ok) {
      logoPublicUrl = `${supabaseUrl}/storage/v1/object/public/shop-logos/${SHOP_ID}.${ext}`;
      console.log(`ロゴ ✅`);
    } else {
      console.log(`ロゴ失敗: ${await uploadRes.text()}`);
    }
  }

  // ── 3. 店舗更新・セラピスト登録 ─────────────────────────
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
