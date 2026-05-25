/**
 * イーエスドールプレミアム 修正再挿入 (images_staff で絞り込み)
 * 実行: node scripts/insert/fix_esdoll_therapists.mjs
 */
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SHOP_ID = 'osaka_sakaisujihonmachi_es_doll';
const THERAPIST_URL = 'https://e-s-doll.com/staff.php';
const BASE_URL = 'https://e-s-doll.com';
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// NGワード（UI/システム用の名前）
const NG_ALTS = /^(ボタン|メニュー|バナー|ロゴ|アイコン|button|menu|logo|icon|banner|矢印|arrow|close|open|top|back|next|prev)$/i;

async function uploadImage(imageUrl, therapistId) {
  try {
    const res = await fetch(imageUrl, { headers: ua, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const ext = imageUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
    const fileName = `${therapistId}.${ext}`;
    const { error } = await supabase.storage.from('therapist-images')
      .upload(fileName, buffer, { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('therapist-images').getPublicUrl(fileName);
    return publicUrl;
  } catch (e) { return null; }
}

async function run() {
  const res = await fetch(THERAPIST_URL, { headers: ua });
  const html = await res.text();
  const $ = cheerio.load(html);

  const therapists = [];

  // images_staff パターンの画像のみ対象
  $('img[src*="images_staff"]').each((_, el) => {
    const $img = $(el);
    const src = $img.attr('src') || '';
    const alt = ($img.attr('alt') || '').trim();

    // NGワードをスキップ
    if (!alt || alt.length < 2 || NG_ALTS.test(alt)) return;
    if (/^\d+$/.test(alt)) return; // 数字のみ

    const fullSrc = src.startsWith('http') ? src : BASE_URL + (src.startsWith('/') ? src : '/' + src);

    // 親要素からテキスト取得
    const parent = $img.closest('li, div, tr, article').first();
    const text = parent.text().replace(/\s+/g, ' ').trim();
    const ageMatch = text.match(/(\d{2,3})\s*歳/) || text.match(/age[\s.:]*(\d{2,3})/i);
    const heightMatch = text.match(/T[．.:]?\s*(\d{3})/) || text.match(/(\d{3})\s*cm/i);
    const cupMatch = text.match(/([A-J])\s*(?:カップ|cup)/i);

    therapists.push({
      name: alt,
      imgSrc: fullSrc,
      age: ageMatch ? parseInt(ageMatch[1]) : null,
      height: heightMatch ? parseInt(heightMatch[1]) : null,
      cup: cupMatch?.[1]?.toUpperCase() || null,
    });
  });

  const unique = [...new Map(therapists.map(t => [t.name, t])).values()];
  console.log(`取得: ${unique.length}名`);
  unique.slice(0, 8).forEach(t => console.log(`  ${t.name} (${t.age}歳) → ${t.imgSrc.slice(0, 60)}`));

  // 既存削除
  console.log('\n既存削除中...');
  const { error: delErr } = await supabase.from('therapists').delete().eq('shop_id', SHOP_ID);
  if (delErr) console.log(`削除エラー: ${delErr.message}`);

  let inserted = 0;
  for (const t of unique) {
    const therapistId = `${SHOP_ID}_${t.name.replace(/\s+/g, '_').replace(/[^\w぀-鿿ぁ-ん]/g, '')}`;
    const storedUrl = await uploadImage(t.imgSrc, therapistId);
    const { error } = await supabase.from('therapists').upsert({
      id: therapistId, shop_id: SHOP_ID, name: t.name,
      age: t.age, height: t.height, cup: t.cup,
      image_url: storedUrl || t.imgSrc,
    });
    if (error) console.log(`  挿入エラー: ${error.message}`);
    else { inserted++; process.stdout.write('.'); }
  }
  console.log(`\n✅ ${inserted}名挿入完了`);
}
run().catch(e => console.error('❌', e.message));
