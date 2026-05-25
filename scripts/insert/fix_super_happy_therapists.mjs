/**
 * スーパーハッピーガールズ 修正再挿入 (figcaption正しく解析)
 * 実行: node scripts/insert/fix_super_happy_therapists.mjs
 */
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SHOP_IDS = ['osaka_nipponbashi_super_happy', 'osaka_umeda_super_happy_girls'];
const THERAPIST_URL = 'https://super-happy.net/therapist';
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
  $('figure:has(img)').each((_, el) => {
    const $el = $(el);
    const img = $el.find('img').first();
    const imgSrc = img.attr('src') || img.attr('data-src') || '';
    if (!imgSrc || /logo|banner|icon|sns|twitter|line|instagram/i.test(imgSrc)) return;

    // figcaptionを改行で分割して正しく解析
    // 形式: "美月サナ(21)\n                164cm【E】"
    const figcaption = $el.find('figcaption').text();
    const lines = figcaption.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length < 1) return;

    const line1 = lines[0]; // "美月サナ(21)"
    const line2 = lines[1] || ''; // "164cm【E】"

    // 名前と年齢をline1から
    const nameAgeMatch = line1.match(/^(.+?)\((\d{2,3})\)$/);
    if (!nameAgeMatch) return;
    const name = nameAgeMatch[1].trim();
    const age = parseInt(nameAgeMatch[2]);

    // 身長とカップをline2から
    const heightMatch = line2.match(/(\d{3})\s*cm/i);
    const cupMatch = line2.match(/【([A-J])】/);

    const fullImgSrc = imgSrc.startsWith('http') ? imgSrc : new URL(imgSrc, THERAPIST_URL).href;
    // ?以降のキャッシュバスターを1つだけにする
    const cleanImgUrl = fullImgSrc.replace(/(\?[^?]+)\?[^?]+$/, '$1');

    therapists.push({
      name,
      imgSrc: cleanImgUrl,
      age,
      height: heightMatch ? parseInt(heightMatch[1]) : null,
      cup: cupMatch ? cupMatch[1].toUpperCase() : null,
    });
  });

  const unique = [...new Map(therapists.map(t => [t.name, t])).values()];
  console.log(`取得: ${unique.length}名`);
  unique.slice(0, 5).forEach(t => console.log(`  ${t.name} (${t.age}歳, T${t.height}, ${t.cup}cup)`));

  for (const shopId of SHOP_IDS) {
    console.log(`\n[${shopId}] 既存削除 → 再挿入...`);
    // 既存削除
    const { error: delErr } = await supabase.from('therapists').delete().eq('shop_id', shopId);
    if (delErr) console.log(`  削除エラー: ${delErr.message}`);

    let inserted = 0;
    for (const t of unique) {
      const therapistId = `${shopId}_${t.name.replace(/\s+/g, '_').replace(/[^\w぀-鿿ぁ-ん]/g, '')}`;
      const storedUrl = await uploadImage(t.imgSrc, therapistId);
      const { error } = await supabase.from('therapists').upsert({
        id: therapistId, shop_id: shopId, name: t.name,
        age: t.age, height: t.height, cup: t.cup,
        image_url: storedUrl || t.imgSrc,
      });
      if (error) console.log(`  挿入エラー: ${error.message}`);
      else { inserted++; process.stdout.write('.'); }
    }
    console.log(`\n  ✅ ${inserted}名挿入完了`);
  }
}
run().catch(e => console.error('❌', e.message));
