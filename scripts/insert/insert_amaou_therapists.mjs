/**
 * ミセスあまおうセラピ (amaou-therapi.jp) セラピスト挿入
 * 実行: node scripts/insert/insert_amaou_therapists.mjs
 */
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SHOP_ID = 'osaka_tanimachi9_amaou';
const THERAPIST_URL = 'https://amaou-therapi.jp/lady.php';
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

async function uploadImage(imageUrl, therapistId) {
  try {
    const res = await fetch(imageUrl, { headers: ua, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const ext = imageUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
    const { error } = await supabase.storage.from('therapist-images')
      .upload(`${therapistId}.${ext}`, buffer, { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('therapist-images').getPublicUrl(`${therapistId}.${ext}`);
    return publicUrl;
  } catch (e) { return null; }
}

async function run() {
  const res = await fetch(THERAPIST_URL, { headers: ua });
  const html = await res.text();
  const $ = cheerio.load(html);

  const therapists = [];

  // img.o-pack.jp を含む親要素を探索
  $('img[src*="o-pack.jp"]').each((_, el) => {
    const $img = $(el);
    const imgSrc = $img.attr('src') || '';
    if (!imgSrc) return;

    // 親要素(li, div, article)からテキスト取得
    const parent = $img.closest('li, div, article, section, tr').first();
    const text = parent.text().replace(/\s+/g, ' ').trim();

    // 名前: 「〇〇セラピスト」の〇〇部分 (前の苗字のみ or 2-4文字の漢字)
    const nameMatch = text.match(/^([^\s]{1,6})セラピスト/) || text.match(/([^\d\s（(【]{2,8})(?:\s*\d+歳)/);
    const name = nameMatch?.[1]?.trim();
    if (!name || /logo|banner|recruit|求人/i.test(name)) return;

    const ageMatch = text.match(/(\d{2,3})\s*歳/);
    const heightMatch = text.match(/T\s*(\d{3})/);
    const cupMatch = text.match(/([A-J])\s*(?:カップ|cup)/i);

    therapists.push({
      name,
      imgSrc,
      age: ageMatch ? parseInt(ageMatch[1]) : null,
      height: heightMatch ? parseInt(heightMatch[1]) : null,
      cup: cupMatch ? cupMatch[1].toUpperCase() : null,
    });
  });

  const unique = [...new Map(therapists.map(t => [t.name, t])).values()];
  console.log(`取得: ${unique.length}名`);
  unique.forEach(t => console.log(`  ${t.name} (${t.age}歳, T${t.height})`));

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
