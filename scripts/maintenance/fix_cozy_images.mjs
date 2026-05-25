/**
 * Cozy（高田馬場・赤羽） セラピスト写真修正
 * パターン: /storage/images/therapists/{hash}.jpg + alt=姓のみ
 * 実行: node scripts/maintenance/fix_cozy_images.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const BASE = 'https://cozy-esthetic.com';
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

// Chrome から取得した53名（alt=姓のみ）
const COZY_DATA = [
  ['宮近', `${BASE}/storage/images/therapists/eUcNWglTBEh8bU7xvlukWSAFBjU87mJZ3GBpWFOG.jpg`],
  ['水原', `${BASE}/storage/images/therapists/mdmcl1zb6IswkWjnghQRyodAWL7kOAKkHx9A4aFf.jpg`],
  ['黒崎', `${BASE}/storage/images/therapists/TKQyawujoQBtnRcPjpKox6ji4aut5mgIJ1dAX63L.jpg`],
  ['愛内', `${BASE}/storage/images/therapists/9LqeHpY5jaTHLLTZbaEm8wqeTD9rDR0CKmSMV33L.jpg`],
  ['沙京', `${BASE}/storage/images/therapists/oW7JYCGg4R0wPw3wt0OcDWDuGKW9ZlXjO0n3vAoK.jpg`],
  ['藍染', `${BASE}/storage/images/therapists/45PE4z51NmFppM9CsFiQoAkUdwnSqhFmc6hPQXFY.jpg`],
  ['雪森', `${BASE}/storage/images/therapists/mRsDgBVA2YpEx9YewyozXhBXWNsui7so1VmzXkle.jpg`],
  ['大城', `${BASE}/storage/images/therapists/wpIDuanY9muCcgO8gCO2yJPhU2ddlOV2dyRuVi19.jpg`],
  ['斎森', `${BASE}/storage/images/therapists/gL4ULlpO3gF8RWe7nvv0kE6oyr2zWN7nYzaDkHYW.jpg`],
  ['ひな野', `${BASE}/storage/images/therapists/aarIULw54Fbr5PNUJvOFulB0Yng2mYZReWUMff1c.jpg`],
  ['片平', `${BASE}/storage/images/therapists/96JIs8Sk3bgBXaVuV0XIN0mDMJTCEcIiixyyW5r7.jpg`],
  ['白山', `${BASE}/storage/images/therapists/qKTwQ99fpfJjve3f9tRYGhOVanQmpTv0nrBpI6St.jpg`],
  ['桃谷', `${BASE}/storage/images/therapists/RZdreObstQhoYD43ZFGvEIpyPuqx3xFm0ln9pXeF.jpg`],
  ['七峰', `${BASE}/storage/images/therapists/Jqv6nkIqC3Hnx6MusknZIyhKtVBw9qEyDWVjP96t.jpg`],
  ['内村', `${BASE}/storage/images/therapists/07rNQQDxuW4p4v4qmGFaYFmAicWnlyOgyZpFiJwB.jpg`],
  ['秋野', `${BASE}/storage/images/therapists/1dtjiMCD1lnvDxWT473qKCJfuwbXjYne7fguKlqR.jpg`],
  ['七川', `${BASE}/storage/images/therapists/7BXYhaf4LDuskeDDnB9IotbzkroxkjNdmEmRUe8M.jpg`],
  ['咲夜', `${BASE}/storage/images/therapists/qt5akeWqoEBKOtR3eRRfPx4Okfdoe21lxZulZ4qQ.jpg`],
  ['春野', `${BASE}/storage/images/therapists/CZU7hxQp9wQAsgy0snxtGYqCi9MovgIrXX52CfXE.jpg`],
  ['白瀬', `${BASE}/storage/images/therapists/79APi9rYJ2mr3qIrKf4vRCXQzz7qpRPNpzt8I4Cu.jpg`],
  ['春田', `${BASE}/storage/images/therapists/uel5oZfXK3SSeOmve5wmikAQLpPaasgafVXOJA4B.jpg`],
  ['林原', `${BASE}/storage/images/therapists/kfZ14Yad8mQGYQTTFvngxupUewqC9KnlOVRCwcuj.jpg`],
  ['三井', `${BASE}/storage/images/therapists/VEHXtAf5w6Y7jyv6U8faywf6WIWj81IVk8EAbtcO.jpg`],
  ['須藤', `${BASE}/storage/images/therapists/JtL3HqG9ANTNHcjEmqLagYWRH58zreWb2M2MZ8Vp.jpg`],
  ['倉田', `${BASE}/storage/images/therapists/citkenx2nuGVTqz30uKczTKlsvN8QHVeSIgjcUnN.jpg`],
  ['西園', `${BASE}/storage/images/therapists/MjeKJXlNf4lGYJ45lC2iy5g0tOvOINZTStb1JqNb.jpg`],
  ['柳澤', `${BASE}/storage/images/therapists/qBSUV0i1MfE2fC4iuPN3VMqgc8d4lOkzxX7nH49z.jpg`],
  ['桜庭', `${BASE}/storage/images/therapists/pows8H0SbcR7BrEn4U2YjIug67z4BeojF5o8jQ4x.jpg`],
  ['白波', `${BASE}/storage/images/therapists/ydWSJIx7b9HpCfLfg0h3RnVEZXCVSVa31l5q3sIu.jpg`],
  ['音羽', `${BASE}/storage/images/therapists/75wZgsArN5wCYMBd70MK23u2CLTdVg3V65O3fql8.jpg`],
  ['黒木', `${BASE}/storage/images/therapists/oJKHrw614uPKiTRgY8iJVP4XhRMByS9eunAm2UUX.jpg`],
  ['新川', `${BASE}/storage/images/therapists/b4bFUW85z4oNKvcdHIHHME3i5RTx4zWQ6BMSfmce.jpg`],
  ['源', `${BASE}/storage/images/therapists/EKJOFxIztzqLJcyrK7lZxRTnBrAXdbttJRJjsxaU.jpg`],
  ['早見', `${BASE}/storage/images/therapists/2tDkkT3rDIzfXZziHf7TPhjJkGPV3pV4iuQ3Nwrb.jpg`],
  ['永野', `${BASE}/storage/images/therapists/fIUIGayzf1u1DIQDRQzfoTm8kUAP31CqA3KLAarO.jpg`],
  ['宮田', `${BASE}/storage/images/therapists/8Eq0mcYRt8c7RCHAY013uH0gsM93zFbla8tvBwkq.jpg`],
  ['指原', `${BASE}/storage/images/therapists/AKAE2L1r2sPi8GzmDJ9lOZXlQv8PpoZOWMW7z388.jpg`],
  ['沢野', `${BASE}/storage/images/therapists/KXjde9ZiAEqG6u5GRMHfYYRJKsoi2Wo5ETBVuzoD.jpg`],
  ['大原', `${BASE}/storage/images/therapists/PztAyjlGUlA3Naa9da7Jd6rda4YjcQKNocoNl8M9.jpg`],
  ['千秋', `${BASE}/storage/images/therapists/ZR7KnyCClJWZ4nEPl7O0LreLWzJfc28Rb15HTzum.jpg`],
  ['沢木', `${BASE}/storage/images/therapists/TT6hzFQJXn7k7AAXZcEM5YV8x8bbCPIEuLkbZQa8.jpg`],
  ['平子', `${BASE}/storage/images/therapists/k7hTy2710HX47KIhVf5OnUL8W6iClRjP8itt82iV.jpg`],
  ['若葉', `${BASE}/storage/images/therapists/FzE256myyu9mpt25E6bFlQWMcuWN86kBWJN3Kdyg.jpg`],
  ['明石', `${BASE}/storage/images/therapists/70JlrWKU48dVdDEulrwZ4rsDbDBTBdXWaq0Fv30W.jpg`],
  ['大石', `${BASE}/storage/images/therapists/kn3MBgYxuDuoFA64xVIijRhjzsqHYWeJc1sfdQnz.jpg`],
  ['香月', `${BASE}/storage/images/therapists/hmFHAXdyTWJy4Cvve81Thr9QiySQW4JMgEVeOh3u.jpg`],
  ['横田', `${BASE}/storage/images/therapists/sfPl4McXrggYTBDB5rcCwEjWFAsf6ynNVP9v1eyj.jpg`],
  ['井本', `${BASE}/storage/images/therapists/eA87wcGzfdOK9tXb0dL2FChx5OoZ4k0xwBG2u2PE.jpg`],
  ['田川', `${BASE}/storage/images/therapists/fe6X8LpJ6YvOumcBeGriCzn9kCAjpcMX5Kuoc3TG.jpg`],
  ['佐川', `${BASE}/storage/images/therapists/o1Ja8dkmkuxgyYwPKGyXG0sYDEGxombQixVnKJis.jpg`],
  ['藤波', `${BASE}/storage/images/therapists/SBr7Ray0WtpkevmMbSdgC1WQ1SYqSzLYWv80c4HK.jpg`],
  ['原田', `${BASE}/storage/images/therapists/AaxzwEypAfV5FdBvP774yc9ie3JygUaG14iZjEua.jpg`],
  ['上杉', `${BASE}/storage/images/therapists/N7rAbfb0auHUdzcAGqgMzLJ4Xr2DwhOzETBiT5Bp.jpg`],
];

async function uploadImage(imageUrl, fileName) {
  try {
    const res = await fetch(imageUrl, {
      headers: { ...UA, Referer: BASE + '/' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { console.log(`\n  HTTP ${res.status}: ${imageUrl.slice(-50)}`); return null; }
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType: 'image/jpeg', upsert: true });
    if (error) { console.log(`\n  Storage: ${error.message}`); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (e) { console.log(`\n  fetch error: ${e.message}`); return null; }
}

const { data: shops } = await supabase.from('shops')
  .select('id, name')
  .ilike('website_url', '%cozy-esthetic%');

if (!shops || shops.length === 0) {
  console.log('Cozyの店舗が見つかりません');
  process.exit(1);
}
console.log(`対象店舗: ${shops.map(s => s.id + ' ' + s.name).join(', ')}\n`);

if (DRY_RUN) {
  console.log(`【Cozy】 ${COZY_DATA.length}名（姓のみ）`);
  COZY_DATA.slice(0, 5).forEach(([n, u]) => console.log(`  ${n} → ${u.split('/').pop()}`));
  process.exit(0);
}

let updated = 0, skipped = 0, notFound = 0, failed = 0;
const shopIds = shops.map(s => s.id);

for (const [name, imageUrl] of COZY_DATA) {
  const { data: therapists } = await supabase.from('therapists')
    .select('id, shop_id, image_url')
    .in('shop_id', shopIds)
    .eq('name', name);

  if (!therapists || therapists.length === 0) {
    process.stdout.write('?'); notFound++; continue;
  }

  const nullOnes = therapists.filter(t => !t.image_url);
  if (nullOnes.length === 0) { process.stdout.write('='); skipped++; continue; }

  const hash = imageUrl.split('/').pop().replace('.jpg', '').substring(0, 20);
  const fileName = `cozy_${hash}.jpg`;
  const storageUrl = await uploadImage(imageUrl, fileName);
  await sleep(100);

  for (const t of nullOnes) {
    const { error } = await supabase.from('therapists')
      .update({ image_url: storageUrl ?? null })
      .eq('id', t.id);
    if (error) { console.log(`\n❌ ${name}: ${error.message}`); failed++; }
    else { process.stdout.write(storageUrl ? '+' : 'n'); updated++; }
  }
  await sleep(80);
}

console.log(`\n\n更新 ${updated}件 / スキップ ${skipped}件 / 見つからず ${notFound}件 / 失敗 ${failed}件`);
console.log('\n完了');
