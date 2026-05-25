/**
 * オトナコード4030 セラピスト登録
 * 実行: node scripts/insert/insert_otona_code_therapists.mjs
 */
import * as cheerio from 'cheerio';
import fs from 'fs';

const SHOP_ID = 'tokyo_shibuya_yoyogi_harajuku_otona_code';
const SITE = 'https://code4030.com';
const SCHEDULE_URL = `${SITE}/schedule/`;
const LOGO_URL = `${SITE}/wp-content/uploads/2025/06/otonacode000-2.png`;
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

async function run() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => envContent.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
  const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };

  console.log('セラピストページ取得中...');
  const res = await fetch(`${SITE}/cast/`, { headers: ua });
  const $ = cheerio.load(await res.text());
  console.log(`HTTP: ${res.status}`);

  const therapists = [];
  const seen = new Set();

  // wp-content/uploads の画像を持つ li
  $('li:has(img[src*="wp-content/uploads"])').each((_, el) => {
    const imgEl = $(el).find('img[src*="wp-content/uploads"]').first();
    if (!imgEl.length) return;

    const name = (imgEl.attr('alt') || '').trim();
    if (!name || seen.has(name)) return;
    // SNS/ロゴ系を除外
    if (/LINE|Twitter|logo|ico_/i.test(name)) return;
    seen.add(name);

    const imageUrl = imgEl.attr('src') || '';
    const text = $(el).text().replace(/\s+/g, ' ').trim();

    const raw_data = {};
    const ageM = text.match(/AGE[\s.]*(\d{2,3})/i) || text.match(/(\d{2,3})\s*歳/);
    const heightM = text.match(/(\d{3})\s*[㎝cm]/i) || text.match(/T[．.]\s*(\d{3})/);
    const cupM = text.match(/([A-J])\s*カップ/i) || text.match(/\(([A-J])\)/i);
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
    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/shop-logos/${SHOP_ID}.png`, {
      method: 'POST',
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'image/png', 'x-upsert': 'true' },
      body: blob,
    });
    if (uploadRes.ok) { logoPublicUrl = `${supabaseUrl}/storage/v1/object/public/shop-logos/${SHOP_ID}.png`; console.log('ロゴ ✅'); }
    else console.log(`ロゴ失敗: ${await uploadRes.text()}`);
  }

  const shopUpdate = { schedule_url: SCHEDULE_URL };
  if (logoPublicUrl) shopUpdate.image_url = logoPublicUrl;
  await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.${SHOP_ID}`, { method: 'PATCH', headers, body: JSON.stringify(shopUpdate) });
  console.log('店舗更新 ✅');
  await fetch(`${supabaseUrl}/rest/v1/therapists?shop_id=eq.${SHOP_ID}`, { method: 'DELETE', headers });
  console.log('既存削除 ✅');

  const rows = therapists.map((t, i) => ({
    id: `${SHOP_ID}_${t.name.replace(/[\s　（）()]+/g, '')}_${i}`,
    shop_id: SHOP_ID, name: t.name, image_url: t.image_url, raw_data: t.raw_data,
  }));
  const insRes = await fetch(`${supabaseUrl}/rest/v1/therapists`, {
    method: 'POST', headers: { ...headers, 'Prefer': 'return=minimal' }, body: JSON.stringify(rows),
  });
  console.log(`挿入: ${insRes.ok ? `✅ ${rows.length}名` : `❌ ${await insRes.text()}`}`);
  console.log('完了 ✅');
}
run().catch(e => { console.error('❌', e.message); process.exit(1); });
