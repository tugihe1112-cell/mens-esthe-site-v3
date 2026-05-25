/**
 * KOBE QUEEN セラピスト再挿入 + 料金設定
 * - 既存セラピスト削除 → therapist.html から写真付きで再挿入
 * - price_system 設定
 *
 * 実行: node scripts/insert/insert_kobe_queen.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const ua = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

const SHOP_ID = 'hyogo_sannomiya_kobe_queen';
const PRICE_SYSTEM = { "90": 13000, "120": 18000, "150": 23000, "180": 28000, "210": 34000, "240": 40000, "270": 46000 };

async function uploadImage(imageUrl, therapistId) {
  try {
    const res = await fetch(imageUrl, { headers: { 'User-Agent': ua['User-Agent'] }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 512) return null;
    const ext = imageUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
    const safeExt = ['jpg','jpeg','png','gif','webp'].includes(ext) ? ext : 'jpg';
    const fileName = `${therapistId}.${safeExt}`;
    const { error } = await supabase.storage.from('therapist-images')
      .upload(fileName, buffer, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('therapist-images').getPublicUrl(fileName);
    return publicUrl;
  } catch { return null; }
}

// ============================================================
// therapist.html スクレイプ
// ============================================================
console.log('therapist.html 取得中...');
const res = await fetch('https://kobe-queen.net/therapist.html', { headers: ua });
const html = await res.text();
const $ = cheerio.load(html);

const therapists = [];
const seen = new Set();

$('div.staff-box').each((_, el) => {
  const $el = $(el);

  // 画像URL: style="background-image:url(//kobe-queen.net/data/staff/xxx/yyy.jpg);"
  const style = $el.find('.staff-image a').attr('style') || '';
  const imgMatch = style.match(/url\(["']?\/\/([^"')]+)["']?\)/);
  const imgUrl = imgMatch ? `https://${imgMatch[1]}` : null;

  // 名前+年齢: "かよ(22)"
  const nameText = $el.find('.staff-name').first().text().trim();
  const nameMatch = nameText.match(/^([^\d（(]+)[（(](\d{2,3})[)）]?/);
  if (!nameMatch) return;

  const name = nameMatch[1].trim();
  const age = parseInt(nameMatch[2]);

  if (!name || name.length < 1 || seen.has(name)) return;
  seen.add(name);

  // スペック情報（身長・カップ）
  const text = $el.text().replace(/\s+/g, ' ');
  const heightMatch = text.match(/(\d{3})\s*cm/i) || text.match(/T(\d{3})/i);
  const cupMatch = text.match(/([A-K])\s*[カカップcup]/i);

  therapists.push({
    name,
    age,
    height: heightMatch ? parseInt(heightMatch[1]) : null,
    cup: cupMatch ? cupMatch[1].toUpperCase() : null,
    imgUrl,
  });
});

console.log(`取得: ${therapists.length}名`);
therapists.slice(0, 5).forEach(t => console.log(`  ${t.name}(${t.age}歳) ${t.imgUrl ? '📷 ' + t.imgUrl : '画像なし'}`));
if (therapists.length > 5) console.log(`  ...他${therapists.length - 5}名`);

if (DRY_RUN) {
  console.log('\n[DRY RUN] 終了');
  process.exit(0);
}

if (therapists.length === 0) {
  console.log('0名のため終了');
  process.exit(1);
}

// ============================================================
// 既存セラピスト削除
// ============================================================
console.log('\n既存セラピスト削除中...');
const { error: delErr } = await supabase.from('therapists').delete().eq('shop_id', SHOP_ID);
if (delErr) { console.log('❌ 削除失敗:', delErr.message); process.exit(1); }
console.log('✅ 削除完了');

// ============================================================
// 再挿入
// ============================================================
console.log('\nセラピスト挿入中...');
let inserted = 0;
for (const t of therapists) {
  const therapistId = `${SHOP_ID}_${t.name.replace(/\s+/g, '_').replace(/[^\w぀-鿿ぁ-ん]/g, '')}`;
  const storedUrl = t.imgUrl ? await uploadImage(t.imgUrl, therapistId) : null;
  process.stdout.write('.');
  const { error } = await supabase.from('therapists').upsert({
    id: therapistId,
    shop_id: SHOP_ID,
    name: t.name,
    age: t.age,
    height: t.height,
    cup: t.cup,
    image_url: storedUrl || t.imgUrl || null,
  });
  if (!error) inserted++;
  else console.log(`\n  ❌ ${t.name}: ${error.message}`);
}
console.log(`\n✅ セラピスト挿入: ${inserted}/${therapists.length}名`);

// ============================================================
// price_system 設定
// ============================================================
console.log('\nprice_system 設定中...');
const { error: priceErr } = await supabase.from('shops')
  .update({ price_system: PRICE_SYSTEM })
  .eq('id', SHOP_ID);
console.log(priceErr ? `❌ 失敗: ${priceErr.message}` : `✅ price_system設定: ${JSON.stringify(PRICE_SYSTEM)}`);

console.log('\n完了');
