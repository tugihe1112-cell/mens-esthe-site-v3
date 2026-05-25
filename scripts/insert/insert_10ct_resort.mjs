/**
 * 10ct RESORT セラピスト挿入
 * /staff.php の img[src*="images_staff/"] をパース
 *
 * 実行: node scripts/insert/insert_10ct_resort.mjs [--dry-run]
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

const SHOP_ID = 'hyogo_sannomiya_10ct_resort';
const BASE_URL = 'https://10ct-resort.com';

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

function isValidName(name) {
  if (!name || name.length < 2 || name.length > 10) return false;
  if (/^\d+$/.test(name)) return false;
  if (/神戸|三宮|メンズ|エステ|リゾート|RESORT|スタッフ|セラピスト|在籍|new|icon|recruit|logo|アクセス|LINE|問い合わせ|予約|求人/i.test(name)) return false;
  return true;
}

// /staff.php を取得
const res = await fetch(`${BASE_URL}/staff.php`, { headers: ua });
const html = await res.text();
const $ = cheerio.load(html);

const therapists = [];
const seen = new Set();

// images_staff ディレクトリの画像のみ対象
$('img[src*="images_staff/"]').each((_, el) => {
  const src = $(el).attr('src') || '';
  const alt = $(el).attr('alt') || '';

  // altが名前として有効かチェック
  if (!isValidName(alt)) return;
  if (seen.has(alt)) return;
  seen.add(alt);

  const fullSrc = src.startsWith('http') ? src : `${BASE_URL}/${src.replace(/^\//, '')}`;

  // 親要素から年齢・スペック取得
  const parent = $(el).closest('li, div, article, section');
  const text = parent.text().replace(/\s+/g, ' ').trim();
  const ageMatch = text.match(/[（(](\d{2,3})[)）]/) || text.match(/(\d{2,3})\s*歳/);
  const heightMatch = text.match(/(\d{3})\s*cm/i) || text.match(/T(\d{3})/i);
  const cupMatch = text.match(/([A-K])\s*[カカップcup]/i);

  therapists.push({
    name: alt,
    age: ageMatch ? parseInt(ageMatch[1]) : null,
    height: heightMatch ? parseInt(heightMatch[1]) : null,
    cup: cupMatch ? cupMatch[1].toUpperCase() : null,
    imgSrc: fullSrc,
  });
});

console.log(`10ct RESORT セラピスト取得: ${therapists.length}名`);
therapists.forEach(t => console.log(`  ${t.name} (${t.age}歳) 📷`));

if (DRY_RUN) {
  console.log('\n[DRY RUN] 挿入スキップ');
  process.exit(0);
}

if (therapists.length === 0) {
  console.log('0名のため終了');
  process.exit(1);
}

let inserted = 0;
for (const t of therapists) {
  const therapistId = `${SHOP_ID}_${t.name.replace(/\s+/g, '_').replace(/[^\w぀-鿿ぁ-ん]/g, '')}`;
  const storedUrl = await uploadImage(t.imgSrc, therapistId);
  const { error } = await supabase.from('therapists').upsert({
    id: therapistId, shop_id: SHOP_ID, name: t.name,
    age: t.age, height: t.height, cup: t.cup,
    image_url: storedUrl || t.imgSrc || null,
  });
  if (!error) inserted++;
  else console.log(`  ❌ ${t.name}: ${error.message}`);
}

console.log(`\n✅ 挿入完了: ${inserted}/${therapists.length}名`);
